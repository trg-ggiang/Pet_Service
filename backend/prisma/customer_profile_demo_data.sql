-- Demo customer owner profile data.
-- Run this in Supabase SQL Editor after adding customers.date_of_birth and customers.gender.
-- This updates existing customer profiles only; it does not create users or change login emails.

BEGIN;

WITH demo_profiles (
  id,
  phone,
  address,
  date_of_birth,
  gender
) AS (
  VALUES
    (1,  '0901000003', '25 Phan Xich Long, Phu Nhuan, TP.HCM', DATE '1991-04-12', 'FEMALE'),
    (2,  '0901000004', '88 Le Loi, Quan 3, TP.HCM', DATE '1988-09-23', 'FEMALE'),
    (3,  '0901000001', '12 Nguyen Trai, Quan 1, TP.HCM', DATE '1990-02-18', 'MALE'),
    (43, '0902000043', '14 Tran Quoc Toan, Quan 3, TP.HCM', DATE '1995-06-07', 'OTHER'),
    (44, '0902000044', '41 Nguyen Van Cu, Quan 5, TP.HCM', DATE '1997-01-15', 'MALE'),
    (45, '0902000045', '9 Hoang Dieu, Thu Duc, TP.HCM', DATE '1994-11-30', 'MALE'),
    (46, '0902000046', '22 Nguyen Huu Canh, Binh Thanh, TP.HCM', DATE '1992-08-04', 'FEMALE'),
    (47, '0902000047', '7 Pham Van Dong, Go Vap, TP.HCM', DATE '1989-12-19', 'MALE'),
    (48, '0902000048', '101 Cach Mang Thang Tam, Quan 10, TP.HCM', DATE '1996-03-25', 'FEMALE'),
    (49, '0902000049', '6 Nguyen Dinh Chieu, Quan 1, TP.HCM', DATE '1993-07-13', 'MALE'),
    (50, '0902000050', '33 Dien Bien Phu, Binh Thanh, TP.HCM', DATE '1998-05-21', 'MALE'),
    (51, '0902000051', '18 Vo Van Tan, Quan 3, TP.HCM', DATE '1991-10-09', 'MALE'),
    (52, '0902000052', '77 Ly Thuong Kiet, Tan Binh, TP.HCM', DATE '1987-01-28', 'MALE'),
    (53, '0902000053', '5 Nguyen Thai Hoc, Quan 1, TP.HCM', DATE '1999-09-02', 'MALE'),
    (54, '0902000054', '120 Truong Chinh, Tan Phu, TP.HCM', DATE '1994-04-17', 'FEMALE'),
    (55, '0902000055', '36 Pasteur, Quan 1, TP.HCM', DATE '1997-12-06', 'FEMALE'),
    (56, '0902000056', '64 Le Van Sy, Quan 3, TP.HCM', DATE '1992-06-14', 'MALE'),
    (57, '0902000057', '28 Nguyen Thi Minh Khai, Quan 1, TP.HCM', DATE '2000-03-03', 'UNKNOWN')
)
UPDATE customers AS c
SET
  phone = demo_profiles.phone,
  address = demo_profiles.address,
  date_of_birth = demo_profiles.date_of_birth,
  gender = demo_profiles.gender::"CustomerGender"
FROM demo_profiles
WHERE c.id = demo_profiles.id;

-- Fallback for any later customer rows not listed above.
WITH missing_profiles AS (
  SELECT
    id,
    row_number() OVER (ORDER BY id) AS rn
  FROM customers
  WHERE date_of_birth IS NULL
     OR gender = 'UNKNOWN'
     OR phone IS NULL
     OR address IS NULL
)
UPDATE customers AS c
SET
  phone = COALESCE(NULLIF(c.phone, ''), '090299' || lpad(missing_profiles.rn::text, 4, '0')),
  address = COALESCE(c.address, 'Demo address ' || missing_profiles.rn || ', TP.HCM'),
  date_of_birth = COALESCE(c.date_of_birth, DATE '1990-01-01' + (((missing_profiles.rn * 137) % 5000)::int)),
  gender = CASE
    WHEN c.gender <> 'UNKNOWN' THEN c.gender
    WHEN missing_profiles.rn % 3 = 0 THEN 'FEMALE'::"CustomerGender"
    WHEN missing_profiles.rn % 3 = 1 THEN 'MALE'::"CustomerGender"
    ELSE 'OTHER'::"CustomerGender"
  END
FROM missing_profiles
WHERE c.id = missing_profiles.id;

COMMIT;

-- Verification query:
-- SELECT id, user_id, full_name, phone, address, date_of_birth, gender
-- FROM customers
-- ORDER BY id;
