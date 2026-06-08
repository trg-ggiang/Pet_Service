const { supabase } = require("../../lib/supabaseClient");

function assertCustomerId(customerId) {
  const effectiveCustomerId = Number(customerId);
  if (!Number.isFinite(effectiveCustomerId)) {
    const error = new Error("Missing customer id");
    error.statusCode = 401;
    throw error;
  }
  return effectiveCustomerId;
}

function formatDate(value) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Chưa có" : date.toLocaleDateString("vi-VN");
}

function formatCurrency(amount) {
  const value = amount == null ? 0 : Number(amount);
  return `${new Intl.NumberFormat("vi-VN").format(value)}₫`;
}

function getHistoryType(invoice, details) {
  const sourceTypes = new Set((invoice.items ?? []).map((item) => item.source_type));

  if (sourceTypes.has("BOARDING") || details.boardingByAppointmentId.has(invoice.appointment_id)) return "boarding";
  if (sourceTypes.has("GROOMING") || details.groomingByAppointmentId.has(invoice.appointment_id)) return "grooming";
  if (sourceTypes.has("VACCINATION") || details.vaccinationsByAppointmentId.has(invoice.appointment_id)) return "vaccine";
  return "medical";
}

function getHistoryDetails(invoice, details) {
  const appointmentId = invoice.appointment_id;
  const medicalVisit = details.medicalVisitsByAppointmentId.get(appointmentId);
  if (medicalVisit?.diagnosis_note) return medicalVisit.diagnosis_note;

  const vaccination = details.vaccinationsByAppointmentId.get(appointmentId);
  if (vaccination?.note) return vaccination.note;

  const grooming = details.groomingByAppointmentId.get(appointmentId);
  if (grooming?.notes) return grooming.notes;

  const boarding = details.boardingByAppointmentId.get(appointmentId);
  return boarding?.special_note ?? boarding?.habit_note ?? "";
}

function getServiceNames(invoice, appointment) {
  const itemDescriptions = (invoice.items ?? [])
    .map((item) => item.description)
    .filter(Boolean);

  if (itemDescriptions.length > 0) return itemDescriptions;
  return [appointment?.appointment_type ?? "Dịch vụ"];
}

async function loadDetails(appointmentIds, invoiceIds) {
  const [itemsResult, medicalResult, vaccinationResult, groomingResult, boardingResult] = await Promise.all([
    invoiceIds.length
      ? supabase
          .from("invoice_items")
          .select("id, invoice_id, source_type, description, quantity, unit_price, total_price")
          .in("invoice_id", invoiceIds)
          .order("id", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    appointmentIds.length
      ? supabase
          .from("medical_visits")
          .select("id, appointment_id, diagnosis_note")
          .in("appointment_id", appointmentIds)
      : Promise.resolve({ data: [], error: null }),
    appointmentIds.length
      ? supabase
          .from("vaccinations")
          .select("id, appointment_id, vaccine_name, note")
          .in("appointment_id", appointmentIds)
      : Promise.resolve({ data: [], error: null }),
    appointmentIds.length
      ? supabase
          .from("grooming_records")
          .select("id, appointment_id, notes")
          .in("appointment_id", appointmentIds)
      : Promise.resolve({ data: [], error: null }),
    appointmentIds.length
      ? supabase
          .from("boarding")
          .select("id, appointment_id, habit_note, special_note")
          .in("appointment_id", appointmentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const result of [itemsResult, medicalResult, vaccinationResult, groomingResult, boardingResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  const medicalVisitIds = (medicalResult.data ?? []).map((visit) => visit.id);
  const prescriptionResult = medicalVisitIds.length
    ? await supabase
        .from("prescriptions")
        .select(`
          id,
          medical_visit_id,
          items:prescription_items!prescription_items_prescription_id_fkey (
            id,
            medicine_name,
            dosage,
            frequency,
            duration_days,
            instructions
          )
        `)
        .in("medical_visit_id", medicalVisitIds)
    : { data: [], error: null };

  if (prescriptionResult.error) throw new Error(prescriptionResult.error.message);

  const itemsByInvoiceId = new Map();
  (itemsResult.data ?? []).forEach((item) => {
    const current = itemsByInvoiceId.get(item.invoice_id) ?? [];
    current.push(item);
    itemsByInvoiceId.set(item.invoice_id, current);
  });

  const appointmentIdByMedicalVisitId = new Map(
    (medicalResult.data ?? []).map((visit) => [visit.id, visit.appointment_id]),
  );

  const prescriptionsByAppointmentId = new Map();
  (prescriptionResult.data ?? []).forEach((prescription) => {
    const appointmentId = appointmentIdByMedicalVisitId.get(prescription.medical_visit_id);
    (prescription.items ?? []).forEach((item) => {
      if (!appointmentId) return;
      const current = prescriptionsByAppointmentId.get(appointmentId) ?? [];
      current.push({
        medicineName: item.medicine_name || "",
        dosage: item.dosage || "",
        frequency: item.frequency || "",
        durationDays: item.duration_days,
        instructions: item.instructions || "",
      });
      prescriptionsByAppointmentId.set(appointmentId, current);
    });
  });

  return {
    itemsByInvoiceId,
    medicalVisitsByAppointmentId: new Map((medicalResult.data ?? []).map((row) => [row.appointment_id, row])),
    vaccinationsByAppointmentId: new Map((vaccinationResult.data ?? []).map((row) => [row.appointment_id, row])),
    groomingByAppointmentId: new Map((groomingResult.data ?? []).map((row) => [row.appointment_id, row])),
    boardingByAppointmentId: new Map((boardingResult.data ?? []).map((row) => [row.appointment_id, row])),
    prescriptionsByAppointmentId,
  };
}

async function listCustomerServiceHistory(customerId) {
  const effectiveCustomerId = assertCustomerId(customerId);

  const { data: pets, error: petsError } = await supabase
    .from("pets")
    .select("id, name")
    .eq("customer_id", effectiveCustomerId);

  if (petsError) throw new Error(petsError.message);

  const petIds = (pets ?? []).map((pet) => pet.id);
  if (petIds.length === 0) return [];

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("id, pet_id, appointment_type, doctor_id, staff_id, requested_date")
    .in("pet_id", petIds);

  if (appointmentsError) throw new Error(appointmentsError.message);

  const appointmentIds = (appointments ?? []).map((appointment) => appointment.id);
  if (appointmentIds.length === 0) return [];

  const doctorIds = [...new Set((appointments ?? []).map((a) => a.doctor_id).filter(Boolean))];
  const staffIds  = [...new Set((appointments ?? []).map((a) => a.staff_id).filter(Boolean))];

  const [invoicesResult, doctorsResult, staffsResult] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, appointment_id, total_amount, payment_status, transaction_code, status, created_at")
      .in("appointment_id", appointmentIds)
      .order("created_at", { ascending: false }),
    doctorIds.length
      ? supabase.from("doctors").select("id, full_name").in("id", doctorIds)
      : Promise.resolve({ data: [], error: null }),
    staffIds.length
      ? supabase.from("staffs").select("id, full_name").in("id", staffIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const invoicesError = invoicesResult.error;
  const invoices = invoicesResult.data;
  if (invoicesError) throw new Error(invoicesError.message);
  if (doctorsResult.error) throw new Error(doctorsResult.error.message);
  if (staffsResult.error) throw new Error(staffsResult.error.message);

  const doctorsById = new Map((doctorsResult.data ?? []).map((d) => [d.id, d]));
  const staffsById  = new Map((staffsResult.data ?? []).map((s) => [s.id, s]));

  const details = await loadDetails(
    appointmentIds,
    (invoices ?? []).map((invoice) => invoice.id),
  );

  const petsById = new Map((pets ?? []).map((pet) => [pet.id, pet]));
  const appointmentsById = new Map((appointments ?? []).map((appointment) => [appointment.id, appointment]));

  return (invoices ?? []).map((invoice) => {
    const appointment = appointmentsById.get(invoice.appointment_id);
    const pet = appointment ? petsById.get(appointment.pet_id) : null;
    const items = details.itemsByInvoiceId.get(invoice.id) ?? [];
    const services = getServiceNames({ ...invoice, items }, appointment);
    const prescriptions = details.prescriptionsByAppointmentId.get(invoice.appointment_id) ?? [];

    const doctor = appointment?.doctor_id ? doctorsById.get(appointment.doctor_id) : null;
    const staff  = appointment?.staff_id  ? staffsById.get(appointment.staff_id)   : null;
    const providerName = doctor?.full_name ?? staff?.full_name ?? null;

    const serviceDate = appointment?.requested_date || invoice.created_at;

    return {
      id: `INV-${String(invoice.id).padStart(6, "0")}`,
      invoiceId: invoice.id,
      sortAt: serviceDate,
      date: formatDate(serviceDate),
      service: services.length > 1 ? `${services[0]} +${services.length - 1} dịch vụ` : services[0],
      services,
      items: items.length > 0
        ? items.map((item) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: formatCurrency(item.unit_price),
            totalPrice: formatCurrency(item.total_price),
          }))
        : [{
            id: 0,
            description: services[0],
            quantity: 1,
            unitPrice: formatCurrency(invoice.total_amount),
            totalPrice: formatCurrency(invoice.total_amount),
          }],
      pet: pet?.name ?? "Thú cưng",
      cost: formatCurrency(invoice.total_amount),
      status: invoice.status === "CANCELLED" ? "cancelled" : invoice.payment_status === "PAID" ? "completed" : "pending",
      type: getHistoryType({ ...invoice, items }, details),
      staff: providerName ?? "Phòng khám",
      details: getHistoryDetails(invoice, details),
      prescriptions,
    };
  });
}

const HISTORY_TYPES = ["medical", "vaccine", "grooming", "boarding"];

function normalizeHistoryTypeFilter(type) {
  if (type === "all" || type == null || type === "") return "all";
  return HISTORY_TYPES.includes(type) ? type : "all";
}

function filterCustomerServiceHistory(history, filters = {}) {
  const type = normalizeHistoryTypeFilter(filters.type);
  if (type === "all") return history;
  return history.filter((record) => record.type === type);
}

function buildCustomerServiceHistorySummary(history, filteredHistory) {
  return {
    total: history.length,
    filtered: filteredHistory.length,
    typeCounts: [
      { type: "all", count: history.length },
      ...HISTORY_TYPES.map((type) => ({
        type,
        count: history.filter((record) => record.type === type).length,
      })),
    ],
  };
}

async function listCustomerServiceHistoryView(customerId, filters = {}) {
  const history = await listCustomerServiceHistory(customerId);
  const filteredHistory = filterCustomerServiceHistory(history, filters);

  return {
    history: filteredHistory,
    summary: buildCustomerServiceHistorySummary(history, filteredHistory),
  };
}

module.exports = {
  listCustomerServiceHistory,
  listCustomerServiceHistoryView,
};
