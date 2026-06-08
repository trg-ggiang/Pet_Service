CREATE TABLE "doctor_schedule_slots" (
    "id" SERIAL NOT NULL,
    "doctor_schedule_id" INTEGER NOT NULL,
    "doctor_id" INTEGER NOT NULL,
    "slot_date" DATE NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_schedule_slots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "doctor_schedule_slots_doctor_id_slot_date_start_time_key"
ON "doctor_schedule_slots"("doctor_id", "slot_date", "start_time");

CREATE INDEX "doctor_schedule_slots_doctor_schedule_id_idx"
ON "doctor_schedule_slots"("doctor_schedule_id");

CREATE INDEX "doctor_schedule_slots_doctor_id_idx"
ON "doctor_schedule_slots"("doctor_id");

CREATE INDEX "doctor_schedule_slots_slot_date_idx"
ON "doctor_schedule_slots"("slot_date");

CREATE INDEX "doctor_schedule_slots_status_idx"
ON "doctor_schedule_slots"("status");

ALTER TABLE "doctor_schedule_slots"
ADD CONSTRAINT "doctor_schedule_slots_doctor_schedule_id_fkey"
FOREIGN KEY ("doctor_schedule_id") REFERENCES "doctor_schedules"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "doctor_schedule_slots"
ADD CONSTRAINT "doctor_schedule_slots_doctor_id_fkey"
FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "doctor_schedule_slots" (
    "doctor_schedule_id",
    "doctor_id",
    "slot_date",
    "start_time",
    "end_time",
    "status",
    "created_at",
    "updated_at"
)
SELECT
    schedule."id",
    schedule."doctor_id",
    schedule."work_date",
    slot_start::time,
    LEAST(slot_start + interval '30 minutes', schedule."work_date" + schedule."end_time")::time,
    CASE
        WHEN schedule."status" = 'OFF' THEN 'OFF'::"ScheduleStatus"
        ELSE 'AVAILABLE'::"ScheduleStatus"
    END,
    schedule."created_at",
    schedule."updated_at"
FROM "doctor_schedules" schedule
CROSS JOIN LATERAL generate_series(
    schedule."work_date" + schedule."start_time",
    schedule."work_date" + schedule."end_time" - interval '30 minutes',
    interval '30 minutes'
) AS slot_start
WHERE schedule."end_time" > schedule."start_time"
ON CONFLICT ("doctor_id", "slot_date", "start_time") DO NOTHING;

ALTER TABLE "appointments"
ADD COLUMN "doctor_schedule_slot_id" INTEGER;

UPDATE "appointments" appointment
SET "doctor_schedule_slot_id" = slot."id"
FROM "doctor_schedule_slots" slot
WHERE appointment."doctor_id" = slot."doctor_id"
  AND appointment."doctor_schedule_id" = slot."doctor_schedule_id"
  AND COALESCE(appointment."requested_date", slot."slot_date") = slot."slot_date"
  AND COALESCE(appointment."requested_time", slot."start_time") = slot."start_time";

UPDATE "doctor_schedule_slots" slot
SET "status" = CASE
    WHEN appointment."status" = 'IN_PROGRESS' THEN 'IN_PROGRESS'::"ScheduleStatus"
    WHEN appointment."status" = 'COMPLETED' THEN 'DONE'::"ScheduleStatus"
    WHEN appointment."status" IN ('CANCELLED', 'NO_SHOW') THEN 'AVAILABLE'::"ScheduleStatus"
    ELSE 'BOOKED'::"ScheduleStatus"
END
FROM "appointments" appointment
WHERE appointment."doctor_schedule_slot_id" = slot."id";

CREATE UNIQUE INDEX "appointments_doctor_schedule_slot_id_key"
ON "appointments"("doctor_schedule_slot_id");

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_doctor_schedule_slot_id_fkey"
FOREIGN KEY ("doctor_schedule_slot_id") REFERENCES "doctor_schedule_slots"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointments"
DROP CONSTRAINT IF EXISTS "appointments_doctor_schedule_id_fkey";

ALTER TABLE "appointments"
DROP CONSTRAINT IF EXISTS "appointments_schedule_doctor_match_fkey";

DROP INDEX IF EXISTS "appointments_doctor_schedule_id_key";

ALTER TABLE "appointments"
DROP COLUMN IF EXISTS "doctor_schedule_id";

ALTER TABLE "doctor_schedules"
DROP COLUMN IF EXISTS "status";
