require("dotenv").config();

const { supabase } = require("./src/lib/supabaseClient");

const defaultTables = [
  "_prisma_migrations",
  "animal_species",
  "appointment_services",
  "appointments",
  "boarding",
  "boarding_daily_updates",
  "breeds",
  "cages",
  "customers",
  "diseases",
  "doctor_schedules",
  "doctors",
  "grooming_records",
  "invoice_items",
  "invoices",
  "medical_visit_diseases",
  "medical_visits",
  "notifications",
  "pets",
  "prescription_items",
  "prescriptions",
  "reviews",
  "services",
  "staffs",
  "users",
  "vaccinations",
];

function parseArgs(argv) {
  const tables = [];
  let limit = 5;

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--limit" || value === "-l") {
      const nextValue = Number(argv[index + 1]);
      if (Number.isFinite(nextValue) && nextValue > 0) {
        limit = nextValue;
      }
      index += 1;
      continue;
    }

    if (value.startsWith("--limit=")) {
      const nextValue = Number(value.split("=")[1]);
      if (Number.isFinite(nextValue) && nextValue > 0) {
        limit = nextValue;
      }
      continue;
    }

    if (value === "--all") {
      return { tables: defaultTables, limit };
    }

    tables.push(value);
  }

  return {
    tables: tables.length > 0 ? tables : defaultTables,
    limit,
  };
}

async function inspectTable(tableName, limit) {
  const { data, error, count } = await supabase
    .from(tableName)
    .select("*", { count: "exact" })
    .limit(limit);

  if (error) {
    console.error(`\n[${tableName}] ERROR`);
    console.error(error.message || error);
    return;
  }

  console.log(`\n[${tableName}] total=${count ?? "unknown"} showing=${Array.isArray(data) ? data.length : 0}`);
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  const { tables, limit } = parseArgs(process.argv);

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_KEY in backend/.env");
  }

  console.log(`Inspecting ${tables.length} table(s) with limit=${limit}`);

  for (const tableName of tables) {
    await inspectTable(tableName, limit);
  }
}

main().catch((error) => {
  console.error("Inspect failed:");
  console.error(error);
  process.exitCode = 1;
});