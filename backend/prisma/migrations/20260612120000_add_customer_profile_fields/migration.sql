-- Add optional customer profile fields for owner demographics.
-- Age should be derived from date_of_birth in application code.

CREATE TYPE "CustomerGender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNKNOWN');

ALTER TABLE "customers"
  ADD COLUMN "date_of_birth" DATE,
  ADD COLUMN "gender" "CustomerGender" NOT NULL DEFAULT 'UNKNOWN';
