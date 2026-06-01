const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const { supabase } = require("../lib/supabaseClient");
const { listDoctorAppointmentsForPortal } = require("../services/doctor/doctorAppointmentService");

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("doctor"));

const EXAM_SYMPTOM_OPTIONS = [
  "Bỏ ăn",
  "Nôn mửa",
  "Tiêu chảy",
  "Sốt",
  "Ho",
  "Hắt hơi",
  "Ngứa da",
  "Rụng lông",
  "Mệt mỏi",
  "Đi khập khiễng",
  "Uống nhiều nước",
  "Tiểu nhiều",
  "Chảy nước mắt",
  "Sưng hạch",
  "Thở khó",
  "Đau bụng",
];

const EXAM_BODY_SYSTEMS = [
  { id: "general", label: "Tổng thể" },
  { id: "skin", label: "Da & Lông" },
  { id: "eyes_ears", label: "Mắt & Tai" },
  { id: "lymph", label: "Hạch bạch huyết" },
  { id: "cardiac", label: "Tim mạch" },
  { id: "respiratory", label: "Hô hấp" },
  { id: "gastro", label: "Tiêu hoá" },
  { id: "musculo", label: "Cơ xương khớp" },
  { id: "neuro", label: "Thần kinh" },
];

const EXAM_FORM_OPTIONS = {
  durationOptions: [
    { value: "<1d", label: "Dưới 1 ngày" },
    { value: "1-3d", label: "1–3 ngày" },
    { value: "3-7d", label: "3–7 ngày" },
    { value: "1-2w", label: "1–2 tuần" },
    { value: ">2w", label: "Hơn 2 tuần" },
  ],
  onsetOptions: [
    { value: "sudden", label: "Đột ngột" },
    { value: "gradual", label: "Từ từ" },
  ],
  severityOptions: [
    { value: "1", label: "Rất nhẹ" },
    { value: "2", label: "Nhẹ" },
    { value: "3", label: "Trung bình" },
    { value: "4", label: "Nặng" },
    { value: "5", label: "Rất nặng" },
  ],
  systemStatusOptions: [
    { value: "normal", label: "Bình thường" },
    { value: "abnormal", label: "Bất thường" },
    { value: "not_examined", label: "Chưa khám" },
  ],
};

const SERVICE_LABELS = {
  MEDICAL: "Khám bệnh",
  GROOMING: "Grooming",
  BOARDING: "Lưu trú",
  VACCINE: "Tiêm phòng",
  MIXED: "Khám & dịch vụ",
  FOOD: "Thức ăn",
  OTHER: "Khác",
};

const STATUS_LABELS = {
  PENDING: "Chờ khám",
  CONFIRMED: "Đã xác nhận",
  IN_PROGRESS: "Đang khám",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Không đến",
};

const STATUS_VIEW = {
  PENDING: { label: "Chờ khám", color: "#D97706", bg: "#FFFBEB" },
  CONFIRMED: { label: "Đã xác nhận", color: "#2563EB", bg: "#EFF6FF" },
  IN_PROGRESS: { label: "Đang khám", color: "#7C3AED", bg: "#F5F3FF" },
  COMPLETED: { label: "Hoàn thành", color: "#059669", bg: "#ECFDF5" },
  CANCELLED: { label: "Đã hủy", color: "#DC2626", bg: "#FEF2F2" },
  NO_SHOW: { label: "Không đến", color: "#64748B", bg: "#F1F5F9" },
};

const PORTAL_STATUS_VIEW = {
  completed: {
    label: "Hoàn thành",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  in_progress: {
    label: "Đang khám",
    cls: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  scheduled: {
    label: "Chờ khám",
    cls: "bg-blue-50 text-blue-700 ring-blue-200",
    dot: "bg-blue-500",
  },
};

function getPortalStatusKey(status) {
  if (status === "COMPLETED") return "completed";
  if (status === "IN_PROGRESS") return "in_progress";
  return "scheduled";
}

function formatLongDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function parsePositiveId(value, fieldName = "id") {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${fieldName} không hợp lệ`);
  }
  return id;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN");
}

function formatTime(value) {
  if (!value) return "--:--";
  return String(value).slice(0, 5);
}

function formatAge(dob) {
  if (!dob) return "Chưa rõ";

  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "Chưa rõ";

  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) {
    years -= 1;
  }

  if (years <= 0) {
    const months = Math.max(1, Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    return `${months} tháng`;
  }

  return `${years} tuổi`;
}

function getInitials(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getGenderLabel(gender) {
  if (gender === "MALE") return "Đực";
  if (gender === "FEMALE") return "Cái";
  return "Chưa rõ";
}

function getServiceLabel(type) {
  return SERVICE_LABELS[type] || type || "Chưa rõ";
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || "Chưa rõ";
}

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function emptyExamRecord() {
  return {
    chiefComplaint: "",
    selectedSymptoms: [],
    duration: "",
    onset: "",
    severity: 0,
    ownerNotes: "",
    vitals: {
      temp: "",
      heart: "",
      resp: "",
      spo2: "",
      weight: "",
    },
    systems: Object.fromEntries(
      EXAM_BODY_SYSTEMS.map((system) => [
        system.id,
        {
          status: "not_examined",
          notes: "",
        },
      ]),
    ),
    clinicalNote: "",
    nextVisitDate: null,
  };
}

function normalizeExamRecord(rawVisit) {
  const empty = emptyExamRecord();

  if (!rawVisit) return empty;

  const clinicalExam = safeJsonParse(rawVisit.clinical_exam, {});

  return {
    ...empty,
    chiefComplaint: clinicalExam.chiefComplaint || "",
    selectedSymptoms: Array.isArray(clinicalExam.selectedSymptoms)
      ? clinicalExam.selectedSymptoms
      : String(rawVisit.symptoms || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
    duration: clinicalExam.duration || "",
    onset: clinicalExam.onset || "",
    severity: Number(clinicalExam.severity || 0),
    ownerNotes: clinicalExam.ownerNotes || "",
    vitals: {
      ...empty.vitals,
      ...(clinicalExam.vitals || {}),
    },
    systems: {
      ...empty.systems,
      ...(clinicalExam.systems || {}),
    },
    clinicalNote: rawVisit.diagnosis_note || "",
    nextVisitDate: rawVisit.next_visit_date || null,
  };
}

function sanitizeExamRecord(input) {
  const empty = emptyExamRecord();
  const record = input && typeof input === "object" ? input : {};

  const allowedSymptoms = new Set(EXAM_SYMPTOM_OPTIONS);
  const allowedDurations = new Set(EXAM_FORM_OPTIONS.durationOptions.map((item) => item.value));
  const allowedOnsets = new Set(EXAM_FORM_OPTIONS.onsetOptions.map((item) => item.value));
  const allowedStatus = new Set(EXAM_FORM_OPTIONS.systemStatusOptions.map((item) => item.value));
  const allowedSystemIds = new Set(EXAM_BODY_SYSTEMS.map((item) => item.id));

  const systems = { ...empty.systems };
  const rawSystems = record.systems && typeof record.systems === "object" ? record.systems : {};

  for (const [systemId, entry] of Object.entries(rawSystems)) {
    if (!allowedSystemIds.has(systemId)) continue;

    systems[systemId] = {
      status: allowedStatus.has(entry?.status) ? entry.status : "not_examined",
      notes: String(entry?.notes || "").trim(),
    };
  }

  const severity = Number(record.severity || 0);

  return {
    ...empty,
    chiefComplaint: String(record.chiefComplaint || "").trim(),
    selectedSymptoms: Array.isArray(record.selectedSymptoms)
      ? record.selectedSymptoms
          .map((item) => String(item).trim())
          .filter((item) => allowedSymptoms.has(item))
      : [],
    duration: allowedDurations.has(record.duration) ? record.duration : "",
    onset: allowedOnsets.has(record.onset) ? record.onset : "",
    severity: Number.isInteger(severity) && severity >= 0 && severity <= 5 ? severity : 0,
    ownerNotes: String(record.ownerNotes || "").trim(),
    vitals: {
      temp: String(record.vitals?.temp || "").trim(),
      heart: String(record.vitals?.heart || "").trim(),
      resp: String(record.vitals?.resp || "").trim(),
      spo2: String(record.vitals?.spo2 || "").trim(),
      weight: String(record.vitals?.weight || "").trim(),
    },
    systems,
    clinicalNote: String(record.clinicalNote || "").trim(),
    nextVisitDate: record.nextVisitDate || null,
  };
}

async function getOwnedAppointment(appointmentId, doctorId) {
  if (!doctorId) {
    throw new Error("Tài khoản bác sĩ chưa được liên kết hồ sơ bác sĩ");
  }

  const { data, error } = await supabase
    .from("appointments")
    .select(`
      id,
      pet_id,
      doctor_id,
      doctor_schedule_id,
      appointment_type,
      status,
      note,
      cancel_reason,
      requested_date,
      requested_time,
      created_at,
      updated_at,
      doctor_schedules:doctor_schedule_id (
        id,
        work_date,
        start_time,
        end_time,
        room_name,
        status
      ),
      pets:pet_id (
        id,
        name,
        gender,
        dob,
        weight,
        color,
        img_url,
        allergies,
        chronic_diseases,
        special_note,
        species:species_id (
          id,
          name
        ),
        breed:breed_id (
          id,
          name
        ),
        customers:customer_id (
          id,
          full_name,
          phone,
          address
        )
      )
    `)
    .eq("id", appointmentId)
    .eq("doctor_id", doctorId)
    .single();

  if (error || !data) {
    throw new Error("Không tìm thấy lịch hẹn hoặc bạn không có quyền truy cập");
  }

  return data;
}

async function getCurrentMedicalVisit(appointmentId) {
  const { data, error } = await supabase
    .from("medical_visits")
    .select("id, appointment_id, symptoms, clinical_exam, diagnosis_note, next_visit_date, created_at, updated_at")
    .eq("appointment_id", appointmentId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data || null;
}

async function getVaccinations(petId) {
  const { data, error } = await supabase
    .from("vaccinations")
    .select("id, vaccine_name, date_given, next_due_date, note")
    .eq("pet_id", petId)
    .order("date_given", { ascending: false });

  if (error) throw new Error(error.message);

  const today = new Date();

  return (data || []).map((item) => {
    const dueDate = item.next_due_date ? new Date(item.next_due_date) : null;

    return {
      id: item.id,
      name: item.vaccine_name,
      dateGiven: item.date_given,
      nextDueDate: item.next_due_date,
      dateGivenLabel: formatDate(item.date_given),
      nextDueDateLabel: formatDate(item.next_due_date),
      note: item.note || "",
      isDue: dueDate ? dueDate.getTime() < today.getTime() : false,
    };
  });
}

async function getVisitHistory(petId, currentAppointmentId) {
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(`
      id,
      doctor_id,
      doctor_schedule_id,
      appointment_type,
      status,
      created_at,
      doctors:doctor_id (
        full_name
      ),
      doctor_schedules:doctor_schedule_id (
        work_date,
        start_time,
        room_name
      )
    `)
    .eq("pet_id", petId)
    .neq("id", currentAppointmentId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) throw new Error(error.message);

  const appointmentIds = (appointments || []).map((item) => item.id);

  const { data: visits, error: visitError } = appointmentIds.length
    ? await supabase
        .from("medical_visits")
        .select("appointment_id, diagnosis_note, next_visit_date")
        .in("appointment_id", appointmentIds)
    : { data: [], error: null };

  if (visitError) throw new Error(visitError.message);

  const visitMap = new Map((visits || []).map((visit) => [visit.appointment_id, visit]));

  return (appointments || []).map((appointment) => {
    const visit = visitMap.get(appointment.id);
    const schedule = appointment.doctor_schedules;

    return {
      id: appointment.id,
      date: formatDate(schedule?.work_date || appointment.created_at),
      time: formatTime(schedule?.start_time),
      service: getServiceLabel(appointment.appointment_type),
      status: getStatusLabel(appointment.status),
      doctorName: appointment.doctors?.full_name || "Chưa rõ bác sĩ",
      diagnosisNote: visit?.diagnosis_note || "",
      nextVisitDate: visit?.next_visit_date || null,
    };
  });
}

function buildExamDetail({ appointment, vaccinations, history, visit }) {
  const pet = appointment.pets;
  const owner = pet?.customers;
  const schedule = appointment.doctor_schedules;
  const record = normalizeExamRecord(visit);

  return {
    appointment: {
      id: appointment.id,
      displayId: `APT-${String(appointment.id).padStart(5, "0")}`,
      status: appointment.status,
      statusLabel: getStatusLabel(appointment.status),
      serviceType: appointment.appointment_type,
      serviceLabel: getServiceLabel(appointment.appointment_type),
      date: appointment.requested_date || schedule?.work_date || appointment.created_at,
      dateLabel: formatDate(appointment.requested_date || schedule?.work_date || appointment.created_at),
      time: formatTime(appointment.requested_time || schedule?.start_time),
      endTime: formatTime(schedule?.end_time),
      roomName: schedule?.room_name || "",
      note: appointment.note || "",
    },
    patientCard: {
      id: pet?.id || null,
      name: pet?.name || "Chưa rõ",
      initials: getInitials(pet?.name),
      imageUrl: pet?.img_url || null,
      subtitle: [
        pet?.species?.name || "Chưa rõ loài",
        getGenderLabel(pet?.gender),
        pet?.color || "Chưa rõ màu",
      ].join(" · "),
      serviceBadge: getServiceLabel(appointment.appointment_type),
    },
    petInfoItems: [
      { key: "age", icon: "CalendarDays", label: "Tuổi", value: formatAge(pet?.dob) },
      { key: "weight", icon: "Weight", label: "Cân nặng", value: pet?.weight ? `${pet.weight} kg` : "Chưa rõ" },
      { key: "breed", icon: "Stethoscope", label: "Giống", value: pet?.breed?.name || "Chưa rõ" },
      { key: "time", icon: "Clock", label: "Giờ hẹn", value: formatTime(schedule?.start_time) },
    ],
    owner: {
      id: owner?.id || null,
      fullName: owner?.full_name || "Chưa rõ chủ nuôi",
      phone: owner?.phone || "Chưa có SĐT",
      address: owner?.address || "",
    },
    riskAlerts: [
      pet?.allergies ? { key: "allergies", label: "Dị ứng", value: pet.allergies } : null,
      pet?.chronic_diseases ? { key: "chronicDiseases", label: "Bệnh nền", value: pet.chronic_diseases } : null,
      pet?.special_note ? { key: "specialNote", label: "Lưu ý", value: pet.special_note } : null,
    ].filter(Boolean),
    vaccinations,
    history,
    formSchema: {
      symptomOptions: EXAM_SYMPTOM_OPTIONS.map((label, index) => ({ id: index + 1, label })),
      bodySystems: EXAM_BODY_SYSTEMS,
      ...EXAM_FORM_OPTIONS,
      vitalFields: [
        { key: "temp", icon: "Thermometer", label: "Nhiệt độ", unit: "°C", tone: "orange" },
        { key: "heart", icon: "Heart", label: "Nhịp tim", unit: "lần/phút", tone: "red" },
        { key: "resp", icon: "Wind", label: "Nhịp thở", unit: "lần/phút", tone: "cyan" },
        { key: "spo2", icon: "Activity", label: "SpO₂", unit: "%", tone: "violet" },
        { key: "weight", icon: "Weight", label: "Cân nặng thực tế", unit: "kg", tone: "emerald" },
      ],
    },
    record,
  };
}

async function saveMedicalVisit(appointmentId, record) {
  const cleanRecord = sanitizeExamRecord(record);
  const now = new Date().toISOString();

  const clinicalExamPayload = {
    chiefComplaint: cleanRecord.chiefComplaint,
    selectedSymptoms: cleanRecord.selectedSymptoms,
    duration: cleanRecord.duration,
    onset: cleanRecord.onset,
    severity: cleanRecord.severity,
    ownerNotes: cleanRecord.ownerNotes,
    vitals: cleanRecord.vitals,
    systems: cleanRecord.systems,
  };

  const existingVisit = await getCurrentMedicalVisit(appointmentId);

  const payload = {
    appointment_id: appointmentId,
    symptoms: cleanRecord.selectedSymptoms.join(", "),
    clinical_exam: JSON.stringify(clinicalExamPayload),
    diagnosis_note: cleanRecord.clinicalNote || null,
    next_visit_date: cleanRecord.nextVisitDate || null,
    updated_at: now,
  };

  if (existingVisit?.id) {
    const { data, error } = await supabase
      .from("medical_visits")
      .update(payload)
      .eq("id", existingVisit.id)
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabase
    .from("medical_visits")
    .insert({
      ...payload,
      created_at: now,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// GET /api/doctor/appointments
router.get("/", async function getDoctorAppointments(req, res) {
  try {
    const doctorId = req.auth?.user?.doctorId;

    if (!doctorId) {
      return res.status(403).json({
        ok: false,
        message: "Tài khoản này không phải là bác sĩ hoặc chưa được liên kết với hồ sơ bác sĩ",
      });
    }

    const payload = await listDoctorAppointmentsForPortal(doctorId);
    res.json({ ok: true, ...payload });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

// PUT /api/doctor/appointments/:id/start
router.put("/:id/start", async function startExam(req, res) {
  try {
    const appointmentId = parsePositiveId(req.params.id, "ID lịch hẹn");
    const doctorId = req.auth?.user?.doctorId;
    const appointment = await getOwnedAppointment(appointmentId, doctorId);

    if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
      return res.status(400).json({
        ok: false,
        message: "Chỉ có thể bắt đầu lịch hẹn ở trạng thái chờ khám hoặc đã xác nhận",
      });
    }

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "IN_PROGRESS",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId);

    if (error) throw new Error(error.message);

    res.json({ ok: true, message: "Bắt đầu khám thành công" });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

// GET /api/doctor/appointments/:id/exam-detail
router.get("/:id/exam-detail", async function getExamDetail(req, res) {
  try {
    const appointmentId = parsePositiveId(req.params.id, "ID lịch hẹn");
    const doctorId = req.auth?.user?.doctorId;

    const appointment = await getOwnedAppointment(appointmentId, doctorId);
    const [visit, vaccinations, history] = await Promise.all([
      getCurrentMedicalVisit(appointmentId),
      getVaccinations(appointment.pet_id),
      getVisitHistory(appointment.pet_id, appointmentId),
    ]);

    res.json({
      ok: true,
      detail: buildExamDetail({
        appointment,
        vaccinations,
        history,
        visit,
      }),
    });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

// PUT /api/doctor/appointments/:id/exam-draft
router.put("/:id/exam-draft", async function saveExamDraft(req, res) {
  try {
    const appointmentId = parsePositiveId(req.params.id, "ID lịch hẹn");
    const doctorId = req.auth?.user?.doctorId;
    const appointment = await getOwnedAppointment(appointmentId, doctorId);

    await saveMedicalVisit(appointmentId, req.body?.record);

    if (["PENDING", "CONFIRMED"].includes(appointment.status)) {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "IN_PROGRESS",
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointmentId);

      if (error) throw new Error(error.message);
    }

    res.json({ ok: true, message: "Đã lưu nháp phiếu khám" });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

// PUT /api/doctor/appointments/:id/exam-complete
router.put("/:id/exam-complete", async function completeExamWithRecord(req, res) {
  try {
    const appointmentId = parsePositiveId(req.params.id, "ID lịch hẹn");
    const doctorId = req.auth?.user?.doctorId;

    await getOwnedAppointment(appointmentId, doctorId);
    await saveMedicalVisit(appointmentId, req.body?.record);

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "COMPLETED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId);

    if (error) throw new Error(error.message);

    res.json({ ok: true, message: "Đã hoàn thành ca khám" });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

// Giữ endpoint cũ để không vỡ nơi khác nếu đang gọi /complete.
router.put("/:id/complete", async function completeExamOnly(req, res) {
  try {
    const appointmentId = parsePositiveId(req.params.id, "ID lịch hẹn");
    const doctorId = req.auth?.user?.doctorId;
    const appointment = await getOwnedAppointment(appointmentId, doctorId);

    if (appointment.status !== "IN_PROGRESS") {
      return res.status(400).json({
        ok: false,
        message: "Chỉ có thể hoàn thành lịch hẹn đang trong quá trình khám",
      });
    }

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "COMPLETED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId);

    if (error) throw new Error(error.message);

    res.json({ ok: true, message: "Hoàn thành khám thành công" });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

module.exports = router;
