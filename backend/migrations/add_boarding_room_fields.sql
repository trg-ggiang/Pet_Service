-- Migration: Add boarding room fields
-- Run this against your Supabase database

-- Add room type and pricing to cages
ALTER TABLE cages
  ADD COLUMN IF NOT EXISTS price_per_day DECIMAL(12,2) NOT NULL DEFAULT 150000,
  ADD COLUMN IF NOT EXISTS size_type VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Add CHECK constraint for size_type
ALTER TABLE cages
  DROP CONSTRAINT IF EXISTS cages_size_type_check;
ALTER TABLE cages
  ADD CONSTRAINT cages_size_type_check
    CHECK (size_type IN ('SMALL', 'MEDIUM', 'LARGE', 'VIP'));

-- Add requested dates to boarding (customer's requested dates, separate from actual check_in/check_out)
ALTER TABLE boarding
  ADD COLUMN IF NOT EXISTS requested_check_in DATE,
  ADD COLUMN IF NOT EXISTS requested_check_out DATE;

-- Index for availability queries
CREATE INDEX IF NOT EXISTS idx_boarding_dates
  ON boarding (cage_id, requested_check_in, requested_check_out)
  WHERE current_status NOT IN ('CHECKED_OUT', 'CANCELLED');

-- Seed some cage data if cages table is empty
-- INSERT INTO cages (cage_number, status, price_per_day, size_type, description)
-- VALUES
--   ('P01', 'AVAILABLE', 120000, 'SMALL', 'Phòng nhỏ dành cho thú cưng dưới 5kg'),
--   ('P02', 'AVAILABLE', 120000, 'SMALL', 'Phòng nhỏ dành cho thú cưng dưới 5kg'),
--   ('P03', 'AVAILABLE', 150000, 'MEDIUM', 'Phòng vừa dành cho thú cưng 5-15kg'),
--   ('P04', 'AVAILABLE', 150000, 'MEDIUM', 'Phòng vừa dành cho thú cưng 5-15kg'),
--   ('P05', 'AVAILABLE', 180000, 'LARGE', 'Phòng lớn dành cho thú cưng 15-30kg'),
--   ('P06', 'AVAILABLE', 300000, 'VIP', 'Phòng VIP với đầy đủ tiện nghi cao cấp')
-- ON CONFLICT (cage_number) DO NOTHING;
