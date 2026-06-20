const { createSupabaseQuery } = require("../helpers/supabaseQuery");
const {
  completedAppointment,
  confirmedAppointment,
  groomingRecord,
  paidInvoice,
  pendingAppointment,
  staffId,
  staffProfileRow,
  unpaidInvoice,
} = require("../mocks/staffOperations.mock");

jest.mock("../../src/lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
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
  confirmAppointment,
  getStaffProfile,
  markPaymentPaid,
  updateGroomingStatus,
} = require("../../src/services/staff/staffPortalService");

describe("staffPortalService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("maps staff profile with initials and staff role label", async () => {
    // Arrange
    supabase.from.mockReturnValueOnce(createSupabaseQuery({ data: staffProfileRow, error: null }));

    // Act
    const profile = await getStaffProfile(staffId);

    // Assert
    expect(profile).toEqual(
      expect.objectContaining({
        id: staffId,
        fullName: staffProfileRow.full_name,
        initials: "LS",
        roleLabel: "Nhân viên chăm sóc",
        email: staffProfileRow.users.email,
      }),
    );
  });

  test("confirms a pending appointment and assigns the current staff member", async () => {
    // Arrange
    const updateQuery = createSupabaseQuery({ data: null, error: null });
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: pendingAppointment, error: null }))
      .mockReturnValueOnce(updateQuery);

    // Act
    await confirmAppointment(pendingAppointment.id, staffId);

    // Assert
    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "CONFIRMED",
        staff_id: staffId,
      }),
    );
    expect(updateQuery.eq).toHaveBeenCalledWith("id", pendingAppointment.id);
  });

  test("rejects confirm when appointment belongs to another staff member", async () => {
    // Arrange
    supabase.from.mockReturnValueOnce(
      createSupabaseQuery({
        data: { ...pendingAppointment, staff_id: 999 },
        error: null,
      }),
    );

    // Act
    const action = () => confirmAppointment(pendingAppointment.id, staffId);

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 403 });
  });

  test("rejects check-in when appointment is not confirmed", async () => {
    // Arrange
    supabase.from.mockReturnValueOnce(
      createSupabaseQuery({ data: completedAppointment, error: null }),
    );

    // Act
    const action = () => checkInAppointment(completedAppointment.id, staffId);

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 400 });
  });

  test("checks in a confirmed appointment and moves it to in progress", async () => {
    // Arrange
    const updateQuery = createSupabaseQuery({ data: null, error: null });
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: confirmedAppointment, error: null }))
      .mockReturnValueOnce(updateQuery);

    // Act
    await checkInAppointment(confirmedAppointment.id, staffId);

    // Assert
    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "IN_PROGRESS",
        staff_id: staffId,
      }),
    );
  });

  test("rejects invalid grooming status before querying", async () => {
    // Arrange
    const invalidStatus = "DONE";

    // Act
    const action = () => updateGroomingStatus(groomingRecord.id, invalidStatus, staffId);

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 400 });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test("updates grooming, appointment service and appointment status", async () => {
    // Arrange
    const groomingUpdateQuery = createSupabaseQuery({ data: null, error: null });
    const serviceUpdateQuery = createSupabaseQuery({ data: null, error: null });
    const appointmentUpdateQuery = createSupabaseQuery({ data: null, error: null });
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: groomingRecord, error: null }))
      .mockReturnValueOnce(groomingUpdateQuery)
      .mockReturnValueOnce(serviceUpdateQuery)
      .mockReturnValueOnce(appointmentUpdateQuery);

    // Act
    await updateGroomingStatus(groomingRecord.id, "IN_PROGRESS", staffId);

    // Assert
    expect(groomingUpdateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "IN_PROGRESS",
        staff_id: staffId,
      }),
    );
    expect(serviceUpdateQuery.update).toHaveBeenCalledWith({ status: "IN_PROGRESS" });
    expect(appointmentUpdateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "IN_PROGRESS",
        staff_id: staffId,
      }),
    );
  });

  test("skips payment update when invoice is already paid", async () => {
    // Arrange
    supabase.from.mockReturnValueOnce(createSupabaseQuery({ data: paidInvoice, error: null }));

    // Act
    await markPaymentPaid(paidInvoice.id, "cash");

    // Assert
    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(sendAppointmentEventEmail).not.toHaveBeenCalled();
  });

  test("marks an unpaid invoice as paid and sends a payment email", async () => {
    // Arrange
    const updateQuery = createSupabaseQuery({ data: unpaidInvoice, error: null });
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: unpaidInvoice, error: null }))
      .mockReturnValueOnce(updateQuery);

    // Act
    await markPaymentPaid(unpaidInvoice.id, "transfer");

    // Assert
    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_status: "PAID",
        status: "PAID",
        payment_method: "BANK_TRANSFER",
      }),
    );
    expect(sendAppointmentEventEmail).toHaveBeenCalledWith(
      "payment_confirmation",
      unpaidInvoice.appointment_id,
      expect.objectContaining({
        invoiceCode: "INV-1000",
      }),
    );
  });
});
