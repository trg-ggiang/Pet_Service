const { createClient } = require("@supabase/supabase-js");
const WebSocket = require("ws");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

if (!isSupabaseConfigured) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_KEY in backend/.env");
}

if (typeof global.WebSocket === "undefined") {
  global.WebSocket = WebSocket;
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

module.exports = {
  supabase,
  isSupabaseConfigured,
};