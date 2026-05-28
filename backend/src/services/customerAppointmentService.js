const { supabase } = require("../lib/supabaseClient");

function addHours(timeStr, hours) {
  const [h, m, s] = timeStr.split(":").map(Number);
  const totalMinutes = h * 60 + m + hours * 60;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return String(newH).padStart(2, "0") + ":" + String(newM).padStart(2, "0") + ":" + String(s || 0).padStart(2, "0");
}

function formatAppointment(apt) {
  const statusMap = {
    PENDING: { label: "Chờ xác nhận", color: "amber", bgColor: "bg-amber-50", textColor: "text-amber-700", borderColor: "border-amber-200" },
    CONFIRMED: { label: "Đã xác nhận", color: "blue", bgColor: "bg-blue-50", textColor: "text-blue-700", borderColor: "border-blue-200" },
    IN_PROGRESS: { label: "Đang xử lý", color: "violet", bgColor: "bg-violet-50", textColor: "text-violet-700", borderColor: "border-violet-200" },
    COMPLETED: { label: "Hoàn thành", color: "emerald", bgColor: "bg-emerald-50", textColor: "text-emerald-700", borderColor: "border-emerald-200" },
    CANCELLED: { label: "Đã hủy", color: "red", bgColor: "bg-red-50", textColor: "text-red-700", borderColor: "border-red-200" },
    NO_SHOW: { label: "Không đến", color: "slate", bgColor: "bg-slate-100", textColor: "text-slate-600", borderColor: "border-slate-300" },
  };
  const statusInfo = statusMap[apt.status] || { label: apt.status, color: "slate", bgColor: "bg-slate-50", textColor: "text-slate-600", borderColor: "border-slate-200" };

  const serviceMap = {
    MEDICAL: "Khám bệnh",
    GROOMING: "Grooming",
    BOARDING: "Lưu trú",
    VACCINE: "Tiêm phòng",
    FOOD: "Thức ăn",
    OTHER: "Khác",
    MIXED: "Khám & Dịch vụ"
  };
  const iconMap = {
    MEDICAL: { icon: "Stethoscope", iconColor: "text-rose-500", iconBg: "bg-rose-100" },
    GROOMING: { icon: "Scissors", iconColor: "text-purple-500", iconBg: "bg-purple-100" },
    BOARDING: { icon: "Home", iconColor: "text-amber-500", iconBg: "bg-amber-100" },
    VACCINE: { icon: "Star", iconColor: "text-emerald-500", iconBg: "bg-emerald-100" },
    FOOD: { icon: "Package", iconColor: "text-orange-500", iconBg: "bg-orange-100" },
    MIXED: { icon: "Puzzle", iconColor: "text-cyan-500", iconBg: "bg-cyan-100" },
  };

  const createdDate = new Date(apt.appointment_date || apt.created_at);
  const iconInfo = iconMap[apt.appointment_type] || iconMap.MEDICAL;

  // Format date from appointment_date if available
  let formattedDate;
  if (apt.appointment_date) {
    const d = new Date(apt.appointment_date);
    formattedDate = String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
  } else {
    formattedDate = String(createdDate.getDate()).padStart(2, "0") + "/" + String(createdDate.getMonth() + 1).padStart(2, "0") + "/" + createdDate.getFullYear();
  }

  return {
    id: apt.id,
    appointmentId: "APT-" + String(apt.id).padStart(5, "0"),
    date: formattedDate,
    time: apt.appointment_time || String(createdDate.getHours()).padStart(2, "0") + ":" + String(createdDate.getMinutes()).padStart(2, "0"),
    service: serviceMap[apt.appointment_type] || apt.appointment_type,
    serviceType: apt.appointment_type,
    pet: apt.pets ? apt.pets.name : "N/A",
    petId: apt.pet_id,
    petSpecies: apt.pets && apt.pets.animal_species ? apt.pets.animal_species.name : "N/A",
    petImage: apt.pets ? apt.pets.img_url : null,
    doctor: apt.doctors ? apt.doctors.full_name : "Chưa phân công",
    doctorId: apt.doctor_id,
    icon: iconInfo.icon,
    iconColor: iconInfo.iconColor,
    iconBg: iconInfo.iconBg,
    status: apt.status,
    statusLabel: statusInfo.label,
    statusColor: statusInfo.color,
    statusBg: statusInfo.bgColor,
    statusText: statusInfo.textColor,
    statusBorder: statusInfo.borderColor,
    note: apt.note || null,
    cancelReason: apt.cancel_reason || null,
    createdAt: apt.created_at,
    updatedAt: apt.updated_at,
  };
}

async function getDoctors() {
  const { data: doctors, error } = await supabase
    .from("doctors")
    .select("id, full_name, specialization")
    .order("full_name", { ascending: true });

  if (error) {
    console.error("[SERVICE] getDoctors ERROR:", error);
    throw new Error(error.message);
  }

  return doctors || [];
}

async function getCustomerAppointments(customerId) {
  const effectiveCustomerId = Number(customerId);
  if (!Number.isFinite(effectiveCustomerId)) throw new Error("Thiếu thông tin khách hàng");

  console.log("=== [SERVICE] getCustomerAppointments ===");
  console.log("customerId:", effectiveCustomerId);

  // Bước 1: Lấy danh sách pet IDs của customer
  const { data: customerPets, error: petsError } = await supabase
    .from("pets")
    .select("id, name, species_id, img_url, animal_species:species_id (name)")
    .eq("customer_id", effectiveCustomerId)
    .order("name", { ascending: true });

  if (petsError) {
    console.error("[SERVICE] Pets ERROR:", petsError);
    throw new Error(petsError.message);
  }

  const petIds = (customerPets || []).map(p => p.id);
  console.log("[SERVICE] Customer pets:", petIds);

  // Bước 2: Lấy appointments chỉ của các pet thuộc customer này
  let appointments = [];
  if (petIds.length > 0) {
    const { data: appointmentsData, error: aptError } = await supabase
      .from("appointments")
      .select(`
        id, pet_id, doctor_id, staff_id, appointment_type, status, note, cancel_reason, appointment_date, appointment_time, created_at, updated_at,
        pets:pet_id (id, name, species_id, img_url, animal_species:species_id (name)),
        doctors:doctor_id (id, full_name, specialization)
      `)
      .in("pet_id", petIds)
      .order("created_at", { ascending: false });

    if (aptError) {
      console.error("[SERVICE] Appointments ERROR:", aptError);
      throw new Error(aptError.message);
    }

    appointments = appointmentsData || [];
  }

  console.log("[SERVICE] Found appointments:", appointments.length);
  const formattedAppointments = appointments.map(formatAppointment);

  const formattedPets = (customerPets || []).map(function(pet) {
    return {
      id: pet.id,
      name: pet.name,
      species: pet.animal_species ? pet.animal_species.name : "N/A",
      image: pet.img_url || null,
    };
  });

  // Bước 3: Lấy danh sách bác sĩ
  const doctors = await getDoctors();

  return { appointments: formattedAppointments, pets: formattedPets, doctors };
}

async function createAppointment(input, customerId) {
  const effectiveCustomerId = Number(customerId);
  if (!Number.isFinite(effectiveCustomerId)) throw new Error("Thiếu thông tin khách hàng");

  console.log("=== [SERVICE] createAppointment ===");
  console.log("customerId:", effectiveCustomerId);
  console.log("input:", JSON.stringify(input, null, 2));

  const { petId, doctorId, doctorScheduleId, appointmentType, note } = input;
  if (!petId) throw new Error("Vui lòng chọn thú cưng");
  if (!appointmentType) throw new Error("Vui lòng chọn loại dịch vụ");

  console.log("[SERVICE] Verifying pet:", petId);
  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("id, name, customer_id")
    .eq("id", Number(petId))
    .eq("customer_id", effectiveCustomerId)
    .single();

  if (petError || !pet) {
    console.error("[SERVICE] Pet verification ERROR:", petError);
    throw new Error("Thú cưng không hợp lệ hoặc không thuộc về bạn");
  }
  console.log("[SERVICE] Pet verified:", pet.name);

  let validDoctorId = null;

  if (doctorId) {
    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select("id, full_name")
      .eq("id", Number(doctorId))
      .single();
    if (doctorError || !doctor) throw new Error("Bác sĩ không hợp lệ");
    validDoctorId = Number(doctorId);
    console.log("[SERVICE] Doctor verified:", doctor.full_name, "id:", validDoctorId);
  }

  const now = new Date().toISOString();
  const appointmentPayload = {
    pet_id: Number(petId),
    doctor_id: validDoctorId,
    appointment_type: appointmentType,
    status: "PENDING",
    note: note && note.trim() ? note.trim() : null,
    appointment_date: input.appointmentDate || null,
    appointment_time: input.appointmentTime || null,
    updated_at: now,
  };

  console.log("[SERVICE] Inserting:", JSON.stringify(appointmentPayload, null, 2));

  const { data: newAppointment, error: insertError } = await supabase
    .from("appointments")
    .insert(appointmentPayload)
    .select(`
      id, pet_id, doctor_id, appointment_type, status, note, appointment_date, appointment_time, created_at, updated_at,
      pets:pet_id (id, name, animal_species:species_id (name)),
      doctors:doctor_id (id, full_name)
    `)
    .single();

  if (insertError) {
    console.error("[SERVICE] INSERT ERROR:", insertError);
    throw new Error("Không thể tạo lịch hẹn: " + insertError.message);
  }

  if (!newAppointment) throw new Error("Không nhận được phản hồi từ server");

  console.log("========================================");
  console.log("✅ LỊCH HẸN ĐÃ ĐƯỢC LƯU VÀO DATABASE!");
  console.log("========================================");
  console.log("ID:", newAppointment.id);
  console.log("Mã: APT-" + String(newAppointment.id).padStart(5, "0"));
  console.log("Pet:", newAppointment.pets ? newAppointment.pets.name : "N/A");
  console.log("Doctor ID:", newAppointment.doctor_id);
  console.log("Ngày khám:", newAppointment.appointment_date);
  console.log("Giờ khám:", newAppointment.appointment_time);
  console.log("Loại dịch vụ:", newAppointment.appointment_type);
  console.log("Trạng thái:", newAppointment.status);
  console.log("========================================");

  return formatAppointment(newAppointment);
}

async function cancelAppointment(appointmentId, reason, customerId) {
  const effectiveCustomerId = Number(customerId);
  const aptIdNumber = Number(appointmentId);
  if (!Number.isFinite(aptIdNumber)) throw new Error("Invalid appointment ID");
  if (!Number.isFinite(effectiveCustomerId)) throw new Error("Thiếu thông tin khách hàng");

  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select("id, status, pet_id, pets!inner(customer_id)")
    .eq("id", aptIdNumber)
    .eq("pets.customer_id", effectiveCustomerId)
    .single();

  if (fetchError || !appointment) throw new Error("Không tìm thấy lịch hẹn");

  const cancellableStatuses = ["PENDING", "CONFIRMED"];
  if (!cancellableStatuses.includes(appointment.status)) throw new Error("Không thể hủy lịch hẹn ở trạng thái hiện tại");

  // Cập nhật trạng thái thành CANCELLED
  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status: "CANCELLED", cancel_reason: reason?.trim() || "Khách hàng tự hủy", updated_at: new Date().toISOString() })
    .eq("id", aptIdNumber);

  if (updateError) throw new Error("Không thể hủy lịch hẹn: " + updateError.message);
}

async function getAppointmentDetail(appointmentId, customerId) {
  const effectiveCustomerId = Number(customerId);
  const aptIdNumber = Number(appointmentId);
  if (!Number.isFinite(aptIdNumber)) throw new Error("Invalid appointment ID");

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select(`
      id, pet_id, doctor_id, staff_id, appointment_type, status, note, cancel_reason, created_at, updated_at,
      pets:pet_id (id, name, img_url, animal_species:species_id (name)),
      doctors:doctor_id (id, full_name, specialization)
    `)
    .eq("id", aptIdNumber)
    .eq("pets.customer_id", effectiveCustomerId)
    .single();

  if (error || !appointment) throw new Error("Không tìm thấy lịch hẹn");
  return formatAppointment(appointment);
}

module.exports = {
  getCustomerAppointments,
  createAppointment,
  cancelAppointment,
  getAppointmentDetail,
};
