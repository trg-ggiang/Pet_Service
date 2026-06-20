const {
  doctorExamRecord,
  doctorId,
  prismaExamAppointment,
} = require("../mocks/doctorOperations.mock");

const mockGetPrismaClient = jest.fn();

jest.mock("../../src/lib/prisma", () => ({
  getPrismaClient: () => mockGetPrismaClient(),
}));

const {
  completeDoctorExam,
  saveDoctorExamDraft,
} = require("../../src/services/doctor/doctorExamCompletionService");

function createTx(overrides = {}) {
  return {
    appointment: {
      findFirst: jest.fn().mockResolvedValue(prismaExamAppointment),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      create: jest.fn(),
      ...overrides.appointment,
    },
    appointmentService: {
      update: jest.fn().mockResolvedValue(null),
      ...overrides.appointmentService,
    },
    doctorScheduleSlot: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn().mockResolvedValue(null),
      ...overrides.doctorScheduleSlot,
    },
    invoice: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 1200, paymentStatus: "UNPAID" }),
      update: jest.fn().mockResolvedValue(null),
      ...overrides.invoice,
    },
    invoiceItem: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([{ totalPrice: 250000 }]),
      ...overrides.invoiceItem,
    },
    medicalVisit: {
      upsert: jest.fn().mockResolvedValue({ id: 1300 }),
      ...overrides.medicalVisit,
    },
    notification: {
      create: jest.fn(),
      ...overrides.notification,
    },
    prescription: {
      deleteMany: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(null),
      ...overrides.prescription,
    },
    service: {
      findFirst: jest.fn(),
      ...overrides.service,
    },
  };
}

function mockPrismaTx(tx) {
  mockGetPrismaClient.mockReturnValue({
    $transaction: jest.fn(async (callback) => callback(tx)),
  });
}

describe("doctorExamCompletionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("rejects invalid doctor profile before opening a transaction", async () => {
    // Arrange
    const invalidDoctorId = 0;

    // Act
    const action = () => saveDoctorExamDraft({
      appointmentId: prismaExamAppointment.id,
      doctorId: invalidDoctorId,
      record: doctorExamRecord,
    });

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 403 });
    expect(mockGetPrismaClient).not.toHaveBeenCalled();
  });

  test("saves an exam draft for an in-progress appointment", async () => {
    // Arrange
    const tx = createTx({
      appointment: {
        findFirst: jest.fn().mockResolvedValue({ id: prismaExamAppointment.id, status: "IN_PROGRESS" }),
      },
    });
    mockPrismaTx(tx);

    // Act
    const result = await saveDoctorExamDraft({
      appointmentId: prismaExamAppointment.id,
      doctorId,
      record: doctorExamRecord,
    });

    // Assert
    expect(result).toEqual({ medicalVisitId: 1300 });
    expect(tx.medicalVisit.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { appointmentId: prismaExamAppointment.id },
        create: expect.objectContaining({
          symptoms: "cough, fever",
          diagnosisNote: doctorExamRecord.clinicalNote,
        }),
      }),
    );
    expect(tx.prescription.deleteMany).toHaveBeenCalledWith({ where: { medicalVisitId: 1300 } });
    expect(tx.prescription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          medicalVisitId: 1300,
        }),
      }),
    );
  });

  test("rejects exam draft when appointment has not started", async () => {
    // Arrange
    const tx = createTx({
      appointment: {
        findFirst: jest.fn().mockResolvedValue({ id: prismaExamAppointment.id, status: "CONFIRMED" }),
      },
    });
    mockPrismaTx(tx);

    // Act
    const action = () => saveDoctorExamDraft({
      appointmentId: prismaExamAppointment.id,
      doctorId,
      record: doctorExamRecord,
    });

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 409 });
    expect(tx.medicalVisit.upsert).not.toHaveBeenCalled();
  });

  test("completes exam, creates invoice line and closes the schedule slot", async () => {
    // Arrange
    const tx = createTx();
    mockPrismaTx(tx);

    // Act
    const result = await completeDoctorExam({
      appointmentId: prismaExamAppointment.id,
      doctorId,
      record: doctorExamRecord,
    });

    // Assert
    expect(result).toEqual({ followUpAppointment: null });
    expect(tx.appointment.updateMany).toHaveBeenCalledWith({
      where: { id: prismaExamAppointment.id, doctorId, status: "IN_PROGRESS" },
      data: { status: "COMPLETED" },
    });
    expect(tx.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          appointmentId: prismaExamAppointment.id,
          totalAmount: 250000,
          paymentStatus: "UNPAID",
        }),
      }),
    );
    expect(tx.invoiceItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          invoiceId: 1200,
          medicalVisitId: 1300,
          sourceType: "MEDICAL_VISIT",
          totalPrice: 250000,
        }),
      }),
    );
    expect(tx.appointmentService.update).toHaveBeenCalledWith({
      where: { id: 1002 },
      data: { status: "COMPLETED" },
    });
    expect(tx.doctorScheduleSlot.update).toHaveBeenCalledWith({
      where: { id: 902 },
      data: { status: "DONE" },
    });
  });
});
