import type {
  CustomerAppointment,
  CustomerAppointmentListPayload,
  CustomerAppointmentOptions,
  CustomerAppointmentProvider,
} from "../../types/customer/appointments";

export const mockAppointment: CustomerAppointment = {
  id: "APT-000200",
  appointmentId: 200,
  petId: 100,
  date: "20/07/2099",
  time: "09:00",
  service: "Kham tong quat",
  pet: "Milo",
  doctor: "Dr. Nguyen",
  status: "PENDING",
  serviceType: "Khám bệnh",
  room: "Room 01",
  queue: "A200",
  note: "",
  serviceFee: 250000,
  totalCost: 250000,
  createdAt: "2026-06-20T08:00:00.000Z",
  updatedAt: "2026-06-20T08:00:00.000Z",
  createdAtLabel: "20/06, 08:00",
  updatedAtLabel: "20/06, 08:00",
  hasPrescription: false,
  prescriptions: undefined,
  iconKey: "medical",
  iconColor: "#0891B2",
  iconBg: "#ECFEFF",
};

export const mockAppointmentOptions: CustomerAppointmentOptions = {
  services: [
    {
      id: 501,
      name: "Kham tong quat",
      serviceType: "Khám bệnh",
      iconKey: "medical",
      iconColor: "#0891B2",
      iconBg: "#ECFEFF",
    },
  ],
};

export const mockAppointmentListPayload: CustomerAppointmentListPayload = {
  appointments: [mockAppointment],
  summary: {
    total: 1,
    filtered: 1,
    statusCounts: [{ status: "all", count: 1 }],
    petOptions: ["Milo"],
    serviceTypeOptions: ["Khám bệnh"],
  },
  pagination: {
    page: 1,
    pageSize: 5,
    pageCount: 1,
    total: 1,
    from: 1,
    to: 1,
  },
};

export const mockProvider: CustomerAppointmentProvider = {
  role: "doctor",
  id: 300,
  name: "Dr. Nguyen",
  title: "Veterinarian",
  description: "General care",
  experienceYears: 5,
  room: "Room 01",
  scheduleId: 400,
  serviceType: "Khám bệnh",
  date: "2099-07-20",
  time: "09:00",
  status: "PENDING",
};
