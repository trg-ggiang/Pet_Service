const assert = require("node:assert/strict");
const { createClient } = require("@supabase/supabase-js");

const LOCAL_TEST_URL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i;

function positiveInteger(value, name, fallback) {
  const raw = String(value ?? "").trim();
  if (!raw && fallback !== undefined) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function required(env, name) {
  const value = String(env[name] || "").trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function readConfig(env = process.env) {
  if (env.RUN_REAL_DB_TESTS !== "true") {
    throw new Error("Refusing to run: set RUN_REAL_DB_TESTS=true for a disposable test database");
  }

  const url = required(env, "TEST_SUPABASE_URL");
  if (!LOCAL_TEST_URL.test(url) && env.ALLOW_REMOTE_TEST_DB !== "true") {
    throw new Error("Remote test database blocked; set ALLOW_REMOTE_TEST_DB=true only for a disposable test project");
  }

  return {
    url,
    key: required(env, "TEST_SUPABASE_SERVICE_ROLE_KEY"),
    slotId: positiveInteger(required(env, "TEST_DOCTOR_SLOT_ID"), "TEST_DOCTOR_SLOT_ID"),
    rounds: positiveInteger(env.TEST_CONCURRENCY_ROUNDS, "TEST_CONCURRENCY_ROUNDS", 5),
    contenders: positiveInteger(env.TEST_CONCURRENCY_CONTENDERS, "TEST_CONCURRENCY_CONTENDERS", 10),
  };
}

function throwIfError(result) {
  if (result?.error) throw new Error(result.error.message || String(result.error));
  return result?.data;
}

function createSupabaseSlotAdapter(client) {
  return {
    async getSlot(slotId) {
      return throwIfError(await client
        .from("doctor_schedule_slots")
        .select("id,status,doctor_id,slot_date,start_time,end_time")
        .eq("id", slotId)
        .single());
    },

    async listLinkedAppointments(slotId) {
      return throwIfError(await client
        .from("appointments")
        .select("id,status")
        .eq("doctor_schedule_slot_id", slotId)
        .limit(5)) || [];
    },

    async setAvailable(slotId) {
      const data = throwIfError(await client
        .from("doctor_schedule_slots")
        .update({ status: "AVAILABLE", updated_at: new Date().toISOString() })
        .eq("id", slotId)
        .select("id,status")
        .single());
      assert.equal(data?.status, "AVAILABLE", "Cleanup must restore slot to AVAILABLE");
      return data;
    },

    async reserve(slotId) {
      return throwIfError(await client
        .from("doctor_schedule_slots")
        .update({ status: "BOOKED", updated_at: new Date().toISOString() })
        .eq("id", slotId)
        .eq("status", "AVAILABLE")
        .select("id,status")
        .maybeSingle());
    },
  };
}

async function assertDedicatedFixture(adapter, slotId) {
  const slot = await adapter.getSlot(slotId);
  assert.ok(slot, `Dedicated test slot ${slotId} does not exist`);
  assert.equal(slot.status, "AVAILABLE", "Dedicated test slot must start AVAILABLE");

  const linkedAppointments = await adapter.listLinkedAppointments(slotId);
  assert.equal(linkedAppointments.length, 0, "Dedicated test slot must not be linked to any appointment");
  return slot;
}

async function runConcurrencyRound(adapter, { slotId, contenders, round }) {
  await adapter.setAvailable(slotId);
  const attempts = Array.from({ length: contenders }, () => adapter.reserve(slotId));
  const results = await Promise.all(attempts);
  const winners = results.filter((data) => data?.id === slotId && data?.status === "BOOKED");

  assert.equal(
    winners.length,
    1,
    `Round ${round}: exactly one of ${contenders} concurrent reservations must win`,
  );
  assert.equal(
    results.filter((data) => data == null).length,
    contenders - 1,
    `Round ${round}: every losing conditional update must return null`,
  );

  const finalSlot = await adapter.getSlot(slotId);
  assert.equal(finalSlot.status, "BOOKED", `Round ${round}: winning reservation must persist BOOKED`);
  return { round, winnerCount: winners.length, loserCount: contenders - winners.length };
}

async function runRealDbConcurrency(adapter, config, write = (message) => process.stdout.write(message)) {
  const fixture = await assertDedicatedFixture(adapter, config.slotId);
  const startedAt = new Date().toISOString();
  const rounds = [];

  write(`Fixture slot ${fixture.id}: doctor=${fixture.doctor_id}, date=${fixture.slot_date}, start=${fixture.start_time}\n`);
  try {
    for (let round = 1; round <= config.rounds; round += 1) {
      const result = await runConcurrencyRound(adapter, { ...config, round });
      rounds.push(result);
      write(`Round ${round}/${config.rounds}: 1 winner, ${result.loserCount} rejected\n`);
    }
  } finally {
    await adapter.setAvailable(config.slotId);
  }

  const finalSlot = await adapter.getSlot(config.slotId);
  assert.equal(finalSlot.status, "AVAILABLE", "Final cleanup must leave the fixture AVAILABLE");
  const linkedAppointments = await adapter.listLinkedAppointments(config.slotId);
  assert.equal(linkedAppointments.length, 0, "Concurrency test must not create appointments");

  return {
    startedAt,
    slotId: config.slotId,
    rounds: rounds.length,
    contendersPerRound: config.contenders,
    totalAttempts: config.rounds * config.contenders,
    finalStatus: finalSlot.status,
  };
}

async function main(env = process.env) {
  const config = readConfig(env);
  const client = createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const summary = await runRealDbConcurrency(createSupabaseSlotAdapter(client), config);
  process.stdout.write(`${JSON.stringify({ ok: true, ...summary })}\n`);
  return summary;
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  assertDedicatedFixture,
  createSupabaseSlotAdapter,
  main,
  readConfig,
  runConcurrencyRound,
  runRealDbConcurrency,
};
