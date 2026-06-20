const customerRow = {
  id: 10,
  user_id: 1,
  full_name: "Nguyen Van Minh",
  phone: "0901000001",
  address: "20 Nguyen Hue",
  date_of_birth: "1990-02-18",
  gender: "MALE",
  users: { email: "customer@example.test" },
};

const petRow = {
  id: 100,
  customer_id: customerRow.id,
  species_id: 1,
  breed_id: 11,
  name: "Milo",
  gender: "MALE",
  dob: "2022-01-01",
  weight: 5.4,
  color: "Brown",
  img_url: null,
  allergies: null,
  chronic_diseases: null,
  special_note: null,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-01T00:00:00.000Z",
};

const createPetInput = {
  name: "Dau",
  speciesId: 1,
  breedId: 11,
  gender: "FEMALE",
  dob: "2024-01-01",
  weight: "3.5",
  color: "khong co",
  allergies: "none",
  chronicDiseases: "",
  specialNote: "Friendly",
};

const notifications = [
  {
    id: 1,
    user_id: 1,
    title: "Appointment confirmed",
    content: "Your appointment is confirmed",
    type: "APPOINTMENT",
    is_read: false,
    created_at: "2026-06-10T08:00:00.000Z",
  },
  {
    id: 2,
    user_id: 1,
    title: "Payment received",
    content: "Payment completed",
    type: "PAYMENT",
    is_read: true,
    created_at: "2026-06-09T08:00:00.000Z",
  },
];

module.exports = {
  createPetInput,
  customerRow,
  notifications,
  petRow,
};
