const { createSupabaseQuery } = require("../helpers/supabaseQuery");
const {
  crossIds,
  customerHistoryAppointment,
  customerPetRow,
  doctorExamRecord,
  groomingAppointmentService,
  medicalAppointmentService,
  medicalService,
  medicalVisitRow,
  paidMedicalInvoice,
  paidMedicalInvoiceItem,
  prescriptionRow,
  prismaMedicalAppointment,
} = require("../mocks/crossFeatureFlows.mock");

const mockGetPrismaClient = jest.fn();

jest.mock("../../src/lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("../../src/lib/prisma", () => ({
  getPrismaClient: () => mockGetPrismaClient(),
}));

jest.mock("../../src/services/emailService", () => ({
  sendAppointmentEventEmail: jest.fn(),
}));

jest.mock("../../src/services/settingsService", () => ({
  getStoredSetting: jest.fn(),
}));

jest.mock("../../src/services/doctorScheduleService", () => ({
  ensureDoctorScheduleSlot: jest.fn(),
  setDoctorScheduleSlotStatus: jest.fn(),
}));

const { supabase } = require("../../src/lib/supabaseClient");
const { sendAppointmentEventEmail } = require("../../src/services/emailService");
const {
  checkInAppointment,
  completeGroomingAppointment,
  confirmAppointment,
  markPaymentPaid,
} = require("../../src/services/staff/staffPortalService");
const {
  completeDoctorExam,
} = require("../../src/services/doctor/doctorExamCompletionService");
const {
  listCustomerServiceHistoryView,
} = require("../../src/services/customer/customerServiceHistoryService");
const {
  checkInBoarding,
  checkOutBoarding,
} = require("../../src/services/boardingService");

function createDoctorTx(overrides = {}) {
  return {
    appointment: {
      findFirst: jest.fn().mockResolvedValue(prismaMedicalAppointment),
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
      create: jest.fn().mockResolvedValue({ id: crossIds.invoiceId, paymentStatus: "UNPAID" }),
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
      upsert: jest.fn().mockResolvedValue({ id: crossIds.medicalVisitId }),
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

describe("cross-feature critical flows", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("runs the medical flow contract across staff, doctor, payment and customer history services", async () => {
    // Arrange
    const confirmUpdate = createSupabaseQuery({ data: null, error: null });
    const checkInUpdate = createSupabaseQuery({ data: null, error: null });
    const paymentUpdate = createSupabaseQuery({
      data: {
        id: crossIds.invoiceId,
        appointment_id: crossIds.appointmentId,
        total_amount: 250000,
      },
      error: null,
    });
    const doctorTx = createDoctorTx();
    mockPrismaTx(doctorTx);

    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({
        data: {
          id: crossIds.appointmentId,
          status: "PENDING",
          staff_id: null,
          appointment_services: [medicalAppointmentService],
        },
        error: null,
      }))
      .mockReturnValueOnce(confirmUpdate)
      .mockReturnValueOnce(createSupabaseQuery({
        data: {
          id: crossIds.appointmentId,
          status: "CONFIRMED",
          staff_id: crossIds.staffId,
          requested_date: null,
          appointment_services: [medicalAppointmentService],
        },
        error: null,
      }))
      .mockReturnValueOnce(checkInUpdate)
      .mockReturnValueOnce(createSupabaseQuery({
        data: { id: crossIds.invoiceId, payment_status: "UNPAID" },
        error: null,
      }))
      .mockReturnValueOnce(paymentUpdate)
      .mockReturnValueOnce(createSupabaseQuery({ data: [customerPetRow], error: null }, { resolveMethods: ["eq"] }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [customerHistoryAppointment], error: null }, { resolveMethods: ["in"] }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [paidMedicalInvoice], error: null }, { resolveMethods: ["order"] }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [{ id: crossIds.doctorId, full_name: "Dr Le An" }], error: null }, { resolveMethods: ["in"] }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [paidMedicalInvoiceItem], error: null }, { resolveMethods: ["order"] }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [medicalVisitRow], error: null }, { resolveMethods: ["in"] }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [], error: null }, { resolveMethods: ["in"] }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [], error: null }, { resolveMethods: ["in"] }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [], error: null }, { resolveMethods: ["in"] }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [prescriptionRow], error: null }, { resolveMethods: ["in"] }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [{ appointment_id: crossIds.appointmentId }], error: null }, { resolveMethods: ["in"] }));

    // Act
    await confirmAppointment(crossIds.appointmentId, crossIds.staffId);
    await checkInAppointment(crossIds.appointmentId, crossIds.staffId);
    await completeDoctorExam({
      appointmentId: crossIds.appointmentId,
      doctorId: crossIds.doctorId,
      record: doctorExamRecord,
    });
    await markPaymentPaid(crossIds.invoiceId, "cash");
    const history = await listCustomerServiceHistoryView(crossIds.customerId, { type: "medical" });

    // Assert
    expect(confirmUpdate.update).toHaveBeenCalledWith(expect.objectContaining({ status: "CONFIRMED" }));
    expect(checkInUpdate.update).toHaveBeenCalledWith(expect.objectContaining({ status: "IN_PROGRESS" }));
    expect(doctorTx.appointment.updateMany).toHaveBeenCalledWith({
      where: { id: crossIds.appointmentId, doctorId: crossIds.doctorId, status: "IN_PROGRESS" },
      data: { status: "COMPLETED" },
    });
    expect(doctorTx.medicalVisit.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { appointmentId: crossIds.appointmentId },
        create: expect.objectContaining({ diagnosisNote: doctorExamRecord.clinicalNote }),
      }),
    );
    expect(paymentUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_status: "PAID",
        status: "PAID",
        payment_method: "CASH",
      }),
    );
    expect(sendAppointmentEventEmail).toHaveBeenCalledWith(
      "payment_confirmation",
      crossIds.appointmentId,
      expect.objectContaining({ invoiceCode: "INV-0090" }),
    );
    expect(history.summary).toEqual(expect.objectContaining({ total: 1, filtered: 1 }));
    expect(history.history[0]).toEqual(
      expect.objectContaining({
        appointmentId: crossIds.appointmentId,
        invoiceId: crossIds.invoiceId,
        status: "completed",
        type: "medical",
        details: medicalVisitRow.diagnosis_note,
        isRated: true,
      }),
    );
    expect(history.history[0].prescriptions).toEqual([
      expect.objectContaining({ medicineName: "Amoxicillin", durationDays: 5 }),
    ]);
  });

  test("keeps grooming completion idempotent by updating the existing invoice item", async () => {
    // Arrange
    const appointmentRead = createSupabaseQuery({
      data: {
        id: crossIds.appointmentId,
        status: "IN_PROGRESS",
        staff_id: crossIds.staffId,
        appointment_services: [groomingAppointmentService],
      },
      error: null,
    });
    const existingGroomingRead = createSupabaseQuery({
      data: { id: crossIds.groomingId, staff_id: crossIds.staffId, status: "IN_PROGRESS" },
      error: null,
    });
    const groomingUpdate = createSupabaseQuery({ data: null, error: null });
    const serviceUpdate = createSupabaseQuery({ data: null, error: null });
    const appointmentUpdate = createSupabaseQuery({ data: null, error: null });
    const invoiceItemUpdate = createSupabaseQuery({ data: null, error: null });

    supabase.from
      .mockReturnValueOnce(appointmentRead)
      .mockReturnValueOnce(existingGroomingRead)
      .mockReturnValueOnce(createSupabaseQuery({
        data: {
          id: crossIds.groomingId,
          staff_id: crossIds.staffId,
          appointment_id: crossIds.appointmentId,
          appointment_service_id: groomingAppointmentService.id,
        },
        error: null,
      }))
      .mockReturnValueOnce(groomingUpdate)
      .mockReturnValueOnce(serviceUpdate)
      .mockReturnValueOnce(appointmentUpdate)
      .mockReturnValueOnce(createSupabaseQuery({
        data: {
          id: crossIds.groomingId,
          appointment_id: crossIds.appointmentId,
          appointment_service_id: groomingAppointmentService.id,
          appointment_services: groomingAppointmentService,
        },
        error: null,
      }))
      .mockReturnValueOnce(createSupabaseQuery({
        data: { id: crossIds.invoiceId, payment_status: "UNPAID", status: "PENDING" },
        error: null,
      }))
      .mockReturnValueOnce(createSupabaseQuery({ data: { id: crossIds.invoiceItemId }, error: null }))
      .mockReturnValueOnce(invoiceItemUpdate)
      .mockReturnValueOnce(createSupabaseQuery({ data: [{ total_price: 300000 }], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: null, error: null }));

    // Act
    await completeGroomingAppointment(crossIds.appointmentId, crossIds.staffId);

    // Assert
    expect(groomingUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "COMPLETED", staff_id: crossIds.staffId }),
    );
    expect(serviceUpdate.update).toHaveBeenCalledWith({ status: "COMPLETED" });
    expect(appointmentUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "COMPLETED", staff_id: crossIds.staffId }),
    );
    expect(invoiceItemUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        invoice_id: crossIds.invoiceId,
        grooming_record_id: crossIds.groomingId,
        source_type: "GROOMING",
        total_price: 300000,
      }),
    );
  });

  test("runs boarding check-in and checkout with room, appointment and invoice updates", async () => {
    // Arrange
    const checkedInAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const boardingCheckInUpdate = createSupabaseQuery({ data: null, error: null });
    const cageOccupiedUpdate = createSupabaseQuery({ data: null, error: null });
    const appointmentInProgressUpdate = createSupabaseQuery({ data: null, error: null });
    const boardingCheckoutUpdate = createSupabaseQuery({ data: null, error: null });
    const cageCleaningUpdate = createSupabaseQuery({ data: null, error: null });
    const appointmentCompletedUpdate = createSupabaseQuery({ data: null, error: null });
    const invoiceItemInsert = createSupabaseQuery({ data: null, error: null });

    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({
        data: {
          id: crossIds.boardingId,
          current_status: "BOOKED",
          cage_id: crossIds.cageId,
          appointments: { id: crossIds.appointmentId, status: "CONFIRMED" },
        },
        error: null,
      }))
      .mockReturnValueOnce(boardingCheckInUpdate)
      .mockReturnValueOnce(cageOccupiedUpdate)
      .mockReturnValueOnce(appointmentInProgressUpdate)
      .mockReturnValueOnce(createSupabaseQuery({
        data: {
          id: crossIds.boardingId,
          current_status: "CHECKED_IN",
          cage_id: crossIds.cageId,
          check_in: checkedInAt,
          pickup_reminder_at: new Date().toISOString(),
          appointments: {
            id: crossIds.appointmentId,
            status: "IN_PROGRESS",
            pets: {
              name: "Milo",
              customers: { user_id: "u-customer-1", full_name: "Nguyen Van Minh" },
            },
          },
          cages: { id: crossIds.cageId, cage_number: "CAGE-01", price_per_day: 180000 },
        },
        error: null,
      }))
      .mockReturnValueOnce(createSupabaseQuery({ data: null, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: { id: crossIds.invoiceId }, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: null, error: null }))
      .mockReturnValueOnce(invoiceItemInsert)
      .mockReturnValueOnce(boardingCheckoutUpdate)
      .mockReturnValueOnce(cageCleaningUpdate)
      .mockReturnValueOnce(appointmentCompletedUpdate)
      .mockReturnValueOnce(createSupabaseQuery({ data: null, error: null }));

    // Act
    await checkInBoarding(crossIds.boardingId, crossIds.staffId);
    const checkout = await checkOutBoarding(crossIds.boardingId, crossIds.staffId, {
      foodFeePerDay: 20000,
      extraServiceFee: 50000,
    });

    // Assert
    expect(boardingCheckInUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({ current_status: "CHECKED_IN" }),
    );
    expect(cageOccupiedUpdate.update).toHaveBeenCalledWith({ status: "OCCUPIED" });
    expect(appointmentInProgressUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "IN_PROGRESS", staff_id: crossIds.staffId }),
    );
    expect(checkout).toEqual(
      expect.objectContaining({
        invoiceId: crossIds.invoiceId,
        roomFee: expect.any(Number),
        foodFee: expect.any(Number),
        serviceFee: 50000,
        total: expect.any(Number),
      }),
    );
    expect(invoiceItemInsert.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          invoice_id: crossIds.invoiceId,
          boarding_id: crossIds.boardingId,
          source_type: "BOARDING",
        }),
      ]),
    );
    expect(boardingCheckoutUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({ current_status: "CHECKED_OUT" }),
    );
    expect(cageCleaningUpdate.update).toHaveBeenCalledWith({ status: "CLEANING" });
    expect(appointmentCompletedUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "COMPLETED" }),
    );
  });
});
