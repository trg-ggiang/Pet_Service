const { createSupabaseQuery } = require("../helpers/supabaseQuery");
const { doctorId } = require("../mocks/doctorOperations.mock");

jest.mock("../../src/lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("../../src/services/settingsService", () => ({
  getStoredSetting: jest.fn(),
  saveStoredSetting: jest.fn(),
}));

const { supabase } = require("../../src/lib/supabaseClient");
const {
  getStoredSetting,
  saveStoredSetting,
} = require("../../src/services/settingsService");
const {
  getDoctorExamContext,
  getDoctorSettings,
  getDoctorStats,
  listDoctorRecords,
  saveDoctorSettings,
} = require("../../src/services/doctor/doctorService");

describe("doctorService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabase.from.mockReset();
    getStoredSetting.mockReset();
    saveStoredSetting.mockReset();
  });

  test("builds doctor stats from appointments, services, species and reviews", async () => {
    // Arrange
    const appointmentRows = [
      {
        id: 501,
        pet_id: 801,
        doctor_id: doctorId,
        appointment_type: "MEDICAL",
        status: "COMPLETED",
        note: "Skin issue",
        requested_date: "2099-07-20",
        created_at: "2099-07-20T08:00:00.000Z",
        doctor_schedule_slots: { slot_date: "2099-07-20" },
        pets: { name: "Milo", species: { name: "Dog" } },
        appointment_services: [{ service: { name: "General exam", type: "MEDICAL" } }],
        medical_visits: [{ diagnosis_note: "Dermatitis" }],
      },
      {
        id: 502,
        pet_id: 802,
        doctor_id: doctorId,
        appointment_type: "VACCINE",
        status: "CONFIRMED",
        note: "",
        requested_date: "2099-07-21",
        created_at: "2099-07-21T09:00:00.000Z",
        doctor_schedule_slots: { slot_date: "2099-07-21" },
        pets: { name: "Bong", species: { name: "Cat" } },
        appointment_services: [{ service: { name: "Vaccination", type: "VACCINE" } }],
        medical_visits: [],
      },
    ];
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: appointmentRows, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [{ appointment_id: 501, rating: 5 }], error: null }));

    // Act
    const stats = await getDoctorStats(doctorId);

    // Assert
    expect(stats.month.kpis).toEqual(
      expect.objectContaining({
        total: 2,
        completed: 1,
        newPatients: 2,
        completionRate: 50,
      }),
    );
    expect(stats.month.averageRating).toBe(5);
    expect(stats.month.topServices).toContainEqual(
      expect.objectContaining({ name: "General exam", count: 1 }),
    );
    expect(stats.month.recentPatients).toContainEqual(
      expect.objectContaining({ name: "Bong", species: "Cat" }),
    );
  });

  test("builds default doctor settings and persists default preferences when none are stored", async () => {
    // Arrange
    const doctor = {
      id: doctorId,
      full_name: "Dr. Nguyen",
      specialization: "Internal medicine",
      degree: "DVM",
      experience_years: 5,
      room_name: "Room 2",
      user: { email: "doctor@example.test" },
    };
    const schedules = [
      {
        id: 1,
        work_date: "2099-07-20",
        start_time: "09:00:00",
        end_time: "09:30:00",
        room_name: "Room 2",
        slots: [{ id: 100 }],
      },
      {
        id: 2,
        work_date: "2099-07-20",
        start_time: "09:30:00",
        end_time: "10:00:00",
        room_name: "Room 2",
        slots: [{ id: 101 }],
      },
    ];
    getStoredSetting.mockResolvedValueOnce(null);
    saveStoredSetting.mockResolvedValueOnce();
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: doctor, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: schedules, error: null }));

    // Act
    const settings = await getDoctorSettings(doctorId, "Mozilla/5.0 Chrome/120");

    // Assert
    expect(settings.profile).toEqual(
      expect.objectContaining({
        id: doctorId,
        name: "Dr. Nguyen",
        email: "doctor@example.test",
        room: "Room 2",
      }),
    );
    expect(settings.schedule.rows).toEqual([
      expect.objectContaining({
        from: "09:00",
        to: "10:00",
        roomName: "Room 2",
        slotCount: 2,
      }),
    ]);
    expect(saveStoredSetting).toHaveBeenCalledWith(
      `doctor.settings.${doctorId}`,
      expect.objectContaining({
        notifications: expect.any(Object),
      }),
    );
  });

  test("builds exam context with appointment, pet, vaccination and visit history", async () => {
    // Arrange
    const appointment = {
      id: 502,
      pet_id: 802,
      doctor_id: doctorId,
      appointment_type: "MEDICAL",
      status: "IN_PROGRESS",
      note: "Owner reports coughing",
      requested_date: "2099-07-20",
      requested_time: "09:00:00",
      created_at: "2099-07-20T08:00:00.000Z",
      pets: {
        id: 802,
        name: "Milo",
        gender: "MALE",
        dob: "2022-01-01",
        weight: 5.4,
        img_url: null,
        allergies: "None",
        species: { name: "Dog" },
        breed: { name: "Poodle" },
        customers: { full_name: "Nguyen Van Minh", phone: "0901000001" },
      },
      appointment_services: [{ service: { name: "General exam", type: "MEDICAL" } }],
    };
    const vaccination = {
      id: 700,
      vaccine_name: "Rabies",
      date_given: "2099-01-01",
      next_due_date: "2099-12-31",
      note: "Annual",
    };
    const history = {
      id: 401,
      doctor_id: doctorId,
      appointment_type: "MEDICAL",
      note: "Follow-up note",
      requested_date: "2099-06-01",
      created_at: "2099-06-01T08:00:00.000Z",
      doctor: { full_name: "Dr. Nguyen" },
      medical_visits: [{ diagnosis_note: "Dermatitis" }],
    };

    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: appointment, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [vaccination], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [history], error: null }));

    // Act
    const context = await getDoctorExamContext(doctorId, appointment.id);

    // Assert
    expect(context.appointment).toEqual(
      expect.objectContaining({
        id: appointment.id,
        service: "General exam",
        note: "Owner reports coughing",
      }),
    );
    expect(context.pet).toEqual(
      expect.objectContaining({
        id: 802,
        name: "Milo",
        owner: "Nguyen Van Minh",
      }),
    );
    expect(context.vaccinations).toEqual([
      expect.objectContaining({ id: vaccination.id, name: "Rabies", ok: true }),
    ]);
    expect(context.visitHistory).toEqual([
      expect.objectContaining({ id: history.id, reason: "Dermatitis", doctor: "Dr. Nguyen" }),
    ]);
    expect(context.initialForm).toEqual(
      expect.objectContaining({
        chiefComplaint: "Owner reports coughing",
      }),
    );
  });

  test("maps doctor records with diagnosis, diseases, services and prescriptions", async () => {
    // Arrange
    const appointment = {
      id: 502,
      pet_id: 802,
      doctor_id: doctorId,
      appointment_type: "MEDICAL",
      status: "COMPLETED",
      note: "",
      requested_date: "2099-07-20",
      created_at: "2099-07-20T08:00:00.000Z",
      pets: {
        id: 802,
        name: "Milo",
        gender: "MALE",
        dob: "2022-01-01",
        weight: 5.4,
        img_url: null,
        allergies: "None",
        species: { name: "Dog" },
        breed: { name: "Poodle" },
        customers: { full_name: "Nguyen Van Minh", phone: "0901000001" },
      },
      doctor: { full_name: "Dr. Nguyen", specialization: "Internal medicine" },
    };
    const visit = {
      id: 900,
      appointment_id: appointment.id,
      symptoms: "cough, fever",
      clinical_exam: JSON.stringify({
        chiefComplaint: "Coughing",
        selectedSymptoms: ["cough"],
        clinicalNote: "Mild wheezing",
        systems: { respiratory: { status: "abnormal", notes: "Wheezing" } },
      }),
      diagnosis_note: "Respiratory infection",
      next_visit_date: "2099-07-30",
      created_at: "2099-07-20T09:00:00.000Z",
    };
    const prescription = { id: 1000, medical_visit_id: visit.id, notes: "After meal" };
    const prescriptionItem = {
      prescription_id: prescription.id,
      medicine_name: "Amoxicillin",
      dosage: "50mg",
      frequency: "BID",
      duration_days: 5,
      instructions: "After meal",
    };

    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: [appointment], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [visit], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({
        data: [{ medical_visit_id: visit.id, note: "Respiratory", disease: { name: "Bronchitis", symptoms: "cough" } }],
        error: null,
      }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [prescription], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [prescriptionItem], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({
        data: [{ appointment_id: appointment.id, service: { name: "General exam", type: "MEDICAL" } }],
        error: null,
      }));

    // Act
    const records = await listDoctorRecords(doctorId, { search: "milo", species: "Dog" });

    // Assert
    expect(records).toEqual([
      expect.objectContaining({
        appointmentId: appointment.id,
        pet: "Milo",
        owner: "Nguyen Van Minh",
        diagnosis: "Respiratory infection",
        service: "General exam",
        prescriptions: [
          expect.objectContaining({
            drug: "Amoxicillin",
            duration: "5 ngày",
          }),
        ],
      }),
    ]);
    expect(records[0].sysResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "abnormal" }),
      ]),
    );
  });

  test("persists notification and security setting patches", async () => {
    // Arrange
    getStoredSetting.mockResolvedValueOnce({
      notifications: { aptEmail: true },
      security: { twoFa: false },
    });
    saveStoredSetting.mockResolvedValueOnce();

    // Act
    await saveDoctorSettings(doctorId, {
      notifications: { aptSms: true },
      security: { twoFa: true },
    });

    // Assert
    expect(saveStoredSetting).toHaveBeenCalledWith(
      `doctor.settings.${doctorId}`,
      expect.objectContaining({
        notifications: expect.objectContaining({ aptEmail: true, aptSms: true }),
        security: expect.objectContaining({ twoFa: true }),
      }),
    );
  });
});
