-- Add unique constraint: mỗi bác sĩ chỉ có 1 bệnh nhân mỗi khung giờ
-- This prevents double-booking a doctor for the same date+time slot

CREATE UNIQUE INDEX IF NOT EXISTS "appointments_doctor_datetime_unique"
ON "appointments" ("doctor_id", "requested_date", "requested_time")
WHERE "doctor_id" IS NOT NULL
  AND "requested_date" IS NOT NULL
  AND "requested_time" IS NOT NULL
  AND "status" NOT IN ('CANCELLED', 'NO_SHOW');
