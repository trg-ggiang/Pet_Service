export type ActiveMedication = {
  id: number;
  medicineName: string;
  dosage: string | null;
  frequency: string | null;
  timeSlots: string[];
  durationDays: number;
  daysRemaining: number;
  startDate: string | null;
  endDate: string | null;
  instructions: string | null;
};

export type PetMedications = {
  petId: number;
  petName: string;
  species: string;
  medications: ActiveMedication[];
};

export type ActiveMedicationsPayload = {
  pets: PetMedications[];
  totalActive: number;
};
