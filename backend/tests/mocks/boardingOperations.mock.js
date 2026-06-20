const boardingIds = {
  customerId: 10,
  petId: 20,
  cageId: 30,
  appointmentId: 40,
  boardingId: 50,
  staffId: 60,
  invoiceId: 70,
};

const availableCage = {
  id: boardingIds.cageId,
  cage_number: "CAGE-01",
  status: "AVAILABLE",
  size_type: "SMALL",
  price_per_day: 180000,
  description: "Quiet small room",
  note: "",
};

const maintenanceCage = {
  id: boardingIds.cageId + 1,
  cage_number: "CAGE-02",
  status: "MAINTENANCE",
  size_type: "VIP",
  price_per_day: 350000,
  description: "Maintenance room",
  note: "Repairing",
};

const bookedCage = {
  id: boardingIds.cageId + 2,
  cage_number: "CAGE-03",
  status: "AVAILABLE",
  size_type: "LARGE",
  price_per_day: 250000,
  description: "Large room",
  note: "",
};

const petRow = {
  id: boardingIds.petId,
  name: "Milo",
};

const boardingServiceRow = {
  id: 90,
  price: 150000,
};

const pendingBoardingRow = {
  id: boardingIds.boardingId,
  current_status: "BOOKED",
  appointments: {
    id: boardingIds.appointmentId,
    status: "PENDING",
    pets: {
      name: "Milo",
      customers: { user_id: "u-customer-1", full_name: "Nguyen Van Minh" },
    },
  },
  cages: { cage_number: "CAGE-01" },
};

const checkedInBoardingRow = {
  id: boardingIds.boardingId,
  current_status: "CHECKED_IN",
  cage_id: boardingIds.cageId,
  check_in: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  pickup_reminder_at: new Date().toISOString(),
  appointments: {
    id: boardingIds.appointmentId,
    status: "IN_PROGRESS",
    pets: {
      name: "Milo",
      customers: { user_id: "u-customer-1", full_name: "Nguyen Van Minh" },
    },
  },
  cages: availableCage,
};

const customerBoardingRow = {
  id: boardingIds.boardingId,
  current_status: "CHECKED_IN",
  cages: { cage_number: "CAGE-01" },
  appointments: {
    pets: {
      name: "Milo",
      customers: { id: boardingIds.customerId },
    },
  },
};

module.exports = {
  availableCage,
  boardingIds,
  boardingServiceRow,
  bookedCage,
  checkedInBoardingRow,
  customerBoardingRow,
  maintenanceCage,
  pendingBoardingRow,
  petRow,
};
