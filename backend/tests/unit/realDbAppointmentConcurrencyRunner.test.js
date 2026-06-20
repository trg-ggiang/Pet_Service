const {
  assertDedicatedFixture,
  readConfig,
  runConcurrencyRound,
  runRealDbConcurrency,
} = require("../real-db/appointmentConcurrency.integration");

function createStatefulAdapter({ slotId = 401, linkedAppointments = [] } = {}) {
  let status = "AVAILABLE";
  return {
    getSlot: jest.fn(async () => ({
      id: slotId,
      status,
      doctor_id: 300,
      slot_date: "2099-08-01",
      start_time: "10:00:00",
      end_time: "10:30:00",
    })),
    listLinkedAppointments: jest.fn(async () => linkedAppointments),
    setAvailable: jest.fn(async () => {
      status = "AVAILABLE";
      return { id: slotId, status };
    }),
    reserve: jest.fn(async () => {
      if (status !== "AVAILABLE") return null;
      status = "BOOKED";
      return { id: slotId, status };
    }),
  };
}

describe("real DB appointment concurrency runner", () => {
  test("fails closed unless real DB execution is explicitly enabled", () => {
    expect(() => readConfig({})).toThrow(/RUN_REAL_DB_TESTS=true/);
  });

  test("blocks remote projects without a second explicit opt-in", () => {
    expect(() => readConfig({
      RUN_REAL_DB_TESTS: "true",
      TEST_SUPABASE_URL: "https://project.supabase.co",
      TEST_SUPABASE_SERVICE_ROLE_KEY: "test-key",
      TEST_DOCTOR_SLOT_ID: "401",
    })).toThrow(/Remote test database blocked/);
  });

  test("accepts local configuration and applies safe load defaults", () => {
    const config = readConfig({
      RUN_REAL_DB_TESTS: "true",
      TEST_SUPABASE_URL: "http://127.0.0.1:54321",
      TEST_SUPABASE_SERVICE_ROLE_KEY: "test-key",
      TEST_DOCTOR_SLOT_ID: "401",
    });

    expect(config).toEqual(expect.objectContaining({
      slotId: 401,
      rounds: 5,
      contenders: 10,
    }));
  });

  test("rejects a fixture already linked to an appointment", async () => {
    const adapter = createStatefulAdapter({ linkedAppointments: [{ id: 900, status: "PENDING" }] });
    await expect(assertDedicatedFixture(adapter, 401)).rejects.toThrow(/must not be linked/);
  });

  test("allows exactly one winner in a concurrent round", async () => {
    const adapter = createStatefulAdapter();
    const result = await runConcurrencyRound(adapter, { slotId: 401, contenders: 10, round: 1 });

    expect(result).toEqual({ round: 1, winnerCount: 1, loserCount: 9 });
    expect(adapter.reserve).toHaveBeenCalledTimes(10);
  });

  test("runs repeated rounds and restores the fixture after success", async () => {
    const adapter = createStatefulAdapter();
    const summary = await runRealDbConcurrency(
      adapter,
      { slotId: 401, rounds: 3, contenders: 5 },
      jest.fn(),
    );

    expect(summary).toEqual(expect.objectContaining({
      rounds: 3,
      contendersPerRound: 5,
      totalAttempts: 15,
      finalStatus: "AVAILABLE",
    }));
    expect(adapter.setAvailable).toHaveBeenCalledTimes(4);
  });

  test("restores the fixture even when a round fails", async () => {
    const adapter = createStatefulAdapter();
    adapter.reserve.mockRejectedValueOnce(new Error("connection interrupted"));

    await expect(runRealDbConcurrency(
      adapter,
      { slotId: 401, rounds: 1, contenders: 2 },
      jest.fn(),
    )).rejects.toThrow("connection interrupted");
    expect(adapter.setAvailable).toHaveBeenCalledTimes(2);
    expect((await adapter.getSlot(401)).status).toBe("AVAILABLE");
  });
});
