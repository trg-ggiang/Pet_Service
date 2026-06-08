const { supabase } = require("../lib/supabaseClient");

async function checkDoctorScheduleConflict(doctorId, scheduleDate, excludeAppointmentId = null) {
  const { data, error } = await supabase
    .from("appointments")
    .select("id, requested_date, requested_time")
    .eq("doctor_id", doctorId)
    .not("status", "in", "('CANCELLED')")
    .eq("requested_date", scheduleDate)
    .not("doctor_schedule_id", "is", null);

  if (error) throw new Error(`Lỗi kiểm tra lịch: ${error.message}`);

  return (data || []).filter((apt) => {
    if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
    return true;
  });
}

async function assertScheduleAvailable(doctorId, scheduleDate, appointmentId = null) {
  const conflicts = await checkDoctorScheduleConflict(doctorId, scheduleDate, appointmentId);
  if (conflicts.length > 0) {
    const error = new Error("Bác sĩ đã có lịch hẹn vào ngày này. Vui lòng chọn ngày khác.");
    error.statusCode = 409;
    throw error;
  }
}

module.exports = { checkDoctorScheduleConflict, assertScheduleAvailable };
