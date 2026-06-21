const { supabase } = require("../../lib/supabaseClient");
const { getStoredSetting, saveStoredSetting } = require("../users/settings.service");
const REQUEST_PREFIX = "[CUSTOMER_REQUEST]";
const MOJIBAKE_PATTERN = /\u00c3|\u00c4|\u00c6|\u00c2|\u00e1\u00ba|\u00e1\u00bb|\u00e2\u20ac|\u00f0\u0178|\ufffd/;
const CP1252_REVERSE = {
  "\u20ac": 0x80, "\u201a": 0x82, "\u0192": 0x83, "\u201e": 0x84, "\u2026": 0x85, "\u2020": 0x86, "\u2021": 0x87,
  "\u02c6": 0x88, "\u2030": 0x89, "\u0160": 0x8A, "\u2039": 0x8B, "\u0152": 0x8C, "\u017d": 0x8E,
  "\u2018": 0x91, "\u2019": 0x92, "\u201c": 0x93, "\u201d": 0x94, "\u2022": 0x95, "\u2013": 0x96, "\u2014": 0x97,
  "\u02dc": 0x98, "\u2122": 0x99, "\u0161": 0x9A, "\u203a": 0x9B, "\u0153": 0x9C, "\u017e": 0x9E, "\u0178": 0x9F,
};

function decodeWindows1252AsUtf8(text) {
  const bytes = [];
  for (const char of String(text)) {
    const code = char.codePointAt(0);
    if (code <= 0xff) {
      bytes.push(code);
      continue;
    }
    const mapped = CP1252_REVERSE[char];
    if (mapped == null) return text;
    bytes.push(mapped);
  }
  return Buffer.from(bytes).toString("utf8");
}

function decodeMojibakeToken(value) {
  let text = String(value ?? "");
  for (let i = 0; i < 3 && MOJIBAKE_PATTERN.test(text); i += 1) {
    const decoded = decodeWindows1252AsUtf8(text);
    if (!decoded || decoded === text) break;
    text = decoded;
  }
  return text;
}

function normalizeText(value) {
  const text = String(value ?? "");
  if (!MOJIBAKE_PATTERN.test(text)) return text;

  const decoded = decodeMojibakeToken(text);
  if (decoded !== text && !MOJIBAKE_PATTERN.test(decoded)) return decoded;

  return text
    .split(/(\s+)/)
    .map((part) => (MOJIBAKE_PATTERN.test(part) ? decodeMojibakeToken(part) : part))
    .join("");
}

function isFollowUpSystemNote(value) {
  const text = normalizeText(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll(String.fromCharCode(273), "d")
    .replaceAll(String.fromCharCode(272), "d");
  return text.startsWith("tai kham tu lich");
}
function getAppointmentDisplayNote(value) {
  const note = cleanAppointmentNote(value);
  return isFollowUpSystemNote(note) ? "" : note;
}

function getAppointmentChiefComplaint({ clinicalExam, appointmentNote, symptoms }) {
  const chiefComplaint = String(clinicalExam?.chiefComplaint || "").trim();
  if (chiefComplaint) return chiefComplaint;
  if (symptoms) return String(symptoms).trim();
  if (isFollowUpSystemNote(appointmentNote)) return "Tái khám";
  return appointmentNote || "Chưa ghi nhận";
}
function cleanAppointmentNote(value) {
  const text = normalizeText(value).trim();
  if (!text) return "";

  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith(REQUEST_PREFIX))
    .filter((line) => !(line.startsWith("{") && line.endsWith("}")))
    .join("\n")
    .trim();
}

function normalizeTextDeep(value) {
  if (typeof value === "string") return normalizeText(value);
  if (Array.isArray(value)) return value.map(normalizeTextDeep);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, normalizeTextDeep(item)]),
  );
}

const SERVICE_TYPE_LABELS = {
  MEDICAL: "Khám bệnh",
  GROOMING: "Grooming",
  BOARDING: "Lưu trú",
  VACCINE: "Tiêm phòng",
  FOOD: "Thức ăn",
  OTHER: "Khác",
  MIXED: "Khám & Dịch vụ",
};

const SPECIES_COLORS = ["#06B6D4", "#6366F1", "#10B981", "#F59E0B", "#94A3B8"];

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateShort(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN");
}

function formatTime(value) {
  if (!value) return "--:--";
  return String(value).slice(0, 5);
}

function getInitials(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getAppointmentDate(appointment) {
  return appointment.requested_date || appointment.doctor_schedule_slots?.slot_date || appointment.created_at;
}

function splitSymptoms(symptoms) {
  if (!symptoms) return [];
  return String(symptoms)
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
function parseClinicalExam(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function summarizeClinicalExam(clinicalExam, fallback = "") {
  return [
    clinicalExam.clinicalNote,
    clinicalExam.ownerNotes ? `Ghi chú chủ nuôi: ${clinicalExam.ownerNotes}` : "",
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join("\n") || fallback;
}
function systemLabel(systemId) {
  const labels = {
    general: "Tổng thể",
    skin: "Da & lông",
    eyes_ears: "Mắt & tai",
    lymph: "Hạch bạch huyết",
    cardiac: "Tim mạch",
    respiratory: "Hô hấp",
    gastro: "Tiêu hoá",
    musculo: "Cơ xương khớp",
    neuro: "Thần kinh",
  };
  return labels[systemId] || systemId;
}
function yearsBetween(value) {
  if (!value) return null;
  const dob = new Date(value);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const monthDelta = now.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) years -= 1;
  return years >= 0 ? years : null;
}

function buildSystemResults(clinicalExam, diseaseRows) {
  const rows = [];

  Object.entries(clinicalExam.systems || {}).forEach(([systemId, entry]) => {
    rows.push({
      system: systemLabel(systemId),
      status: entry?.status === "abnormal" ? "abnormal" : "normal",
      note: String(entry?.notes || "").trim(),
    });
  });

  if (rows.length === 0 && summarizeClinicalExam(clinicalExam)) {
    rows.push({
      system: "Khám lâm sàng",
      status: "abnormal",
      note: summarizeClinicalExam(clinicalExam),
    });
  }

  diseaseRows.forEach((row) => {
    rows.push({
      system: row.disease?.name || "Bệnh lý",
      status: "abnormal",
      note: row.note || row.disease?.symptoms || "",
    });
  });

  if (rows.length === 0) {
    rows.push({ system: "Tổng thể", status: "normal" });
  }

  return rows;
}
function examDurationLabel(value) {
  const labels = {
    "<1d": "Dưới 1 ngày",
    "1-3d": "1-3 ngày",
    "3-7d": "3-7 ngày",
    "1-2w": "1-2 tuần",
    ">2w": "Hơn 2 tuần",
  };
  return labels[value] || value || "Chưa cập nhật";
}

function examOnsetLabel(value) {
  const labels = {
    sudden: "Đột ngột",
    gradual: "Từ từ",
  };
  return labels[value] || value || "Chưa cập nhật";
}
function serviceColor(type) {
  if (type === "VACCINE") return "bg-emerald-100 text-emerald-700";
  if (type === "GROOMING") return "bg-amber-100 text-amber-700";
  if (type === "BOARDING") return "bg-violet-100 text-violet-700";
  return "bg-cyan-100 text-cyan-700";
}

function genderLabel(value) {
  if (value === "MALE") return "Đực";
  if (value === "FEMALE") return "Cái";
  return "Chưa rõ";
}

function isVaccinationValid(nextDueDate) {
  if (!nextDueDate) return true;
  const due = new Date(nextDueDate);
  return Number.isNaN(due.getTime()) ? true : due >= new Date();
}

function durationText(days) {
  if (!Number.isFinite(days) || days <= 0) return "";
  return `${days} ngày`;
}

function filterDoctorRecords(records, filters = {}) {
  const search = String(filters.search || "").trim().toLowerCase();
  const speciesAliases = {
    "Chó": "Chó",
    "Mèo": "Mèo",
  };
  const rawSpecies = String(filters.species || "all");
  const species = speciesAliases[rawSpecies] || rawSpecies;

  return records.filter((record) => {
    const matchesSearch = !search
      || record.pet.toLowerCase().includes(search)
      || record.owner.toLowerCase().includes(search)
      || record.diagnosis.toLowerCase().includes(search)
      || record.id.toLowerCase().includes(search);
    const matchesSpecies = species === "all" || !species || record.species === species;

    return matchesSearch && matchesSpecies;
  });
}

async function listDoctorRecords(doctorId, filters = {}) {
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(`
      id,
      pet_id,
      doctor_id,
      appointment_type,
      status,
      note,
      requested_date,
      created_at,
      pets:pet_id (
        id,
        name,
        gender,
        dob,
        weight,
        img_url,
        allergies,
        species:species_id (name),
        breed:breed_id (name),
        customers:customer_id (full_name, phone)
      ),
      doctor:doctor_id (full_name, specialization)
    `)
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const appointmentRows = appointments || [];
  const appointmentIds = appointmentRows.map((row) => row.id);

  if (appointmentIds.length === 0) return [];

  const medicalVisitsResult = await supabase
    .from("medical_visits")
    .select("id, appointment_id, symptoms, clinical_exam, diagnosis_note, next_visit_date, created_at")
    .in("appointment_id", appointmentIds);

  if (medicalVisitsResult.error) throw new Error(medicalVisitsResult.error.message);

  const medicalVisits = medicalVisitsResult.data || [];
  const medicalVisitIds = medicalVisits.map((visit) => visit.id);

  const [diseaseResult, prescriptionsResult] = await Promise.all([
    medicalVisitIds.length
      ? supabase
          .from("medical_visit_diseases")
          .select("medical_visit_id, note, disease:diseases(name, symptoms)")
          .in("medical_visit_id", medicalVisitIds)
      : Promise.resolve({ data: [], error: null }),
    medicalVisitIds.length
      ? supabase
          .from("prescriptions")
          .select("id, medical_visit_id, notes")
          .in("medical_visit_id", medicalVisitIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (diseaseResult.error) throw new Error(diseaseResult.error.message);
  if (prescriptionsResult.error) throw new Error(prescriptionsResult.error.message);

  const prescriptionIds = (prescriptionsResult.data || []).map((row) => row.id);
  const prescriptionItemsResult = prescriptionIds.length
    ? await supabase
        .from("prescription_items")
        .select("prescription_id, medicine_name, dosage, frequency, duration_days, instructions")
        .in("prescription_id", prescriptionIds)
    : { data: [], error: null };

  if (prescriptionItemsResult.error) throw new Error(prescriptionItemsResult.error.message);

  const servicesResult = await supabase
    .from("appointment_services")
    .select("appointment_id, service:services(name, type)")
    .in("appointment_id", appointmentIds);

  if (servicesResult.error) throw new Error(servicesResult.error.message);

  const visitsByAppointmentId = new Map(medicalVisits.map((row) => [row.appointment_id, row]));
  const diseasesByVisitId = new Map();
  (diseaseResult.data || []).forEach((row) => {
    const current = diseasesByVisitId.get(row.medical_visit_id) || [];
    current.push(row);
    diseasesByVisitId.set(row.medical_visit_id, current);
  });

  const prescriptionsByVisitId = new Map();
  (prescriptionsResult.data || []).forEach((row) => {
    const current = prescriptionsByVisitId.get(row.medical_visit_id) || [];
    current.push(row);
    prescriptionsByVisitId.set(row.medical_visit_id, current);
  });

  const itemsByPrescriptionId = new Map();
  (prescriptionItemsResult.data || []).forEach((row) => {
    const current = itemsByPrescriptionId.get(row.prescription_id) || [];
    current.push(row);
    itemsByPrescriptionId.set(row.prescription_id, current);
  });

  const servicesByAppointmentId = new Map();
  (servicesResult.data || []).forEach((row) => {
    const current = servicesByAppointmentId.get(row.appointment_id) || [];
    current.push(row.service);
    servicesByAppointmentId.set(row.appointment_id, current);
  });

  const records = appointmentRows.map((appointment) => {
    const visit = visitsByAppointmentId.get(appointment.id);
    const diseases = visit ? diseasesByVisitId.get(visit.id) || [] : [];
    const prescriptions = visit ? prescriptionsByVisitId.get(visit.id) || [] : [];
    const services = servicesByAppointmentId.get(appointment.id) || [];
    const primaryService = services[0];
    const date = getAppointmentDate(appointment);
    const pet = appointment.pets || {};
    const age = yearsBetween(pet.dob);
    const clinicalExam = parseClinicalExam(visit?.clinical_exam);
    const appointmentNote = cleanAppointmentNote(appointment.note);
    const appointmentDisplayNote = getAppointmentDisplayNote(appointment.note);
    const selectedSymptoms = Array.isArray(clinicalExam.selectedSymptoms) && clinicalExam.selectedSymptoms.length > 0
      ? clinicalExam.selectedSymptoms
      : splitSymptoms(visit?.symptoms);
    const clinicalSummary = summarizeClinicalExam(
      clinicalExam,
      visit?.diagnosis_note || appointmentDisplayNote || "",
    );

    return {
      id: visit ? `MR-${String(visit.id).padStart(6, "0")}` : `APT-${String(appointment.id).padStart(6, "0")}`,
      appointmentId: appointment.id,
      petId: appointment.pet_id,
      date: formatDate(date),
      dateShort: formatDateShort(date),
      pet: pet.name || "Thú cưng",
      petImage: pet.img_url || null,
      species: pet.species?.name || "Khác",
      breed: pet.breed?.name || "Chưa cập nhật",
      owner: pet.customers?.full_name || "Chưa cập nhật",
      phone: pet.customers?.phone || "",
      sex: pet.gender === "MALE" ? "Đực" : pet.gender === "FEMALE" ? "Cái" : "Chưa rõ",
      age: age === null ? "Chưa cập nhật" : `${age} tuổi`,
      weight: pet.weight ? `${pet.weight} kg` : "Chưa cập nhật",
      doctor: appointment.doctor?.full_name || "Bác sĩ",
      service: primaryService?.name || SERVICE_TYPE_LABELS[appointment.appointment_type] || appointment.appointment_type,
      serviceColor: serviceColor(primaryService?.type || appointment.appointment_type),
      chiefComplaint: getAppointmentChiefComplaint({ clinicalExam, appointmentNote, symptoms: visit?.symptoms }),
      symptoms: selectedSymptoms,
      duration: examDurationLabel(clinicalExam.duration),
      onset: examOnsetLabel(clinicalExam.onset),
      severity: Number(clinicalExam.severity || 0),
      vitals: {
        temp: clinicalExam.vitals?.temp || "",
        heart: clinicalExam.vitals?.heart || "",
        resp: clinicalExam.vitals?.resp || "",
        spo2: clinicalExam.vitals?.spo2 || "",
        weight: clinicalExam.vitals?.weight || (pet.weight ? String(pet.weight) : ""),
      },
      sysResults: buildSystemResults(clinicalExam, diseases),
      diagnosis: visit?.diagnosis_note || "Chưa có chẩn đoán",
      diagnosisCode: "",
      clinicalNote: clinicalSummary,
      prescriptions: prescriptions.flatMap((prescription) =>
        (itemsByPrescriptionId.get(prescription.id) || []).map((item) => ({
          drug: item.medicine_name,
          dose: item.dosage,
          route: item.instructions || "",
          frequency: item.frequency,
          duration: item.duration_days ? `${item.duration_days} ngày` : "",
        })),
      ),
      followUp: visit?.next_visit_date ? "Tái khám theo lịch hẹn" : "Chưa có lịch tái khám",
      followUpDate: formatDateShort(visit?.next_visit_date),
      allergy: pet.allergies || "Không ghi nhận",
    };
  });

  return filterDoctorRecords(normalizeTextDeep(records), filters);
}

function periodStart(period, anchorDate = new Date()) {
  const start = new Date(anchorDate);
  start.setHours(0, 0, 0, 0);

  if (period === "day") {
    return start;
  }

  if (period === "week") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    return start;
  }

  if (period === "quarter") {
    start.setMonth(start.getMonth() - 2, 1);
    return start;
  }

  start.setDate(1);
  return start;
}

function getValidAppointmentDate(appointment) {
  const date = new Date(getAppointmentDate(appointment));
  return Number.isNaN(date.getTime()) ? null : date;
}

function latestAppointmentDate(appointments) {
  return appointments.reduce((latest, appointment) => {
    const date = getValidAppointmentDate(appointment);
    if (!date) return latest;
    return !latest || date > latest ? date : latest;
  }, null);
}

function bucketLabel(date, period) {
  if (period === "quarter") return `T${date.getMonth() + 1}`;
  if (period === "month") return `${date.getDate()}/${date.getMonth() + 1}`;
  if (period === "day") return formatDateShort(date).slice(0, 5);
  const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return labels[date.getDay()];
}

function buildStatsForPeriod(period, appointments, reviews) {
  let start = periodStart(period);
  let rows = appointments.filter((appointment) => {
    const date = getValidAppointmentDate(appointment);
    return date && date >= start;
  });

  if (rows.length === 0 && appointments.length > 0) {
    const latest = latestAppointmentDate(appointments);
    if (latest) {
      start = periodStart(period, latest);
      rows = appointments.filter((appointment) => {
        const date = getValidAppointmentDate(appointment);
        return date && date >= start && date <= latest;
      });
    }
  }

  rows.sort((a, b) => {
    const dateA = getValidAppointmentDate(a)?.getTime() || 0;
    const dateB = getValidAppointmentDate(b)?.getTime() || 0;
    return dateB - dateA;
  });

  const total = rows.length;
  const completed = rows.filter((row) => row.status === "COMPLETED").length;
  const uniquePets = new Set(rows.map((row) => row.pet_id).filter(Boolean)).size;

  const buckets = new Map();
  rows.forEach((appointment) => {
    const date = new Date(getAppointmentDate(appointment));
    const label = bucketLabel(date, period);
    const current = buckets.get(label) || { label, total: 0, completed: 0 };
    current.total += 1;
    if (appointment.status === "COMPLETED") current.completed += 1;
    buckets.set(label, current);
  });

  const speciesCounts = new Map();
  rows.forEach((appointment) => {
    const species = appointment.pets?.species?.name || "Khác";
    speciesCounts.set(species, (speciesCounts.get(species) || 0) + 1);
  });

  const serviceCounts = new Map();
  rows.forEach((appointment) => {
    const service = appointment.appointment_services?.[0]?.service?.name
      || SERVICE_TYPE_LABELS[appointment.appointment_type]
      || appointment.appointment_type;
    serviceCounts.set(service, (serviceCounts.get(service) || 0) + 1);
  });

  const recentPatients = rows.slice(0, 5).map((appointment) => {
    const review = reviews.find((row) => row.appointment_id === appointment.id);
    return {
      name: appointment.pets?.name || "Thú cưng",
      species: appointment.pets?.species?.name || "Khác",
      diagnosis: appointment.medical_visits?.[0]?.diagnosis_note || cleanAppointmentNote(appointment.note) || "Khám thú y",
      date: formatDateShort(getAppointmentDate(appointment)).slice(0, 5),
      rating: review?.rating || 0,
    };
  });

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const avgRating = reviews.length
    ? Number((reviews.reduce((sum, row) => sum + Number(row.rating || 0), 0) / reviews.length).toFixed(1))
    : 0;

  const kpis = {
    total,
    completed,
    newPatients: uniquePets,
    averageMinutes: 0,
    completionRate,
  };

  const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const weekdayCounts = new Array(7).fill(0);
  rows.forEach((appointment) => {
    const date = getValidAppointmentDate(appointment);
    if (date) weekdayCounts[date.getDay()] += 1;
  });
  const byDay = WEEKDAY_LABELS.map((label, index) => ({ label, value: weekdayCounts[index] }));

  return {
    kpis: {
      ...kpis,
    },
    kpiCards: [
      { key: "total", label: "Ca khám", sub: "theo kỳ", value: kpis.total, icon: "Calendar", bg: "bg-cyan-50", color: "text-cyan-600" },
      { key: "completed", label: "Hoàn thành", sub: "ca đã xong", value: kpis.completed, icon: "CheckCircle2", bg: "bg-emerald-50", color: "text-emerald-600" },
      { key: "newPatients", label: "Bệnh nhân", sub: "thú cưng duy nhất", value: kpis.newPatients, icon: "Users", bg: "bg-violet-50", color: "text-violet-600" },
      { key: "completionRate", label: "Tỷ lệ hoàn thành", sub: "trong kỳ", value: kpis.completionRate, icon: "Clock", bg: "bg-amber-50", color: "text-amber-600", unit: "%" },
    ],
    trend: [...buckets.values()],
    byDay,
    speciesPie: [...speciesCounts.entries()].map(([name, count], index) => ({
      name,
      value: total > 0 ? Math.round((count / total) * 100) : 0,
      color: SPECIES_COLORS[index % SPECIES_COLORS.length],
    })),
    topServices: [...serviceCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], index, list) => ({
        name,
        count,
        pct: list[0]?.[1] ? Math.round((count / list[0][1]) * 100) : 0,
      })),
    recentPatients,
    averageRating: avgRating,
  };
}

async function getDoctorStats(doctorId) {
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(`
      id,
      pet_id,
      doctor_id,
      appointment_type,
      status,
      note,
      requested_date,
      created_at,
      doctor_schedule_slots:doctor_schedule_slots!appointments_doctor_schedule_slot_id_fkey (slot_date),
      pets:pet_id (name, species:species_id (name)),
      appointment_services:appointment_services (service:services(name, type)),
      medical_visits:medical_visits (diagnosis_note)
    `)
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const appointmentRows = appointments || [];
  const appointmentIds = appointmentRows.map((row) => row.id);
  const reviewsResult = appointmentIds.length
    ? await supabase
        .from("reviews")
        .select("appointment_id, rating")
        .in("appointment_id", appointmentIds)
    : { data: [], error: null };

  if (reviewsResult.error) throw new Error(reviewsResult.error.message);

  return normalizeTextDeep({
    month: buildStatsForPeriod("month", appointmentRows, reviewsResult.data || []),
    week: buildStatsForPeriod("week", appointmentRows, reviewsResult.data || []),
    day: buildStatsForPeriod("day", appointmentRows, reviewsResult.data || []),
    quarter: buildStatsForPeriod("quarter", appointmentRows, reviewsResult.data || []),
  });
}

function weekdayLabel(day) {
  const labels = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  return labels[day] || "Thứ 2";
}

function scheduleTimeToMinutes(value) {
  const [hour, minute] = String(value || "00:00").split(":").map(Number);
  return hour * 60 + minute;
}

function groupScheduleSlots(schedules, doctor) {
  const sorted = [...(schedules || [])].sort((a, b) => {
    const dateCompare = String(a.work_date || "").localeCompare(String(b.work_date || ""));
    if (dateCompare !== 0) return dateCompare;
    return scheduleTimeToMinutes(a.start_time) - scheduleTimeToMinutes(b.start_time);
  });

  const groups = [];
  for (const row of sorted) {
    const latest = groups[groups.length - 1];
    const sameWindow = latest
      && latest.work_date === row.work_date
      && latest.room_name === row.room_name
      && formatTime(latest.end_time) === formatTime(row.start_time);

    if (sameWindow) {
      latest.end_time = row.end_time;
      latest.slotCount += row.slots?.length || 0;
      continue;
    }

    groups.push({ ...row, slotCount: row.slots?.length || 0 });
  }

  return groups.map((row) => {
    const date = row.work_date ? new Date(row.work_date) : null;
    const dayIndex = date && !Number.isNaN(date.getTime()) ? date.getDay() : 1;

    return {
      id: row.id,
      day: weekdayLabel(dayIndex),
      dayIndex,
      date: formatDateShort(row.work_date),
      rawDate: row.work_date || "",
      on: true,
      from: formatTime(row.start_time),
      to: formatTime(row.end_time),
      roomName: row.room_name || doctor.room_name || "Phòng 1",
      slotCount: row.slotCount,
    };
  });
}


function parseDeviceFromUserAgent(ua) {
  if (!ua) return "Thiết bị hiện tại";
  const s = String(ua);
  if (/Mobile|Android|iPhone|iPad/i.test(s)) return "Thiết bị di động";
  if (/Edg\//i.test(s)) return "Microsoft Edge";
  if (/Firefox\//i.test(s)) return "Firefox";
  if (/OPR\/|Opera/i.test(s)) return "Opera";
  if (/Chrome\//i.test(s)) return "Chrome";
  if (/Safari\//i.test(s)) return "Safari";
  return "Trình duyệt web";
}

async function getDoctorSettings(doctorId, userAgent) {
  const [{ data: doctor, error: doctorError }, { data: schedules, error: scheduleError }] = await Promise.all([
    supabase
      .from("doctors")
      .select(`
        id,
        full_name,
        specialization,
        degree,
        experience_years,
        room_name,
        user:user_id (email)
      `)
      .eq("id", doctorId)
      .single(),
    supabase
      .from("doctor_schedules")
      .select("id, work_date, start_time, end_time, room_name, slots:doctor_schedule_slots!doctor_schedule_slots_doctor_schedule_id_fkey(id)")
      .eq("doctor_id", doctorId)
      .order("work_date", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  if (doctorError || !doctor) throw new Error("Không tìm thấy hồ sơ bác sĩ");
  if (scheduleError) throw new Error(scheduleError.message);

  const scheduleRows = groupScheduleSlots(schedules, doctor);

  const defaults = {
    profile: {
      id: doctor.id,
      name: doctor.full_name || "",
      email: doctor.user?.email || "",
      phone: "",
      specialty: doctor.specialization || "Nội khoa",
      room: doctor.room_name || "Phòng 1",
      bio: doctor.degree || "",
      license: doctor.degree || "",
      initials: getInitials(doctor.full_name),
      statusLabel: "Đang làm việc",
    },
    schedule: {
      rows: scheduleRows,
      options: {
        maxAppointments: "12",
        slotDuration: "30",
        breakFrom: "12:00",
        breakTo: "13:30",
      },
    },
    notifications: {
      aptEmail: true,
      aptSms: false,
      aptPush: true,
      remEmail: true,
      remSms: true,
      remPush: true,
      sysEmail: false,
      sysSms: false,
      sysPush: true,
      reportEmail: true,
    },
    security: {
      twoFa: false,
      sessions: [
        { device: parseDeviceFromUserAgent(userAgent), location: "Thiết bị hiện tại", time: "Hiện tại", current: true },
      ],
    },
  };
  const key = `doctor.settings.${doctorId}`;
  const stored = await getStoredSetting(key);
  if (!stored) {
    await saveStoredSetting(key, {
      schedule: { options: defaults.schedule.options },
      notifications: defaults.notifications,
      security: { twoFa: defaults.security.twoFa },
    });
    return normalizeTextDeep(defaults);
  }
  return normalizeTextDeep({
    ...defaults,
    schedule: {
      ...defaults.schedule,
      options: { ...defaults.schedule.options, ...stored.schedule?.options },
    },
    notifications: { ...defaults.notifications, ...stored.notifications },
    security: { ...defaults.security, ...stored.security, sessions: defaults.security.sessions },
  });
}

async function getDoctorExamContext(doctorId, appointmentId) {
  const numericAppointmentId = Number(appointmentId);
  if (!Number.isFinite(numericAppointmentId)) {
    throw new Error("Mã lịch hẹn không hợp lệ");
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select(`
      id,
      pet_id,
      doctor_id,
      appointment_type,
      status,
      note,
      requested_date,
      requested_time,
      created_at,
      pets:pet_id (
        id,
        name,
        gender,
        dob,
        weight,
        img_url,
        allergies,
        species:species_id (name),
        breed:breed_id (name),
        customers:customer_id (full_name, phone)
      ),
      appointment_services:appointment_services (service:services(name, type))
    `)
    .eq("id", numericAppointmentId)
    .eq("doctor_id", doctorId)
    .single();

  if (error || !appointment) {
    throw new Error("Không tìm thấy lịch hẹn hoặc bạn không có quyền truy cập");
  }

  const pet = appointment.pets || {};
  const petId = appointment.pet_id;
  const age = yearsBetween(pet.dob);
  const primaryService = appointment.appointment_services?.[0]?.service;

  const [vaccinationsResult, historyResult] = await Promise.all([
    supabase
      .from("vaccinations")
      .select("id, vaccine_name, date_given, next_due_date, note")
      .eq("pet_id", petId)
      .order("date_given", { ascending: false }),
    supabase
      .from("appointments")
      .select(`
        id,
        doctor_id,
        appointment_type,
        note,
        requested_date,
        created_at,
        doctor:doctor_id (full_name),
        medical_visits:medical_visits (diagnosis_note)
      `)
      .eq("pet_id", petId)
      .neq("id", numericAppointmentId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (vaccinationsResult.error) throw new Error(vaccinationsResult.error.message);
  if (historyResult.error) throw new Error(historyResult.error.message);

  return normalizeTextDeep({
    appointment: {
      id: appointment.id,
      code: `APT-${String(appointment.id).padStart(5, "0")}`,
      status: appointment.status,
      service: primaryService?.name || SERVICE_TYPE_LABELS[appointment.appointment_type] || appointment.appointment_type,
      serviceType: primaryService?.type || appointment.appointment_type,
      note: cleanAppointmentNote(appointment.note) || "",
      date: formatDateShort(appointment.requested_date || appointment.created_at),
      time: appointment.requested_time || "",
    },
    pet: {
      id: pet.id,
      name: pet.name || "Thú cưng",
      image: pet.img_url || null,
      species: pet.species?.name || "Khác",
      breed: pet.breed?.name || "Chưa cập nhật",
      sex: genderLabel(pet.gender),
      age: age === null ? "Chưa cập nhật" : `${age} tuổi`,
      weight: pet.weight ? `${pet.weight} kg` : "Chưa cập nhật",
      allergies: pet.allergies || "Không ghi nhận",
      owner: pet.customers?.full_name || "Chưa cập nhật",
      ownerPhone: pet.customers?.phone || "Chưa cập nhật",
    },
    vaccinations: (vaccinationsResult.data || []).map((row) => ({
      id: row.id,
      name: row.vaccine_name,
      date: formatDateShort(row.date_given),
      due: formatDateShort(row.next_due_date),
      ok: isVaccinationValid(row.next_due_date),
      note: cleanAppointmentNote(row.note) || "",
    })),
    visitHistory: (historyResult.data || []).map((row) => ({
      id: row.id,
      date: formatDateShort(row.requested_date || row.created_at),
      reason: row.medical_visits?.[0]?.diagnosis_note
        || cleanAppointmentNote(row.note)
        || SERVICE_TYPE_LABELS[row.appointment_type]
        || "Khám thú y",
      doctor: row.doctor?.full_name || "Chưa phân công",
    })),
    initialForm: {
      chiefComplaint: isFollowUpSystemNote(appointment.note) ? "Tái khám" : cleanAppointmentNote(appointment.note) || "",
      ownerNotes: getAppointmentDisplayNote(appointment.note) || "",
      vitals: {
        temp: "",
        heart: "",
        resp: "",
        spo2: "",
        weight: pet.weight ? String(pet.weight) : "",
      },
    },
  });
}

async function saveDoctorSettings(doctorId, patch) {
  const key = `doctor.settings.${doctorId}`;
  const current = (await getStoredSetting(key)) || {};
  const updated = {
    schedule: current.schedule || {},
    notifications: current.notifications || {},
    security: current.security || {},
    ...current,
  };
  if (patch.notifications !== undefined) {
    updated.notifications = { ...updated.notifications, ...patch.notifications };
  }
  if (patch.security !== undefined) {
    updated.security = { ...updated.security, twoFa: Boolean(patch.security.twoFa) };
  }
  await saveStoredSetting(key, updated);
}

module.exports = {
  getDoctorExamContext,
  getDoctorSettings,
  getDoctorStats,
  listDoctorRecords,
  saveDoctorSettings,
};
