const staffId = 20;

const staffProfileRow = {
  id: staffId,
  full_name: "Le Staff",
  phone: "0903000003",
  address: "2 Tran Hung Dao",
  users: { email: "staff@example.test" },
};

const pendingAppointment = {
  id: 300,
  status: "PENDING",
  staff_id: null,
  appointment_services: [
    {
      id: 700,
      service_id: 501,
      services: { id: 501, name: "Kham tong quat", type: "MEDICAL" },
    },
  ],
};

const confirmedAppointment = {
  ...pendingAppointment,
  status: "CONFIRMED",
  requested_date: null,
};

const completedAppointment = {
  ...pendingAppointment,
  status: "COMPLETED",
};

const groomingRecord = {
  id: 900,
  staff_id: null,
  appointment_id: 300,
  appointment_service_id: 700,
};

const unpaidInvoice = {
  id: 1000,
  payment_status: "UNPAID",
  appointment_id: 300,
  total_amount: 250000,
};

const paidInvoice = {
  ...unpaidInvoice,
  payment_status: "PAID",
};

module.exports = {
  completedAppointment,
  confirmedAppointment,
  groomingRecord,
  paidInvoice,
  pendingAppointment,
  staffId,
  staffProfileRow,
  unpaidInvoice,
};
