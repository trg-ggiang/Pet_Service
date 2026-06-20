const crossIds = {
  customerId: 10,
  petId: 20,
  appointmentId: 30,
  doctorId: 40,
  staffId: 50,
  serviceId: 60,
  appointmentServiceId: 70,
  medicalVisitId: 80,
  invoiceId: 90,
  invoiceItemId: 100,
  groomingId: 110,
  boardingId: 120,
  cageId: 130,
};

const medicalService = {
  id: crossIds.serviceId,
  name: "General Exam",
  type: "MEDICAL",
  price: 250000,
};

const groomingService = {
  id: crossIds.serviceId + 1,
  name: "Basic Grooming",
  type: "GROOMING",
  price: 300000,
};

const medicalAppointmentService = {
  id: crossIds.appointmentServiceId,
  serviceId: medicalService.id,
  quantity: 1,
  unitPrice: 250000,
  service: medicalService,
  services: medicalService,
};

const groomingAppointmentService = {
  id: crossIds.appointmentServiceId + 1,
  service_id: groomingService.id,
  serviceId: groomingService.id,
  quantity: 1,
  unit_price: 300000,
  unitPrice: 300000,
  services: groomingService,
};

const doctorExamRecord = {
  chiefComplaint: "Coughing",
  selectedSymptoms: ["cough"],
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
  clinicalNote: "Respiratory infection",
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

const prismaMedicalAppointment = {
  id: crossIds.appointmentId,
  doctorId: crossIds.doctorId,
  doctorScheduleSlotId: 140,
  petId: crossIds.petId,
  status: "IN_PROGRESS",
  requestedDate: new Date("2099-07-20T00:00:00.000Z"),
  requestedTime: new Date("1970-01-01T09:00:00.000Z"),
  pet: {
    id: crossIds.petId,
    name: "Milo",
    customer: { id: crossIds.customerId, userId: "u-customer-1" },
  },
  appointmentServices: [medicalAppointmentService],
};

const customerPetRow = {
  id: crossIds.petId,
  name: "Milo",
};

const customerHistoryAppointment = {
  id: crossIds.appointmentId,
  pet_id: crossIds.petId,
  appointment_type: "MEDICAL",
  doctor_id: crossIds.doctorId,
  staff_id: null,
  requested_date: "2099-07-20T09:00:00.000Z",
};

const paidMedicalInvoice = {
  id: crossIds.invoiceId,
  appointment_id: crossIds.appointmentId,
  total_amount: 250000,
  payment_status: "PAID",
  transaction_code: "TXN-MED-1",
  status: "PAID",
  created_at: "2099-07-20T10:00:00.000Z",
};

const paidMedicalInvoiceItem = {
  id: crossIds.invoiceItemId,
  invoice_id: crossIds.invoiceId,
  source_type: "MEDICAL",
  description: "General Exam",
  quantity: 1,
  unit_price: 250000,
  total_price: 250000,
};

const medicalVisitRow = {
  id: crossIds.medicalVisitId,
  appointment_id: crossIds.appointmentId,
  symptoms: "cough",
  clinical_exam: JSON.stringify({
    chiefComplaint: "Coughing",
    selectedSymptoms: ["cough"],
    vitals: { temp: "39.2", weight: "5.4" },
    systems: { respiratory: { status: "abnormal", notes: "Mild wheezing" } },
  }),
  diagnosis_note: "Respiratory infection",
  next_visit_date: null,
};

const prescriptionRow = {
  id: 150,
  medical_visit_id: crossIds.medicalVisitId,
  items: [
    {
      id: 151,
      medicine_name: "Amoxicillin",
      dosage: "50mg",
      frequency: "BID",
      duration_days: 5,
      instructions: "After meal",
    },
  ],
};

module.exports = {
  crossIds,
  customerHistoryAppointment,
  customerPetRow,
  doctorExamRecord,
  groomingAppointmentService,
  groomingService,
  medicalAppointmentService,
  medicalService,
  medicalVisitRow,
  paidMedicalInvoice,
  paidMedicalInvoiceItem,
  prescriptionRow,
  prismaMedicalAppointment,
};
