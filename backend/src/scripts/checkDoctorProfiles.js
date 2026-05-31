// Script to check doctor profiles
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const { supabase } = require("../lib/supabaseClient");

async function checkDoctorProfiles() {
  console.log("[SCRIPT] Checking doctor profiles...\n");

  // Get all doctor users
  const { data: doctorUsers } = await supabase
    .from("users")
    .select("id, email, role")
    .eq("role", "DOCTOR");

  console.log("=== DOCTOR USERS ===");
  console.log(JSON.stringify(doctorUsers, null, 2));

  // Get all doctor profiles
  const { data: doctorProfiles } = await supabase
    .from("doctors")
    .select("id, user_id, full_name, specialization, room_name");

  console.log("\n=== DOCTOR PROFILES ===");
  console.log(JSON.stringify(doctorProfiles, null, 2));

  // Check which users are linked
  console.log("\n=== LINK STATUS ===");
  for (const user of doctorUsers) {
    const profile = doctorProfiles?.find(p => p.user_id === user.id);
    console.log(`User ${user.email} (${user.id}) -> ${profile ? `Profile ${profile.id}: ${profile.full_name}` : "NO PROFILE"}`);
  }
}

checkDoctorProfiles()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
