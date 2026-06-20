const { createSupabaseQuery } = require("../helpers/supabaseQuery");
const {
  doctorAppointmentRows,
  doctorId,
} = require("../mocks/doctorOperations.mock");

jest.mock("../../src/lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = require("../../src/lib/supabaseClient");
const {
  listDoctorAppointmentsForPortal,
} = require("../../src/services/doctor/doctorAppointmentService");

describe("doctorAppointmentService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("rejects portal list when user is not linked to a doctor profile", async () => {
    // Arrange
    const missingDoctorId = null;

    // Act
    const action = () => listDoctorAppointmentsForPortal(missingDoctorId);

    // Assert
    await expect(action()).rejects.toThrow();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test("maps doctor appointments, summary and room metadata for portal", async () => {
    // Arrange
    supabase.from.mockReturnValueOnce(
      createSupabaseQuery({ data: doctorAppointmentRows, error: null }),
    );

    // Act
    const result = await listDoctorAppointmentsForPortal(doctorId);

    // Assert
    expect(result.summary).toEqual({
      total: 2,
      completed: 0,
      inProgress: 1,
      scheduled: 1,
    });
    expect(result.meta.roomLabel).toBe("Room 2");
    expect(result.appointments).toEqual([
      expect.objectContaining({
        appointmentId: 502,
        statusKey: "in_progress",
        petName: "Milo",
        owner: "Nguyen Van Minh",
        roomName: "Room 2",
      }),
      expect.objectContaining({
        appointmentId: 501,
        statusKey: "scheduled",
        petName: "Bong",
        owner: "Tran Thi Lan",
      }),
    ]);
  });
});
