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

  test("creates a follow-up appointment and reserves its available slot", async () => {
    // Arrange
    const followUpRecord = {
      ...doctorExamRecord,
      nextVisitDate: "2099-08-01",
      nextVisitTime: "10:00",
    };
    const followUpSlot = { id: 903 };
    const tx = createTx({
      appointment: {
        findFirst: jest.fn()
          .mockResolvedValueOnce(prismaExamAppointment)
          .mockResolvedValueOnce(null),
        create: jest.fn().mockResolvedValue({ id: 503 }),
      },
      doctorScheduleSlot: {
        findFirst: jest.fn().mockResolvedValue(followUpSlot),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      service: {
        findFirst: jest.fn().mockResolvedValue({ id: 402, price: 250000 }),
      },
    });
    mockPrismaTx(tx);

    // Act
    const result = await completeDoctorExam({
      appointmentId: prismaExamAppointment.id,
      doctorId,
      record: followUpRecord,
    });

    // Assert
    expect(result.followUpAppointment).toEqual({
      id: 503,
      date: "2099-08-01",
      time: "10:00:00",
    });
    expect(tx.doctorScheduleSlot.updateMany).toHaveBeenCalledWith({
      where: { id: followUpSlot.id, status: "AVAILABLE" },
      data: { status: "BOOKED" },
    });
    expect(tx.appointment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        petId: prismaExamAppointment.petId,
        doctorId,
        doctorScheduleSlotId: followUpSlot.id,
        status: "PENDING",
        appointmentServices: {
          create: expect.objectContaining({ serviceId: 402, status: "PENDING" }),
        },
      }),
    });
    expect(tx.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 602, type: "APPOINTMENT" }),
    });
  });

  test("rejects a follow-up appointment when the doctor is already busy", async () => {
    // Arrange
    const tx = createTx({
      appointment: {
        findFirst: jest.fn()
          .mockResolvedValueOnce(prismaExamAppointment)
          .mockResolvedValueOnce({ id: 999 }),
      },
    });
    mockPrismaTx(tx);

    // Act
    const action = () => completeDoctorExam({
      appointmentId: prismaExamAppointment.id,
      doctorId,
      record: { ...doctorExamRecord, nextVisitDate: "2099-08-01", nextVisitTime: "10:00" },
    });

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 409 });
    expect(tx.doctorScheduleSlot.findFirst).not.toHaveBeenCalled();
    expect(tx.appointment.create).not.toHaveBeenCalled();
  });

  test("rejects a follow-up appointment when another request wins the slot race", async () => {
    // Arrange
    const tx = createTx({
      appointment: {
        findFirst: jest.fn()
          .mockResolvedValueOnce(prismaExamAppointment)
          .mockResolvedValueOnce(null),
      },
      doctorScheduleSlot: {
        findFirst: jest.fn().mockResolvedValue({ id: 903 }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    });
    mockPrismaTx(tx);

    // Act
    const action = () => completeDoctorExam({
      appointmentId: prismaExamAppointment.id,
      doctorId,
      record: { ...doctorExamRecord, nextVisitDate: "2099-08-01", nextVisitTime: "10:00" },
    });

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 409 });
    expect(tx.appointment.create).not.toHaveBeenCalled();
    expect(tx.notification.create).not.toHaveBeenCalled();
  });

  test("updates an existing medical invoice item instead of duplicating it", async () => {
    // Arrange
    const tx = createTx({
      invoice: {
        findUnique: jest.fn().mockResolvedValue({ id: 1200, paymentStatus: "UNPAID" }),
      },
      invoiceItem: {
        findFirst: jest.fn().mockResolvedValue({ id: 1400 }),
        findMany: jest.fn().mockResolvedValue([{ totalPrice: 250000 }, { totalPrice: 75000 }]),
      },
    });
    mockPrismaTx(tx);

    // Act
    await completeDoctorExam({
      appointmentId: prismaExamAppointment.id,
      doctorId,
      record: doctorExamRecord,
    });

    // Assert
    expect(tx.invoice.create).not.toHaveBeenCalled();
    expect(tx.invoiceItem.create).not.toHaveBeenCalled();
    expect(tx.invoiceItem.update).toHaveBeenCalledWith({
      where: { id: 1400 },
      data: expect.objectContaining({ medicalVisitId: 1300, totalPrice: 250000 }),
    });
    expect(tx.invoice.update).toHaveBeenCalledWith({
      where: { id: 1200 },
      data: expect.objectContaining({ subtotalAmount: 325000, totalAmount: 325000 }),
    });
  });

  test("does not recalculate totals for an invoice that is already paid", async () => {
    // Arrange
    const tx = createTx({
      invoice: {
        findUnique: jest.fn().mockResolvedValue({ id: 1200, paymentStatus: "PAID" }),
      },
    });
    mockPrismaTx(tx);

    // Act
    await completeDoctorExam({
      appointmentId: prismaExamAppointment.id,
      doctorId,
      record: doctorExamRecord,
    });

    // Assert
    expect(tx.invoiceItem.create).toHaveBeenCalled();
    expect(tx.invoiceItem.findMany).not.toHaveBeenCalled();
    expect(tx.invoice.update).not.toHaveBeenCalled();
  });
});
