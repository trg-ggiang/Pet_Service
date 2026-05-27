-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public._prisma_migrations (
  id character varying NOT NULL,
  checksum character varying NOT NULL,
  finished_at timestamp with time zone,
  migration_name character varying NOT NULL,
  logs text,
  rolled_back_at timestamp with time zone,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  applied_steps_count integer NOT NULL DEFAULT 0,
  CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.animal_species (
  id integer NOT NULL DEFAULT nextval('animal_species_id_seq'::regclass),
  name character varying NOT NULL,
  description text,
  care_instruction text,
  CONSTRAINT animal_species_pkey PRIMARY KEY (id)
);
CREATE TABLE public.appointment_services (
  id integer NOT NULL DEFAULT nextval('appointment_services_id_seq'::regclass),
  appointment_id integer NOT NULL,
  service_id integer NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::"ServiceStatus",
  CONSTRAINT appointment_services_pkey PRIMARY KEY (id),
  CONSTRAINT appointment_services_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id),
  CONSTRAINT appointment_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id)
);
CREATE TABLE public.appointments (
  id integer NOT NULL DEFAULT nextval('appointments_id_seq'::regclass),
  pet_id integer NOT NULL,
  staff_id integer,
  doctor_schedule_id integer,
  appointment_type USER-DEFINED NOT NULL DEFAULT 'MEDICAL'::"AppointmentType",
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::"AppointmentStatus",
  note text,
  cancel_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL,
  doctor_id integer,
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id),
  CONSTRAINT appointments_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staffs(id),
  CONSTRAINT appointments_doctor_schedule_id_fkey FOREIGN KEY (doctor_schedule_id) REFERENCES public.doctor_schedules(id),
  CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id),
  CONSTRAINT appointments_schedule_doctor_match_fkey FOREIGN KEY (doctor_schedule_id) REFERENCES public.doctor_schedules(id),
  CONSTRAINT appointments_schedule_doctor_match_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctor_schedules(id),
  CONSTRAINT appointments_schedule_doctor_match_fkey FOREIGN KEY (doctor_schedule_id) REFERENCES public.doctor_schedules(doctor_id),
  CONSTRAINT appointments_schedule_doctor_match_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctor_schedules(doctor_id)
);
CREATE TABLE public.boarding (
  id integer NOT NULL DEFAULT nextval('boarding_id_seq'::regclass),
  appointment_id integer NOT NULL,
  cage_id integer NOT NULL,
  check_in timestamp with time zone,
  check_out timestamp with time zone,
  feeding_instruction text,
  habit_note text,
  special_note text,
  pickup_reminder_at timestamp with time zone,
  current_status USER-DEFINED NOT NULL DEFAULT 'BOOKED'::"BoardingStatus",
  CONSTRAINT boarding_pkey PRIMARY KEY (id),
  CONSTRAINT boarding_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id),
  CONSTRAINT boarding_cage_id_fkey FOREIGN KEY (cage_id) REFERENCES public.cages(id)
);
CREATE TABLE public.boarding_daily_updates (
  id integer NOT NULL DEFAULT nextval('boarding_daily_updates_id_seq'::regclass),
  boarding_id integer NOT NULL,
  staff_id integer NOT NULL,
  date date NOT NULL,
  eating_status character varying,
  health_status character varying,
  activity_status character varying,
  note text,
  img_url text,
  CONSTRAINT boarding_daily_updates_pkey PRIMARY KEY (id),
  CONSTRAINT boarding_daily_updates_boarding_id_fkey FOREIGN KEY (boarding_id) REFERENCES public.boarding(id),
  CONSTRAINT boarding_daily_updates_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staffs(id)
);
CREATE TABLE public.breeds (
  id integer NOT NULL DEFAULT nextval('breeds_id_seq'::regclass),
  species_id integer NOT NULL,
  name character varying NOT NULL,
  description text,
  CONSTRAINT breeds_pkey PRIMARY KEY (id),
  CONSTRAINT breeds_species_id_fkey FOREIGN KEY (species_id) REFERENCES public.animal_species(id)
);
CREATE TABLE public.cages (
  id integer NOT NULL DEFAULT nextval('cages_id_seq'::regclass),
  cage_number character varying NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'AVAILABLE'::"CageStatus",
  note text,
  CONSTRAINT cages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.customers (
  id integer NOT NULL DEFAULT nextval('customers_id_seq'::regclass),
  user_id integer NOT NULL,
  full_name character varying NOT NULL,
  phone character varying,
  address text,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.diseases (
  id integer NOT NULL DEFAULT nextval('diseases_id_seq'::regclass),
  name character varying NOT NULL,
  description text,
  symptoms text,
  CONSTRAINT diseases_pkey PRIMARY KEY (id)
);
CREATE TABLE public.doctor_schedules (
  id integer NOT NULL DEFAULT nextval('doctor_schedules_id_seq'::regclass),
  doctor_id integer NOT NULL,
  work_date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  room_name character varying,
  status USER-DEFINED NOT NULL DEFAULT 'AVAILABLE'::"ScheduleStatus",
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL,
  CONSTRAINT doctor_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT doctor_schedules_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id)
);
CREATE TABLE public.doctors (
  id integer NOT NULL DEFAULT nextval('doctors_id_seq'::regclass),
  user_id integer NOT NULL,
  full_name character varying NOT NULL,
  specialization character varying,
  degree character varying,
  experience_years integer,
  room_name character varying,
  CONSTRAINT doctors_pkey PRIMARY KEY (id),
  CONSTRAINT doctors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.grooming_records (
  id integer NOT NULL DEFAULT nextval('grooming_records_id_seq'::regclass),
  appointment_id integer NOT NULL,
  appointment_service_id integer,
  staff_id integer,
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::"GroomingStatus",
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  before_image_url text,
  after_image_url text,
  notes text,
  CONSTRAINT grooming_records_pkey PRIMARY KEY (id),
  CONSTRAINT grooming_records_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id),
  CONSTRAINT grooming_records_appointment_service_id_fkey FOREIGN KEY (appointment_service_id) REFERENCES public.appointment_services(id),
  CONSTRAINT grooming_records_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staffs(id)
);
CREATE TABLE public.invoice_items (
  id integer NOT NULL DEFAULT nextval('invoice_items_id_seq'::regclass),
  invoice_id integer NOT NULL,
  service_id integer,
  appointment_service_id integer,
  medical_visit_id integer,
  vaccination_id integer,
  grooming_record_id integer,
  boarding_id integer,
  source_type USER-DEFINED NOT NULL,
  description character varying NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  CONSTRAINT invoice_items_pkey PRIMARY KEY (id),
  CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id),
  CONSTRAINT invoice_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id),
  CONSTRAINT invoice_items_appointment_service_id_fkey FOREIGN KEY (appointment_service_id) REFERENCES public.appointment_services(id),
  CONSTRAINT invoice_items_medical_visit_id_fkey FOREIGN KEY (medical_visit_id) REFERENCES public.medical_visits(id),
  CONSTRAINT invoice_items_vaccination_id_fkey FOREIGN KEY (vaccination_id) REFERENCES public.vaccinations(id),
  CONSTRAINT invoice_items_grooming_record_id_fkey FOREIGN KEY (grooming_record_id) REFERENCES public.grooming_records(id),
  CONSTRAINT invoice_items_boarding_id_fkey FOREIGN KEY (boarding_id) REFERENCES public.boarding(id)
);
CREATE TABLE public.invoices (
  id integer NOT NULL DEFAULT nextval('invoices_id_seq'::regclass),
  appointment_id integer NOT NULL,
  subtotal_amount numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  payment_method USER-DEFINED,
  payment_status USER-DEFINED NOT NULL DEFAULT 'UNPAID'::"PaymentStatus",
  transaction_code character varying,
  paid_at timestamp with time zone,
  status USER-DEFINED NOT NULL DEFAULT 'DRAFT'::"InvoiceStatus",
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL,
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id)
);
CREATE TABLE public.medical_visit_diseases (
  id integer NOT NULL DEFAULT nextval('medical_visit_diseases_id_seq'::regclass),
  medical_visit_id integer NOT NULL,
  disease_id integer NOT NULL,
  note text,
  CONSTRAINT medical_visit_diseases_pkey PRIMARY KEY (id),
  CONSTRAINT medical_visit_diseases_medical_visit_id_fkey FOREIGN KEY (medical_visit_id) REFERENCES public.medical_visits(id),
  CONSTRAINT medical_visit_diseases_disease_id_fkey FOREIGN KEY (disease_id) REFERENCES public.diseases(id)
);
CREATE TABLE public.medical_visits (
  id integer NOT NULL DEFAULT nextval('medical_visits_id_seq'::regclass),
  appointment_id integer NOT NULL,
  symptoms text,
  clinical_exam text,
  diagnosis_note text,
  next_visit_date date,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL,
  CONSTRAINT medical_visits_pkey PRIMARY KEY (id),
  CONSTRAINT medical_visits_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id)
);
CREATE TABLE public.notifications (
  id integer NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  user_id integer NOT NULL,
  title character varying NOT NULL,
  content text NOT NULL,
  type USER-DEFINED NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.pets (
  id integer NOT NULL DEFAULT nextval('pets_id_seq'::regclass),
  customer_id integer NOT NULL,
  species_id integer NOT NULL,
  breed_id integer,
  name character varying NOT NULL,
  gender USER-DEFINED NOT NULL DEFAULT 'UNKNOWN'::"PetGender",
  dob date,
  weight numeric,
  color character varying,
  img_url text,
  allergies text,
  chronic_diseases text,
  special_note text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL,
  CONSTRAINT pets_pkey PRIMARY KEY (id),
  CONSTRAINT pets_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT pets_species_id_fkey FOREIGN KEY (species_id) REFERENCES public.animal_species(id),
  CONSTRAINT pets_breed_id_fkey FOREIGN KEY (breed_id) REFERENCES public.breeds(id)
);
CREATE TABLE public.prescription_items (
  id integer NOT NULL DEFAULT nextval('prescription_items_id_seq'::regclass),
  prescription_id integer NOT NULL,
  medicine_name character varying NOT NULL,
  dosage character varying NOT NULL,
  frequency character varying NOT NULL,
  duration_days integer,
  instructions text,
  CONSTRAINT prescription_items_pkey PRIMARY KEY (id),
  CONSTRAINT prescription_items_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id)
);
CREATE TABLE public.prescriptions (
  id integer NOT NULL DEFAULT nextval('prescriptions_id_seq'::regclass),
  medical_visit_id integer NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL,
  CONSTRAINT prescriptions_pkey PRIMARY KEY (id),
  CONSTRAINT prescriptions_medical_visit_id_fkey FOREIGN KEY (medical_visit_id) REFERENCES public.medical_visits(id)
);
CREATE TABLE public.reviews (
  id integer NOT NULL DEFAULT nextval('reviews_id_seq'::regclass),
  customer_id integer NOT NULL,
  appointment_id integer,
  target_type USER-DEFINED NOT NULL,
  target_id integer,
  rating integer NOT NULL,
  feedback text,
  reply_content text,
  replied_by_user_id integer,
  replied_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT reviews_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id),
  CONSTRAINT reviews_replied_by_user_id_fkey FOREIGN KEY (replied_by_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.services (
  id integer NOT NULL DEFAULT nextval('services_id_seq'::regclass),
  name character varying NOT NULL,
  type USER-DEFINED NOT NULL,
  price numeric NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT services_pkey PRIMARY KEY (id)
);
CREATE TABLE public.staffs (
  id integer NOT NULL DEFAULT nextval('staffs_id_seq'::regclass),
  user_id integer NOT NULL,
  full_name character varying NOT NULL,
  phone character varying,
  address text,
  CONSTRAINT staffs_pkey PRIMARY KEY (id),
  CONSTRAINT staffs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  email character varying NOT NULL,
  password_hash character varying NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'CUSTOMER'::"Role",
  status USER-DEFINED NOT NULL DEFAULT 'ACTIVE'::"UserStatus",
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL,
  deleted_at timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vaccinations (
  id integer NOT NULL DEFAULT nextval('vaccinations_id_seq'::regclass),
  pet_id integer NOT NULL,
  appointment_id integer,
  vaccine_name character varying NOT NULL,
  date_given date NOT NULL,
  next_due_date date,
  note text,
  CONSTRAINT vaccinations_pkey PRIMARY KEY (id),
  CONSTRAINT vaccinations_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id),
  CONSTRAINT vaccinations_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id)
);