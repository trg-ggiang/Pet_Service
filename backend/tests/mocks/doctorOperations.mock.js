const doctorId = 30;

const doctorAppointmentRows = [
  {
    id: 502,
    pet_id: 802,
    doctor_id: doctorId,
    doctor_schedule_slot_id: 902,
    appointment_type: "MEDICAL",
    status: "IN_PROGRESS",
    note: "Follow temperature",
    requested_date: "2099-07-20",
    requested_time: "09:00:00",
    created_at: "2026-06-20T08:00:00.000Z",
    doctors: { room_name: "Room 2" },
    doctor_schedule_slots: {
      slot_date: "2099-07-20",
      start_time: "09:00:00",
      end_time: "09:30:00",
      schedule: { room_name: "Room 2" },
    },
    pets: {
      id: 802,
      name: "Milo",
      img_url: null,
      species: { name: "Dog" },
      breed: { name: "Poodle" },
      customers: { full_name: "Nguyen Van Minh", phone: "0901000001" },
    },
  },
  {
    id: 501,
    pet_id: 801,
    doctor_id: doctorId,
    doctor_schedule_slot_id: 901,
    appointment_type: "VACCINE",
    status: "CONFIRMED",
    note: "",
    requested_date: "2099-07-20",
    requested_time: "08:30:00",
    created_at: "2026-06-20T07:00:00.000Z",
    doctors: { room_name: "Room 2" },
    doctor_schedule_slots: {
      slot_date: "2099-07-20",
      start_time: "08:30:00",
      end_time: "09:00:00",
      schedule: { room_name: "Room 2" },
    },
    pets: {
      id: 801,
      name: "Bong",
      img_url: null,
      species: { name: "Cat" },
      breed: { name: "British Shorthair" },
      customers: { full_name: "Tran Thi Lan", phone: "0902000002" },
    },
  },
];

const doctorExamRecord = {
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
      medicineName: "Amoxicillin",
      dosage: "50mg",
      frequency: "BID",
      durationDays: 5,
      instructions: "After meal",
    },
  ],
  nextVisitDate: null,
  nextVisitTime: "",
};

const prismaExamAppointment = {
  id: 502,
  doctorId,
  doctorScheduleSlotId: 902,
  petId: 802,
  status: "IN_PROGRESS",
  requestedDate: new Date("2099-07-20T00:00:00.000Z"),
  requestedTime: new Date("1970-01-01T09:00:00.000Z"),
  pet: {
    id: 802,
    name: "Milo",
    customer: { id: 702, userId: 602 },
  },
  appointmentServices: [
    {
      id: 1002,
      serviceId: 402,
      quantity: 1,
      unitPrice: 250000,
      service: { id: 402, name: "General exam", type: "MEDICAL", price: 250000 },
    },
  ],
};

module.exports = {
  doctorAppointmentRows,
  doctorExamRecord,
  doctorId,
  prismaExamAppointment,
};
