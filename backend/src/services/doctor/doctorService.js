const { supabase } = require("../../lib/supabaseClient");
const { getStoredSetting, saveStoredSetting } = require("../settingsService");

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
  return appointment.requested_date || appointment.doctor_schedules?.work_date || appointment.created_at;
}

function splitSymptoms(symptoms) {
  if (!symptoms) return [];
  return String(symptoms)
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
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
  if (clinicalExam) {
    rows.push({
      system: "Khám lâm sàng",
      status: "abnormal",
      note: clinicalExam,
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
    "ChÃ³": "Chó",
    "MÃ¨o": "Mèo",
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
      chiefComplaint: appointment.note || visit?.symptoms || "Chưa ghi nhận",
      symptoms: splitSymptoms(visit?.symptoms),
      duration: "Chưa cập nhật",
      onset: "Chưa cập nhật",
      severity: diseases.length > 0 ? 3 : 0,
      vitals: {
        temp: "",
        heart: "",
        resp: "",
        spo2: "",
        weight: pet.weight ? String(pet.weight) : "",
      },
      sysResults: buildSystemResults(visit?.clinical_exam, diseases),
      diagnosis: visit?.diagnosis_note || "Chưa có chẩn đoán",
      diagnosisCode: "",
      clinicalNote: visit?.clinical_exam || visit?.diagnosis_note || appointment.note || "Chưa có ghi chú lâm sàng",
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

  return filterDoctorRecords(records, filters);
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
      diagnosis: appointment.medical_visits?.[0]?.diagnosis_note || appointment.note || "Khám thú y",
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

  return {
    kpis: {
      ...kpis,
    },
    kpiCards: [
      { key: "total", label: "Ca kham", sub: "theo ky", value: kpis.total, icon: "Calendar", bg: "bg-cyan-50", color: "text-cyan-600" },
      { key: "completed", label: "Hoan thanh", sub: "ca da xong", value: kpis.completed, icon: "CheckCircle2", bg: "bg-emerald-50", color: "text-emerald-600" },
      { key: "newPatients", label: "Benh nhan", sub: "thu cung duy nhat", value: kpis.newPatients, icon: "Users", bg: "bg-violet-50", color: "text-violet-600" },
      { key: "completionRate", label: "Ty le hoan thanh", sub: "trong ky", value: kpis.completionRate, icon: "Clock", bg: "bg-amber-50", color: "text-amber-600", unit: "%" },
    ],
    trend: [...buckets.values()],
    byDay: [...buckets.values()].map((row) => ({ label: row.label, value: row.total })),
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
      doctor_schedules:doctor_schedule_id (work_date),
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

  return {
    month: buildStatsForPeriod("month", appointmentRows, reviewsResult.data || []),
    week: buildStatsForPeriod("week", appointmentRows, reviewsResult.data || []),
    day: buildStatsForPeriod("day", appointmentRows, reviewsResult.data || []),
    quarter: buildStatsForPeriod("quarter", appointmentRows, reviewsResult.data || []),
  };
}

function weekdayLabel(day) {
  const labels = ["CN", "Thá»© 2", "Thá»© 3", "Thá»© 4", "Thá»© 5", "Thá»© 6", "Thá»© 7"];
  return labels[day] || "Thá»© 2";
}

async function getDoctorSettings(doctorId) {
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
      .select("id, work_date, start_time, end_time, room_name, status")
      .eq("doctor_id", doctorId)
      .order("work_date", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  if (doctorError || !doctor) throw new Error("Không tìm thấy hồ sơ bác sĩ");
  if (scheduleError) throw new Error(scheduleError.message);

  const scheduleRows = (schedules || []).map((row) => {
    const date = row.work_date ? new Date(row.work_date) : null;
    const day = date && !Number.isNaN(date.getTime()) ? weekdayLabel(date.getDay()) : "Thứ 2";

    return {
      id: row.id,
      day,
      date: formatDateShort(row.work_date),
      on: !["OFF", "DONE"].includes(row.status),
      from: formatTime(row.start_time),
      to: formatTime(row.end_time),
      roomName: row.room_name || doctor.room_name || "Phòng 1",
      status: row.status,
    };
  });

  const defaults = {
    profile: {
      id: doctor.id,
      name: doctor.full_name || "",
      email: doctor.user?.email || "",
      phone: "",
      specialty: doctor.specialization || "Ná»™i khoa",
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
        { device: "Chrome", location: "Thiáº¿t bá»‹ hiá»‡n táº¡i", time: "Hiá»‡n táº¡i", current: true },
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
    return defaults;
  }
  return {
    ...defaults,
    schedule: {
      ...defaults.schedule,
      options: { ...defaults.schedule.options, ...stored.schedule?.options },
    },
    notifications: { ...defaults.notifications, ...stored.notifications },
    security: { ...defaults.security, ...stored.security, sessions: defaults.security.sessions },
  };
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

  return {
    appointment: {
      id: appointment.id,
      code: `APT-${String(appointment.id).padStart(5, "0")}`,
      status: appointment.status,
      service: primaryService?.name || SERVICE_TYPE_LABELS[appointment.appointment_type] || appointment.appointment_type,
      serviceType: primaryService?.type || appointment.appointment_type,
      note: appointment.note || "",
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
      note: row.note || "",
    })),
    visitHistory: (historyResult.data || []).map((row) => ({
      id: row.id,
      date: formatDateShort(row.requested_date || row.created_at),
      reason: row.medical_visits?.[0]?.diagnosis_note
        || row.note
        || SERVICE_TYPE_LABELS[row.appointment_type]
        || "Khám thú y",
      doctor: row.doctor?.full_name || "Chưa phân công",
    })),
    initialForm: {
      chiefComplaint: appointment.note || "",
      ownerNotes: appointment.note || "",
      vitals: {
        temp: "",
        heart: "",
        resp: "",
        spo2: "",
        weight: pet.weight ? String(pet.weight) : "",
      },
    },
  };
}

module.exports = {
  getDoctorExamContext,
  getDoctorSettings,
  getDoctorStats,
  listDoctorRecords,
};
