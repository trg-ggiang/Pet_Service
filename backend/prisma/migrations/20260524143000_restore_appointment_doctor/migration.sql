ALTER TABLE "appointments"
  ADD COLUMN "doctor_id" INTEGER;

UPDATE "appointments" AS a
SET "doctor_id" = ds."doctor_id"
FROM "doctor_schedules" AS ds
WHERE a."doctor_schedule_id" = ds."id";

CREATE INDEX "appointments_doctor_id_idx" ON "appointments"("doctor_id");

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_doctor_id_fkey"
  FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "doctor_schedules"
  ADD CONSTRAINT "doctor_schedules_id_doctor_id_key"
  UNIQUE ("id", "doctor_id");

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_schedule_requires_doctor_check"
  CHECK ("doctor_schedule_id" IS NULL OR "doctor_id" IS NOT NULL);

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_schedule_doctor_match_fkey"
  FOREIGN KEY ("doctor_schedule_id", "doctor_id")
  REFERENCES "doctor_schedules"("id", "doctor_id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
