ALTER TABLE "appointments"
  ADD COLUMN IF NOT EXISTS "requested_date" DATE,
  ADD COLUMN IF NOT EXISTS "requested_time" TIME(6);

CREATE INDEX IF NOT EXISTS "appointments_requested_slot_idx"
  ON "appointments"("requested_date", "requested_time");
