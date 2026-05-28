// Script to check all users
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const { supabase } = require("../lib/supabaseClient");

async function checkUsers() {
  console.log("[SCRIPT] Checking all users...\n");

  const { data: users } = await supabase
    .from("users")
    .select("id, email, role");

  console.log("=== ALL USERS ===");
  console.log(JSON.stringify(users, null, 2));
}

checkUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
