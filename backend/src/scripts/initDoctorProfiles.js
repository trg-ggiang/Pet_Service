// Script to initialize doctor profiles
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const { supabase } = require("../lib/supabaseClient");

async function initDoctorProfiles() {
  console.log("[SCRIPT] Starting doctor profile initialization...");

  // 1. Get all users with DOCTOR role
  const { data: doctorUsers, error: usersError } = await supabase
    .from("users")
    .select("id, email")
    .eq("role", "DOCTOR");

  if (usersError) {
    console.error("[SCRIPT] Error fetching doctor users:", usersError);
    return;
  }

  console.log("[SCRIPT] Found", doctorUsers.length, "users with DOCTOR role");

  // 2. Get existing doctor profiles
  const { data: doctorProfiles } = await supabase
    .from("doctors")
    .select("user_id");

  const linkedUserIds = (doctorProfiles || []).map(d => d.user_id);
  console.log("[SCRIPT] Found", linkedUserIds.length, "existing doctor profiles");

  // 3. Find users without profiles
  const usersNeedingProfile = doctorUsers.filter(u => !linkedUserIds.includes(u.id));
  console.log("[SCRIPT] Users needing profile:", usersNeedingProfile.length);

  if (usersNeedingProfile.length === 0) {
    console.log("[SCRIPT] All doctors already have profiles!");
    return;
  }

  // 4. Create profiles
  const profilesToCreate = usersNeedingProfile.map((u, index) => ({
    user_id: u.id,
    full_name: `BS. ${u.email.split("@")[0]}`,
    specialization: "Nội khoa tổng quát",
    room_name: `Phòng ${index + 1}`,
  }));

  console.log("[SCRIPT] Creating profiles:", JSON.stringify(profilesToCreate, null, 2));

  const { data: created, error: insertError } = await supabase
    .from("doctors")
    .insert(profilesToCreate)
    .select();

  if (insertError) {
    console.error("[SCRIPT] Error creating profiles:", insertError);
    return;
  }

  console.log("[SCRIPT] Successfully created", created.length, "doctor profiles!");
  console.log("[SCRIPT] Created profiles:", JSON.stringify(created, null, 2));
}

initDoctorProfiles()
  .then(() => {
    console.log("[SCRIPT] Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[SCRIPT] Fatal error:", error);
    process.exit(1);
  });
