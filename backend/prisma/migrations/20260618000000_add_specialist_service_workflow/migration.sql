-- Migration: add_specialist_service_workflow
-- Adds specialist room type to services, order tracking to appointment_services,
-- and a new service_order_results table for specialist examination results.

-- 1. New enums
CREATE TYPE "SpecialistRoomType" AS ENUM (
  'XRAY',
  'LAB',
  'SURGERY',
  'ENDOSCOPY',
  'ULTRASOUND',
  'DENTAL',
  'OTHER_SPECIALIST'
);

-- 2. Add specialistRoomType to services
ALTER TABLE "services"
  ADD COLUMN "specialist_room_type" "SpecialistRoomType";

CREATE INDEX "services_specialist_room_type_idx" ON "services"("specialist_room_type");

-- 3. Add fields to appointment_services
ALTER TABLE "appointment_services"
  ADD COLUMN "ordered_by_doctor_id" INTEGER,
  ADD COLUMN "note"                  TEXT,
  ADD COLUMN "ordered_at"            TIMESTAMPTZ;

ALTER TABLE "appointment_services"
  ADD CONSTRAINT "appointment_services_ordered_by_doctor_id_fkey"
  FOREIGN KEY ("ordered_by_doctor_id") REFERENCES "users"("id") ON DELETE SET NULL;

CREATE INDEX "appointment_services_ordered_by_doctor_id_idx" ON "appointment_services"("ordered_by_doctor_id");
CREATE INDEX "appointment_services_status_idx" ON "appointment_services"("status");

-- 4. Create service_order_results table
CREATE TABLE "service_order_results" (
  "id"                      SERIAL PRIMARY KEY,
  "appointment_service_id"  INTEGER        NOT NULL,
  "performed_by_id"         INTEGER        NOT NULL,
  "result_text"             TEXT,
  "image_urls"              TEXT[]         NOT NULL DEFAULT '{}',
  "measurements"            JSONB,
  "notes"                   TEXT,
  "performed_at"            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "created_at"              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "updated_at"              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT "service_order_results_appointment_service_id_fkey"
    FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE,
  CONSTRAINT "service_order_results_performed_by_id_fkey"
    FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT,
  CONSTRAINT "service_order_results_appointment_service_id_key"
    UNIQUE ("appointment_service_id")
);

CREATE INDEX "service_order_results_appointment_service_id_idx" ON "service_order_results"("appointment_service_id");
CREATE INDEX "service_order_results_performed_by_id_idx" ON "service_order_results"("performed_by_id");
