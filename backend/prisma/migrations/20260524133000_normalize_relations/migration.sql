ALTER TABLE "doctor_schedules" DROP CONSTRAINT "doctor_schedules_doctor_id_fkey";
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_doctor_schedule_id_fkey";

ALTER TABLE "appointments"
  DROP COLUMN "customer_id",
  DROP COLUMN "doctor_id";

ALTER TABLE "appointment_services"
  DROP COLUMN "computed_price";

ALTER TABLE "medical_visits"
  DROP COLUMN "pet_id",
  DROP COLUMN "doctor_id";

ALTER TABLE "prescriptions"
  DROP COLUMN "doctor_id";

ALTER TABLE "grooming_records"
  DROP COLUMN "pet_id";

ALTER TABLE "boarding"
  DROP COLUMN "pet_id";

ALTER TABLE "invoices"
  DROP COLUMN "customer_id";

ALTER TABLE "reviews"
  DROP COLUMN "pet_id";

ALTER TABLE "doctor_schedules"
  ADD CONSTRAINT "doctor_schedules_doctor_id_fkey"
  FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_doctor_schedule_id_fkey"
  FOREIGN KEY ("doctor_schedule_id") REFERENCES "doctor_schedules"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
