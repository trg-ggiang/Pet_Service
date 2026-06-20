import type {
  DoctorAppointment,
  DoctorExamDetail,
  DoctorExamRecord,
  DoctorNotification,
  DoctorScheduleMeta,
  DoctorScheduleSummary,
  ServiceOrder,
  SpecialistService,
} from "../../features/doctor/services/doctorAppointments";

export const mockDoctorAppointment: DoctorAppointment = {
  id: "APT-00502",
  appointmentId: 502,
  petId: 802,
  date: "2099-07-20",
  time: "09:00",
  endTime: "09:30",
  roomName: "Room 2",
  petName: "Milo",
  petImage: null,
  species: "Dog",
  breed: "Poodle",
  owner: "Nguyen Van Minh",
  ownerPhone: "0901000001",
  service: "Kham benh",
  serviceType: "MEDICAL",
  status: {
    label: "Dang kham",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
  statusKey: "in_progress",
  statusView: {
    label: "Dang kham",
    cls: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  note: "Follow temperature",
  createdAt: "2026-06-20T08:00:00.000Z",
  scheduleRow: {
    id: "APT-00502",
    appointmentId: 502,
    time: "09:00",
    date: "2099-07-20",
    dateLabel: "20/07/2099",
    patient: "Milo",
    species: "Dog",
    owner: "Nguyen Van Minh",
    service: "Kham benh",
    statusKey: "in_progress",
    statusView: {
      label: "Dang kham",
      cls: "bg-amber-50 text-amber-700 ring-amber-200",
      dot: "bg-amber-500",
    },
  },
};

export const mockDoctorSummary: DoctorScheduleSummary = {
  total: 1,
  completed: 0,
  inProgress: 1,
  scheduled: 0,
};

export const mockDoctorMeta: DoctorScheduleMeta = {
  title: "Lich kham cua bac si",
  dateLabel: "Tat ca lich kham",
  roomLabel: "Room 2",
  activityLabel: "Room 2 - Dang hoat dong",
};

export const mockDoctorNotification: DoctorNotification = {
  id: 7001,
  title: "Appointment ready",
  content: "Milo is checked in",
  type: "APPOINTMENT",
  isRead: false,
  createdAt: "2026-06-20T08:15:00.000Z",
};

export const mockDoctorExamRecord: DoctorExamRecord = {
  chiefComplaint: "Coughing",
  selectedSymptoms: ["cough", "fever"],
  duration: "1-3d",
  onset: "gradual",
  severity: 3,
  ownerNotes: "Eating less",
  vitals: {
    temp: "39.2",
    heart: "120",
    resp: "30",
    spo2: "98",
    weight: "5.4",
  },
  systems: {
    respiratory: { status: "abnormal", notes: "Mild wheezing" },
  },
  clinicalNote: "Suspected respiratory infection",
  prescriptions: [
    {
      id: "rx-1",
      medicineName: "Amoxicillin",
      dosage: "50mg",
      frequency: "BID",
      route: "oral",
      durationDays: 5,
      instructions: "After meal",
    },
  ],
  nextVisitDate: null,
  nextVisitTime: "",
};

export const mockDoctorExamDetail: DoctorExamDetail = {
  appointment: {
    id: 502,
    displayId: "APT-00502",
    status: "IN_PROGRESS",
    statusLabel: "Dang kham",
    serviceType: "MEDICAL",
    serviceLabel: "Kham benh",
    date: "2099-07-20",
    dateLabel: "20/07/2099",
    time: "09:00",
    endTime: "09:30",
    roomName: "Room 2",
    note: "Follow temperature",
  },
  patientCard: {
    id: 802,
    name: "Milo",
    initials: "M",
    imageUrl: null,
    subtitle: "Dog - Poodle",
    serviceBadge: "Kham benh",
  },
  petInfoItems: [],
  owner: {
    id: 702,
    fullName: "Nguyen Van Minh",
    phone: "0901000001",
    address: "1 Nguyen Trai",
  },
  riskAlerts: [],
  vaccinations: [],
  history: [],
  formSchema: {
    symptomOptions: [],
    bodySystems: [],
    durationOptions: [],
    onsetOptions: [],
    severityOptions: [],
    systemStatusOptions: [],
    vitalFields: [],
  },
  record: mockDoctorExamRecord,
};

export const mockSpecialistService: SpecialistService = {
  id: 401,
  name: "X-ray",
  price: 300000,
  specialist_room_type: "XRAY",
};

export const mockServiceOrder: ServiceOrder = {
  id: 901,
  service_id: 401,
  quantity: 1,
  unit_price: 300000,
  status: "PENDING",
  note: "Chest view",
  ordered_at: "2026-06-20T08:20:00.000Z",
  services: mockSpecialistService,
  service_order_results: null,
};
