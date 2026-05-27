export type SpeciesOption = {
  id: number;
  name: string;
  description?: string | null;
  care_instruction?: string | null;
};

export type BreedOption = {
  id: number;
  species_id: number;
  name: string;
  description?: string | null;
};

export type CustomerInfo = {
  id: number;
  full_name: string;
  phone?: string | null;
  address?: string | null;
  user_id?: number;
};

export type PetSummary = {
  id: number;
  customerId: number;
  speciesId: number;
  breedId: number | null;
  name: string;
  gender: "MALE" | "FEMALE" | "UNKNOWN";
  genderLabel: string;
  species: string;
  breed: string;
  age: string;
  dob: string | null;
  weight: string;
  color: string | null;
  image: string | null;
  initials: string;
  colorId: string;
  allergies: string | null;
  chronicDiseases: string | null;
  specialNote: string | null;
  healthy: boolean;
  lastVisit: string;
  nextVaccine: string;
  latestVaccination: null | {
    vaccineName: string;
    dateGiven: string;
    nextDueDate: string | null;
    note: string | null;
  };
  latestMedicalVisit: null | {
    symptoms: string | null;
    clinicalExam: string | null;
    diagnosisNote: string | null;
    nextVisitDate: string | null;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type CustomerPetDashboard = {
  customer: CustomerInfo;
  species: SpeciesOption[];
  breeds: BreedOption[];
  pets: PetSummary[];
};

export type PetDetail = {
  pet: {
    id: number;
    customer_id: number;
    species_id: number;
    breed_id: number | null;
    name: string;
    gender: "MALE" | "FEMALE" | "UNKNOWN";
    dob: string | null;
    weight: number | null;
    color: string | null;
    img_url: string | null;
    allergies: string | null;
    chronic_diseases: string | null;
    special_note: string | null;
    created_at: string;
    updated_at: string;
  };
  appointments: Array<{
    id: number;
    pet_id: number;
    appointment_type: string;
    status: string;
    note: string | null;
    cancel_reason: string | null;
    created_at: string;
    updated_at: string;
  }>;
  vaccinations: Array<{
    id: number;
    pet_id: number;
    appointment_id: number | null;
    vaccine_name: string;
    date_given: string;
    next_due_date: string | null;
    note: string | null;
  }>;
  medicalVisits: Array<{
    id: number;
    appointment_id: number;
    symptoms: string | null;
    clinical_exam: string | null;
    diagnosis_note: string | null;
    next_visit_date: string | null;
    created_at: string;
    updated_at: string;
  }>;
  groomingRecords: Array<{
    id: number;
    appointment_id: number;
    appointment_service_id: number | null;
    staff_id: number | null;
    status: string;
    started_at: string | null;
    completed_at: string | null;
    before_image_url: string | null;
    after_image_url: string | null;
    notes: string | null;
  }>;
  boardingRecords: Array<{
    id: number;
    appointment_id: number;
    cage_id: number;
    check_in: string | null;
    check_out: string | null;
    feeding_instruction: string | null;
    habit_note: string | null;
    special_note: string | null;
    pickup_reminder_at: string | null;
    current_status: string;
  }>;
  invoices: Array<{
    id: number;
    appointment_id: number;
    subtotal_amount: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    payment_method: string | null;
    payment_status: string;
    transaction_code: string | null;
    paid_at: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
};

export type CreateCustomerPetInput = {
  speciesId: number;
  breedId?: number | null;
  name: string;
  gender: "MALE" | "FEMALE" | "UNKNOWN";
  dob?: string | null;
  weight?: string | number | null;
  color?: string | null;
  imgUrl?: string | null;
  allergies?: string | null;
  chronicDiseases?: string | null;
  specialNote?: string | null;
};
