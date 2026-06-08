-- Add CHECKED_IN value to AppointmentStatus enum
-- This represents the state when a customer has physically arrived and been checked in by staff,
-- distinct from CONFIRMED (booking confirmed but customer not yet arrived).

ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'CHECKED_IN';
