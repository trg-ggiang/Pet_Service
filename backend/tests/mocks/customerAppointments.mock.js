const appointmentCustomerId = 10;
const appointmentPet = {
  id: 100,
  customer_id: appointmentCustomerId,
  name: "Milo",
};

const pendingAppointment = {
  id: 200,
  pet_id: appointmentPet.id,
  doctor_id: 300,
  staff_id: null,
  doctor_schedule_slot_id: 400,
  appointment_type: "MEDICAL",
  status: "PENDING",
  note: "Initial note",
  cancel_reason: null,
  requested_date: "2099-07-20",
  requested_time: "09:00:00",
  created_at: "2026-06-20T08:00:00.000Z",
  updated_at: "2026-06-20T08:00:00.000Z",
};

const completedAppointment = {
  ...pendingAppointment,
  status: "COMPLETED",
};

const appointmentActors = {
  id: pendingAppointment.id,
  doctors: { user_id: 30, full_name: "Dr. Nguyen" },
  pets: {
    name: appointmentPet.name,
    customers: { user_id: 1, full_name: "Nguyen Van Minh" },
  },
};

const medicalService = {
  id: 501,
  name: "Kham tong quat",
  type: "MEDICAL",
  price: 250000,
};

const groomingService = {
  id: 502,
  name: "Tam cat tia",
  type: "GROOMING",
  price: 300000,
};

module.exports = {
  appointmentActors,
  appointmentCustomerId,
  appointmentPet,
  completedAppointment,
  groomingService,
  medicalService,
  pendingAppointment,
};
