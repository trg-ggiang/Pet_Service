const { createSupabaseQuery } = require("../helpers/supabaseQuery");
const {
  adminAppointmentRows,
  adminAppointments,
  adminAppointmentServices,
  adminCustomers,
  adminDashboardBoardings,
  adminDashboardCages,
  adminDoctors,
  adminInvoiceItems,
  adminInvoices,
  adminPets,
  adminServices,
  adminStaffs,
  adminUsers,
} = require("../mocks/adminOperations.mock");

jest.mock("../../src/lib/supabaseClient", () => ({
  supabase: {
    auth: {
      admin: {
        createUser: jest.fn(),
      },
    },
    from: jest.fn(),
  },
}));

jest.mock("../../src/services/settingsService", () => ({
  getStoredSetting: jest.fn(),
  saveStoredSetting: jest.fn(),
}));

jest.mock("../../src/services/doctorScheduleService", () => ({
  setDoctorScheduleSlotStatus: jest.fn(),
}));

const { supabase } = require("../../src/lib/supabaseClient");
const { setDoctorScheduleSlotStatus } = require("../../src/services/doctorScheduleService");
const {
  getAdminDashboard,
  getAdminHealthTrends,
  getAdminReports,
  getAdminSettings,
  updateAdminSettings,
  createAdminService,
  createAdminStaffMember,
  deleteAdminService,
  listAdminAppointments,
  listAdminServices,
  listAdminUsers,
  updateAdminService,
  updateAdminAppointmentStatus,
  updateAdminServiceStatus,
  updateAdminUserProfile,
} = require("../../src/services/adminService");
const {
  getStoredSetting,
  saveStoredSetting,
} = require("../../src/services/settingsService");

function mockTableQueues(queues) {
  const tableQueues = Object.fromEntries(
    Object.entries(queues).map(([table, results]) => [
      table,
      Array.isArray(results) && results.some((item) => item && Object.prototype.hasOwnProperty.call(item, "data"))
        ? [...results]
        : [{ data: results, error: null }],
    ]),
  );

  supabase.from.mockImplementation((table) => {
    const next = tableQueues[table]?.shift() || { data: [], error: null };
    return createSupabaseQuery(next);
  });
}

describe("adminService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabase.from.mockReset();
    supabase.auth.admin.createUser.mockReset();
    getStoredSetting.mockReset();
    saveStoredSetting.mockReset();
  });

  test("lists admin users with profile data, spend and summary metrics", async () => {
    // Arrange
    mockTableQueues({
      users: adminUsers,
      customers: adminCustomers,
      doctors: adminDoctors,
      staffs: adminStaffs,
      pets: adminPets,
      appointments: adminAppointments,
      invoices: adminInvoices,
      ratings: [{ doctor_id: 201, score: 4 }, { doctor_id: 201, score: 5 }],
    });

    // Act
    const result = await listAdminUsers({ role: "customers", search: "milo" });

    // Assert
    expect(result.customers).toEqual([
      expect.objectContaining({
        id: "C101",
        name: "Nguyen Van Minh",
        petCount: 1,
        pets: ["Milo (Dog)"],
        totalSpend: "250.000",
      }),
    ]);
    expect(result.doctors[0]).toEqual(
      expect.objectContaining({
        id: "D201",
        rating: 4.5,
        room: "Room 2",
      }),
    );
    expect(result.staff[0]).toEqual(
      expect.objectContaining({
        id: "S301",
        locked: true,
      }),
    );
    expect(result.summary.totals).toEqual(
      expect.objectContaining({
        customers: 1,
        doctors: 1,
        staff: 1,
        locked: 1,
      }),
    );
  });

  test("lists admin services with category filtering and revenue summary", async () => {
    // Arrange
    mockTableQueues({
      services: adminServices,
      appointment_services: adminAppointmentServices,
    });

    // Act
    const result = await listAdminServices({ category: "grooming", status: "inactive" });

    // Assert
    expect(result.services).toEqual([
      expect.objectContaining({
        id: "SV-702",
        category: "grooming",
        status: "inactive",
        bookingsMonth: 2,
        revenueMonth: 600000,
      }),
    ]);
    expect(result.summary).toEqual(
      expect.objectContaining({
        total: 2,
        filtered: 1,
        totalBookings: 3,
        totalRevenueMonth: 850000,
      }),
    );
  });

  test("rejects invalid service status before updating database", async () => {
    // Arrange
    const invalidStatus = "archived";

    // Act
    const action = () => updateAdminServiceStatus("SV-701", invalidStatus);

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 400 });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test("lists admin appointments with status filters and amount summary", async () => {
    // Arrange
    mockTableQueues({
      appointments: adminAppointmentRows,
    });

    // Act
    const result = await listAdminAppointments({ status: "completed", search: "milo" });

    // Assert
    expect(result.appointments).toEqual([
      expect.objectContaining({
        id: "APT-501",
        customer: "Nguyen Van Minh",
        pet: "Milo",
        status: "completed",
        amountValue: 250000,
      }),
    ]);
    expect(result.summary).toEqual(
      expect.objectContaining({
        total: 2,
        filtered: 1,
        totalAmount: 250000,
      }),
    );
  });

  test("cancels an appointment and releases the doctor schedule slot", async () => {
    // Arrange
    const appointmentReadQuery = createSupabaseQuery({ data: { doctor_schedule_slot_id: 9901 }, error: null });
    const updateQuery = createSupabaseQuery({ data: null, error: null });
    supabase.from
      .mockReturnValueOnce(appointmentReadQuery)
      .mockReturnValueOnce(updateQuery)
      .mockReturnValueOnce(createSupabaseQuery({ data: adminAppointmentRows, error: null }));

    // Act
    const result = await updateAdminAppointmentStatus("APT-502", "cancelled");

    // Assert
    expect(updateQuery.update).toHaveBeenCalledWith({
      status: "CANCELLED",
      doctor_schedule_slot_id: null,
    });
    expect(setDoctorScheduleSlotStatus).toHaveBeenCalledWith(9901, "AVAILABLE");
    expect(result).toEqual(expect.objectContaining({ id: "APT-502", status: "scheduled" }));
  });

  test("builds admin dashboard totals, status buckets and occupied boarding rooms", async () => {
    // Arrange
    mockTableQueues({
      users: adminUsers,
      services: adminServices,
      appointments: [
        { data: adminAppointments, error: null },
        { data: adminAppointmentRows, error: null },
      ],
      pets: adminPets,
      invoices: adminInvoices,
      cages: adminDashboardCages,
      boarding: adminDashboardBoardings,
    });

    // Act
    const dashboard = await getAdminDashboard();

    // Assert
    expect(dashboard.totals).toEqual(
      expect.objectContaining({
        customers: 1,
        doctors: 1,
        staff: 1,
        pets: 1,
        services: 2,
        activeServices: 1,
        appointments: 2,
        scheduledAppointments: 1,
        revenue: 430000,
        cages: 2,
        occupiedCages: 1,
      }),
    );
    expect(dashboard.appointmentsByStatus).toContainEqual(
      expect.objectContaining({ status: "completed", value: 1 }),
    );
    expect(dashboard.boardingRooms).toContainEqual(
      expect.objectContaining({ number: "CAGE-02", status: "occupied", pet: "Milo" }),
    );
  });

  test("builds admin reports revenue, appointment stats and staff performance", async () => {
    // Arrange
    mockTableQueues({
      invoices: adminInvoices,
      invoice_items: adminInvoiceItems,
      services: adminServices,
      appointments: adminAppointments,
      users: adminUsers,
      doctors: adminDoctors,
      staffs: adminStaffs,
    });

    // Act
    const reports = await getAdminReports();

    // Assert
    expect(reports.summary).toEqual({
      revenue: 430000,
      customers: 1,
      bookings: 2,
      avgRevenue: 215000,
    });
    expect(reports.topServices[0]).toEqual(
      expect.objectContaining({
        name: "General Exam",
        revenue: 250000,
      }),
    );
    expect(reports.appointmentStats).toEqual(
      expect.objectContaining({
        scheduled: 1,
        completed: 1,
        total: 2,
      }),
    );
    expect(reports.staffPerformance).toContainEqual(
      expect.objectContaining({
        id: "doctor-201",
        appointments: 1,
        completed: 1,
        completionRate: 100,
      }),
    );
  });

  test("creates and updates admin services with mapped service payloads", async () => {
    // Arrange
    const createdService = {
      id: 703,
      name: "X-Ray",
      type: "XRAY",
      price: 450000,
      description: "Imaging",
      is_active: true,
      pricing_type: "fixed",
      variants_json: null,
      specialist_room_type: "XRAY",
    };
    const updatedService = {
      ...adminServices[0],
      name: "General Exam Plus",
      price: 300000,
      is_active: true,
    };
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: createdService, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: { type: "MEDICAL" }, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: updatedService, error: null }));
    mockTableQueues({
      services: [updatedService],
      appointment_services: [],
    });

    // Act
    const created = await createAdminService({
      name: "X-Ray",
      category: "specialist",
      specialistRoomType: "XRAY",
      basePrice: 450000,
      description: "Imaging",
    });
    const updated = await updateAdminService("SV-701", {
      name: "General Exam Plus",
      category: "clinic",
      basePrice: 300000,
      status: "active",
    });

    // Assert
    expect(created).toEqual(
      expect.objectContaining({
        id: "SV-703",
        name: "X-Ray",
        category: "specialist",
      }),
    );
    expect(updated).toEqual(
      expect.objectContaining({
        id: "SV-701",
        name: "General Exam Plus",
      }),
    );
  });

  test("deletes an admin service by display id", async () => {
    // Arrange
    const deleteQuery = createSupabaseQuery({ data: null, error: null });
    supabase.from.mockReturnValueOnce(deleteQuery);

    // Act
    const result = await deleteAdminService("SV-701");

    // Assert
    expect(result).toEqual({ id: "SV-701" });
    expect(deleteQuery.delete).toHaveBeenCalled();
    expect(deleteQuery.eq).toHaveBeenCalledWith("id", 701);
  });

  test("builds health trends from pets, visits, diseases and prescriptions", async () => {
    // Arrange
    mockTableQueues({
      pets: [
        { id: 401, weight: 5.4, allergies: "Pollen", chronic_diseases: "", created_at: "2026-06-01", animal_species: { name: "Dog" } },
        { id: 402, weight: 4.2, allergies: "", chronic_diseases: "Asthma", created_at: "2026-06-02", animal_species: { name: "Cat" } },
      ],
      medical_visits: [
        { id: 901, appointment_id: 501, diagnosis_note: "Dermatitis", next_visit_date: "2026-07-01", created_at: "2026-06-20" },
        { id: 902, appointment_id: 502, diagnosis_note: "Cough", next_visit_date: null, created_at: "2026-06-21" },
      ],
      medical_visit_diseases: [
        { medical_visit_id: 901, disease_id: 1 },
        { medical_visit_id: 902, disease_id: 2 },
      ],
      diseases: [
        { id: 1, name: "Dermatitis" },
        { id: 2, name: "Respiratory infection" },
      ],
      prescriptions: [{ id: 1001, medical_visit_id: 901 }],
      prescription_items: [{ id: 1101, prescription_id: 1001, medicine_name: "Amoxicillin", duration_days: 5 }],
    });

    // Act
    const trends = await getAdminHealthTrends();

    // Assert
    expect(trends.summary).toEqual(
      expect.objectContaining({
        totalPets: 2,
        totalVisits: 2,
        revisitRate: 50,
        petsWithAllergies: 1,
        petsWithChronic: 1,
      }),
    );
    expect(trends.topDiseases).toContainEqual({ name: "Dermatitis", count: 1 });
    expect(trends.speciesDistribution).toContainEqual({ name: "Dog", count: 1 });
    expect(trends.topMedicines).toEqual([{ name: "Amoxicillin", count: 1 }]);
  });

  test("merges admin settings with stored settings and persists updates", async () => {
    // Arrange
    const authUser = { fullName: "Admin User", email: "admin@example.test", phone: "0909000009" };
    getStoredSetting
      .mockResolvedValueOnce({
        clinic: { name: "Stored Clinic" },
        notifications: { smsReminder: true },
      })
      .mockResolvedValueOnce({
        clinic: { name: "Stored Clinic" },
        notifications: { smsReminder: true },
      });
    saveStoredSetting.mockResolvedValueOnce();

    // Act
    const settings = await getAdminSettings(authUser);
    await updateAdminSettings({ clinic: { phone: "0999000000" }, security: { twoFactorEnabled: true } }, authUser);

    // Assert
    expect(settings.clinic).toEqual(expect.objectContaining({ name: "Stored Clinic" }));
    expect(settings.notifications).toEqual(expect.objectContaining({ smsReminder: true }));
    expect(saveStoredSetting).toHaveBeenCalledWith(
      "admin.settings",
      expect.objectContaining({
        clinic: expect.objectContaining({ name: "Stored Clinic", phone: "0999000000" }),
        security: expect.objectContaining({ twoFactorEnabled: true }),
      }),
    );
  });

  test("updates admin customer profile fields", async () => {
    // Arrange
    const updateQuery = createSupabaseQuery({ data: null, error: null });
    supabase.from.mockReturnValueOnce(updateQuery);

    // Act
    const result = await updateAdminUserProfile("customer", "C101", {
      name: "Nguyen Van Minh Updated",
      phone: "0901111111",
      dateOfBirth: "1995-05-10",
      gender: "MALE",
    });

    // Assert
    expect(result).toEqual({ id: "C101", role: "customer" });
    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "Nguyen Van Minh Updated",
        phone: "0901111111",
        date_of_birth: "1995-05-10",
        gender: "MALE",
      }),
    );
    expect(updateQuery.eq).toHaveBeenCalledWith("id", 101);
  });

  test("creates an admin staff member with Supabase Auth Admin and profile insert", async () => {
    // Arrange
    supabase.auth.admin.createUser.mockResolvedValueOnce({
      data: { user: { id: "new-staff-user" } },
      error: null,
    });
    const userUpsert = createSupabaseQuery({ data: null, error: null });
    const profileInsert = createSupabaseQuery({ data: null, error: null });
    supabase.from
      .mockReturnValueOnce(userUpsert)
      .mockReturnValueOnce(profileInsert);

    // Act
    const member = await createAdminStaffMember({
      name: "New Staff",
      email: "new.staff@example.test",
      password: "Secret123",
      phone: "0903000009",
      address: "Clinic",
      role: "staff",
    });

    // Assert
    expect(supabase.auth.admin.createUser).toHaveBeenCalledWith({
      email: "new.staff@example.test",
      password: "Secret123",
      email_confirm: true,
    });
    expect(userUpsert.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "new-staff-user",
        role: "STAFF",
        status: "ACTIVE",
      }),
      { onConflict: "id" },
    );
    expect(profileInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "new-staff-user",
        full_name: "New Staff",
      }),
    );
    expect(member).toEqual(
      expect.objectContaining({
        userId: "new-staff-user",
        role: "staff",
      }),
    );
  });
});
