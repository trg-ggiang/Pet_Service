import type { CustomerProfile } from "../../services/customer/customerProfileApi";
import type { CustomerNotificationsPayload } from "../../services/customerNotifications";

export const mockCustomerProfile: CustomerProfile = {
  id: 10,
  userId: 1,
  fullName: "Nguyen Van Minh",
  email: "customer@example.test",
  phone: "0901000001",
  address: "20 Nguyen Hue",
  dateOfBirth: "1990-02-18",
  age: 36,
  gender: "MALE",
};

export const mockCustomerPetDashboard = {
  customer: {
    id: 10,
    full_name: "Nguyen Van Minh",
    phone: "0901000001",
    address: "20 Nguyen Hue",
    user_id: 1,
  },
  species: [{ id: 1, name: "Dog", description: null, care_instruction: null }],
  breeds: [{ id: 11, species_id: 1, name: "Poodle", description: null }],
  pets: [
    {
      id: 100,
      customerId: 10,
      speciesId: 1,
      breedId: 11,
      name: "Milo",
      gender: "MALE",
      genderLabel: "Male",
      species: "Dog",
      breed: "Poodle",
      age: "4 years",
      dob: "2022-01-01",
      weight: "5.4 kg",
      color: "Brown",
      image: null,
      initials: "M",
      colorId: "slate",
      allergies: null,
      chronicDiseases: null,
      specialNote: null,
      healthy: true,
      lastVisit: "15/6/2026",
      nextVaccine: "15/12/2026",
      latestVaccination: null,
      latestMedicalVisit: null,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    },
  ],
};

export const mockNotificationsPayload: CustomerNotificationsPayload = {
  notifications: [
    {
      id: 1,
      user_id: 1,
      title: "Appointment confirmed",
      content: "Your appointment is confirmed",
      type: "APPOINTMENT",
      is_read: false,
      created_at: "2026-06-10T08:00:00.000Z",
    },
  ],
  summary: {
    total: 1,
    unreadCount: 1,
  },
};

export const mockServiceHistoryPayload = {
  history: [
    {
      id: "INV-000400",
      invoiceId: 400,
      appointmentId: 200,
      isRated: false,
      sortAt: "2026-06-15T09:00:00.000Z",
      date: "15/6/2026",
      service: "Kham tong quat",
      services: ["Kham tong quat"],
      items: [],
      pet: "Milo",
      cost: "250.000d",
      status: "completed",
      type: "medical",
      staff: "Dr. Nguyen",
      details: "Mild dermatitis",
      medicalRecord: null,
      prescriptions: [],
    },
  ],
  summary: {
    total: 1,
    filtered: 1,
    typeCounts: [{ type: "all", count: 1 }],
  },
};
