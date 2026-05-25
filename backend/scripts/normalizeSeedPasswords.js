require("dotenv").config();

const bcrypt = require("bcryptjs");
const { supabase } = require("../src/lib/supabaseClient");
const { DEMO_SEED_PASSWORD } = require("../src/services/authService");

async function main() {
  const hashedPassword = await bcrypt.hash(DEMO_SEED_PASSWORD, 10);

  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, password_hash")
    .order("id", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const placeholderUsers = (users || []).filter((user) => String(user.password_hash || "").includes("seeded-password-hash-for-demo-only"));

  if (placeholderUsers.length === 0) {
    console.log("No placeholder seed passwords found.");
    return;
  }

  for (const user of placeholderUsers) {
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: hashedPassword })
      .eq("id", user.id);

    if (updateError) {
      throw new Error(`Failed to update ${user.email}: ${updateError.message}`);
    }

    console.log(`Updated seed password for ${user.email}`);
  }

  console.log(`Done. Seed login password: ${DEMO_SEED_PASSWORD}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});