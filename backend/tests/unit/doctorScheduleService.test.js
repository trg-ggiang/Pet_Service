jest.mock("../../src/lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = require("../../src/lib/supabaseClient");
const {
  buildScheduleSlots,
  reserveDoctorScheduleSlot,
} = require("../../src/services/doctorScheduleService");

function createStatefulReserveQuery(slotState) {
  const query = {
    eq: jest.fn(() => query),
    maybeSingle: jest.fn(async () => {
      const statusGuard = query.eq.mock.calls.find(([column]) => column === "status")?.[1];
      if (statusGuard === "AVAILABLE" && slotState.status === "AVAILABLE") {
        slotState.status = "BOOKED";
        return { data: { id: slotState.id }, error: null };
      }
      return { data: null, error: null };
    }),
    select: jest.fn(() => query),
    update: jest.fn(() => query),
  };
  return query;
}

describe("doctorScheduleService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabase.from.mockReset();
  });

  test("builds concrete 30-minute slots from a doctor work window", () => {
    // Arrange
    const rows = [{ date: "2099-07-20", from: "09:00", to: "10:00", on: true }];

    // Act
    const slots = buildScheduleSlots(rows);

    // Assert
    expect(slots).toEqual([
      expect.objectContaining({ slot_date: "2099-07-20", start_time: "09:00:00", end_time: "09:30:00", status: "AVAILABLE" }),
      expect.objectContaining({ slot_date: "2099-07-20", start_time: "09:30:00", end_time: "10:00:00", status: "AVAILABLE" }),
    ]);
  });

  test("allows only one reservation when two requests target the same available slot", async () => {
    // Arrange
    const slotState = { id: 400, status: "AVAILABLE" };
    const firstReserveQuery = createStatefulReserveQuery(slotState);
    const secondReserveQuery = createStatefulReserveQuery(slotState);
    supabase.from
      .mockReturnValueOnce(firstReserveQuery)
      .mockReturnValueOnce(secondReserveQuery);

    // Act
    const [firstReservation, secondReservation] = await Promise.all([
      reserveDoctorScheduleSlot(slotState.id),
      reserveDoctorScheduleSlot(slotState.id),
    ]);

    // Assert
    expect(firstReservation).toEqual({ id: slotState.id });
    expect(secondReservation).toBeNull();
    expect(slotState.status).toBe("BOOKED");
    expect(firstReserveQuery.update).toHaveBeenCalledWith(expect.objectContaining({ status: "BOOKED" }));
    expect(firstReserveQuery.eq).toHaveBeenCalledWith("id", slotState.id);
    expect(firstReserveQuery.eq).toHaveBeenCalledWith("status", "AVAILABLE");
    expect(secondReserveQuery.eq).toHaveBeenCalledWith("id", slotState.id);
    expect(secondReserveQuery.eq).toHaveBeenCalledWith("status", "AVAILABLE");
  });
});
