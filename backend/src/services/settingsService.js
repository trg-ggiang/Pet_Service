const { supabase } = require("../lib/supabaseClient");

async function getStoredSetting(key) {
  const { data, error } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value ?? null;
}

async function saveStoredSetting(key, value) {
  const { error } = await supabase.from("app_settings").upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
  }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  return value;
}

module.exports = { getStoredSetting, saveStoredSetting };
