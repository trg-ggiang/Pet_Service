-- Migration: Add variant pricing support to services
-- Run this against your Supabase database

ALTER TABLE "services"
  ADD COLUMN IF NOT EXISTS "pricing_type" TEXT NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS "variants_json" TEXT;
