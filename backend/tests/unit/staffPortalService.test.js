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
    storage: {
      getBucket: jest.fn(),
      createBucket: jest.fn(),
      updateBucket: jest.fn(),
      from: jest.fn(),
    },
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
  updateBoardingDailyStatus,
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

  test("rejects unsupported boarding photo data before storage or database access", async () => {
    // Arrange
    const input = { imageDataUrl: "data:text/plain;base64,dGVzdA==" };

    // Act
    const action = () => updateBoardingDailyStatus(601, {}, staffId, input);

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 400 });
    expect(supabase.storage.getBucket).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test("uploads a boarding photo and stores its public URL in the daily update", async () => {
    // Arrange
    const bucket = {
      upload: jest.fn().mockResolvedValue({ data: { path: "boarding-601/photo.png" }, error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: "https://cdn.example.test/photo.png" } }),
    };
    supabase.storage.getBucket.mockResolvedValueOnce({ data: { public: true }, error: null });
    supabase.storage.from.mockReturnValue(bucket);
    const insertUpdateQuery = createSupabaseQuery({ data: null, error: null });
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: null, error: null }))
      .mockReturnValueOnce(insertUpdateQuery)
      .mockReturnValueOnce(createSupabaseQuery({
        data: {
          appointment_id: 501,
          appointments: { pets: { name: "Milo", customers: { user_id: 601 } } },
        },
        error: null,
      }))
      .mockReturnValueOnce(createSupabaseQuery({ data: null, error: null }));

    // Act
    const result = await updateBoardingDailyStatus(
      601,
      { breakfast: true, healthCheck: true },
      staffId,
      { dailyNote: "Milo is healthy", imageDataUrl: "data:image/png;base64,dGVzdA==" },
    );

    // Assert
    expect(result).toEqual({
      dailyNote: "Milo is healthy",
      imageUrl: "https://cdn.example.test/photo.png",
    });
    expect(bucket.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^boarding-601\/.*\.png$/),
      expect.any(Buffer),
      expect.objectContaining({ contentType: "image/png", upsert: true }),
    );
    expect(insertUpdateQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
      boarding_id: 601,
      staff_id: staffId,
      img_url: "https://cdn.example.test/photo.png",
    }));
    expect(sendAppointmentEventEmail).toHaveBeenCalledWith(
      "boarding_update",
      501,
      expect.objectContaining({ boardingStatus: "Milo is healthy" }),
    );
  });
});
