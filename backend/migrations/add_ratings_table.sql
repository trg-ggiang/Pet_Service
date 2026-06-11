-- Migration: Add ratings table for staff/doctor star ratings
-- Run this against your Supabase database

CREATE TABLE IF NOT EXISTS "ratings" (
  "id" SERIAL PRIMARY KEY,
  "appointment_id" INTEGER REFERENCES "appointments"("id") ON DELETE SET NULL,
  "doctor_id" INTEGER REFERENCES "doctors"("id") ON DELETE SET NULL,
  "customer_id" INTEGER REFERENCES "customers"("id") ON DELETE SET NULL,
  "score" INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  "comment" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "ratings_appointment_id_key" ON "ratings"("appointment_id");
