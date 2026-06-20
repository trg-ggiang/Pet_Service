const adminUsers = [
  { id: "u-customer-1", email: "customer@example.test", role: "CUSTOMER", status: "ACTIVE", created_at: "2026-01-10T00:00:00.000Z" },
  { id: "u-doctor-1", email: "doctor@example.test", role: "DOCTOR", status: "ACTIVE", created_at: "2026-01-11T00:00:00.000Z" },
  { id: "u-staff-1", email: "staff@example.test", role: "STAFF", status: "LOCKED", created_at: "2026-01-12T00:00:00.000Z" },
];

const adminCustomers = [
  {
    id: 101,
    user_id: "u-customer-1",
    full_name: "Nguyen Van Minh",
    phone: "0901000001",
    address: "1 Nguyen Trai",
    date_of_birth: "1995-05-10",
    gender: "MALE",
  },
];

const adminDoctors = [
  {
    id: 201,
    user_id: "u-doctor-1",
    full_name: "Dr Le An",
    specialization: "Noi khoa",
    room_name: "Room 2",
  },
];

const adminStaffs = [
  {
    id: 301,
    user_id: "u-staff-1",
    full_name: "Pham Staff",
    phone: "0903000003",
    address: "2 Tran Hung Dao",
  },
];

const adminPets = [
  {
    id: 401,
    customer_id: 101,
    name: "Milo",
    animal_species: { name: "Dog" },
  },
];

const adminAppointments = [
  {
    id: 501,
    pet_id: 401,
    doctor_id: 201,
    staff_id: null,
    status: "COMPLETED",
    created_at: "2026-06-20T08:00:00.000Z",
  },
  {
    id: 502,
    pet_id: 401,
    doctor_id: null,
    staff_id: 301,
    status: "CONFIRMED",
    created_at: "2026-06-20T09:00:00.000Z",
  },
];

const adminInvoices = [
  {
    id: 601,
    total_amount: 250000,
    created_at: "2026-06-20T10:00:00.000Z",
    payment_status: "PAID",
    status: "PAID",
    appointment: { pet: { customer_id: 101 } },
  },
  {
    id: 602,
    total_amount: 180000,
    created_at: "2026-06-21T10:00:00.000Z",
    payment_status: "UNPAID",
    status: "PENDING",
    appointment: { pet: { customer_id: 101 } },
  },
];

const adminServices = [
  {
    id: 701,
    name: "General Exam",
    type: "MEDICAL",
    price: 250000,
    description: "Clinical exam",
    is_active: true,
    pricing_type: "fixed",
    variants_json: null,
    specialist_room_type: null,
  },
  {
    id: 702,
    name: "Basic Grooming",
    type: "GROOMING",
    price: 300000,
    description: "Bath and trim",
    is_active: false,
    pricing_type: "fixed",
    variants_json: null,
    specialist_room_type: null,
  },
];

const adminAppointmentServices = [
  { service_id: 701, quantity: 1, unit_price: 250000 },
  { service_id: 702, quantity: 2, unit_price: 300000 },
];

const adminAppointmentRows = [
  {
    id: 501,
    status: "COMPLETED",
    requested_date: "2026-06-20",
    requested_time: "08:30:00",
    note: "Annual check",
    created_at: "2026-06-20T08:00:00.000Z",
    pet: {
      name: "Milo",
      animal_species: { name: "Dog" },
      customer: { full_name: "Nguyen Van Minh", phone: "0901000001" },
    },
    doctor: { full_name: "Dr Le An" },
    staff: null,
    appointment_services: [
      { quantity: 1, unit_price: 250000, service: { name: "General Exam" } },
    ],
  },
  {
    id: 502,
    status: "CONFIRMED",
    requested_date: "2026-06-20",
    requested_time: "09:30:00",
    note: "",
    created_at: "2026-06-20T09:00:00.000Z",
    pet: {
      name: "Bong",
      animal_species: { name: "Cat" },
      customer: { full_name: "Tran Thi Lan", phone: "0902000002" },
    },
    doctor: null,
    staff: { full_name: "Pham Staff" },
    appointment_services: [
      { quantity: 1, unit_price: 300000, service: { name: "Basic Grooming" } },
    ],
  },
];

const adminDashboardCages = [
  { id: 801, cage_number: "CAGE-01", status: "AVAILABLE" },
  { id: 802, cage_number: "CAGE-02", status: "OCCUPIED" },
];

const adminDashboardBoardings = [
  {
    id: 901,
    cage_id: 802,
    current_status: "CHECKED_IN",
    appointment: {
      pet: {
        name: "Milo",
        animal_species: { name: "Dog" },
        customer: { full_name: "Nguyen Van Minh" },
      },
    },
  },
];

const adminInvoiceItems = [
  { id: 1001, invoice_id: 601, service_id: 701, quantity: 1, total_price: 250000, unit_price: 250000, description: "General Exam" },
  { id: 1002, invoice_id: 602, service_id: 702, quantity: 1, total_price: 180000, unit_price: 180000, description: "Basic Grooming" },
];

module.exports = {
  adminAppointmentRows,
  adminAppointments,
  adminAppointmentServices,
  adminCustomers,
  adminDashboardBoardings,
  adminDashboardCages,
  adminDoctors,
  adminInvoiceItems,
  adminInvoices,
  adminPets,
  adminServices,
  adminStaffs,
  adminUsers,
};
