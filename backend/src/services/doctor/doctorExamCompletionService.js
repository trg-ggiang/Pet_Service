const { getPrismaClient } = require("../../lib/prisma");

const ACTIVE_APPOINTMENT_STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"];

function appError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function dateValue(value) {
  const text = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function timeValue(value) {
  const text = String(value || "").trim();
  if (!/^\d{2}:\d{2}/.test(text)) return null;
  const time = new Date(`1970-01-01T${text.slice(0, 5)}:00.000Z`);
  return Number.isNaN(time.getTime()) ? null : time;
}

function dateText(value) {
  return value instanceof Date && !Number.isNaN(value.getTime())
    ? value.toISOString().slice(0, 10)
    : "";
}

function timeText(value) {
  return value instanceof Date && !Number.isNaN(value.getTime())
    ? value.toISOString().slice(11, 19)
    : "";
}

function addMinutes(value, minutes) {
  return new Date(value.getTime() + minutes * 60 * 1000);
}

function moneyNumber(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
}

function getBillableAppointmentService(appointment) {
  return appointment.appointmentServices.find((item) => item.service?.type === "MEDICAL")
    || appointment.appointmentServices.find((item) => item.service?.type === "VACCINE")
    || appointment.appointmentServices[0]
    || null;
}

function getFollowUpSlot(record) {
  if (!record.nextVisitDate) return null;

  const date = dateValue(record.nextVisitDate);
  const time = timeValue(record.nextVisitTime);
  if (!date) throw appError("Ngày tái khám không hợp lệ");
  if (!time) throw appError("Vui lòng chọn giờ tái khám");

  const localSlot = new Date(`${dateText(date)}T${timeText(time)}`);
  if (Number.isNaN(localSlot.getTime()) || localSlot.getTime() <= Date.now()) {
    throw appError("Lịch tái khám phải nằm trong tương lai");
  }

  return { date, time };
}

async function saveMedicalVisit(tx, appointmentId, record) {
  const clinicalExam = JSON.stringify({
    chiefComplaint: record.chiefComplaint,
    selectedSymptoms: record.selectedSymptoms,
    duration: record.duration,
    onset: record.onset,
    severity: record.severity,
    ownerNotes: record.ownerNotes,
    vitals: record.vitals,
    systems: record.systems,
    nextVisitTime: record.nextVisitTime,
  });

  const medicalVisit = await tx.medicalVisit.upsert({
    where: { appointmentId },
    create: {
      appointmentId,
      symptoms: record.selectedSymptoms.join(", "),
      clinicalExam,
      diagnosisNote: record.clinicalNote || null,
      nextVisitDate: dateValue(record.nextVisitDate),
    },
    update: {
      symptoms: record.selectedSymptoms.join(", "),
      clinicalExam,
      diagnosisNote: record.clinicalNote || null,
      nextVisitDate: dateValue(record.nextVisitDate),
    },
  });

  await tx.prescription.deleteMany({ where: { medicalVisitId: medicalVisit.id } });

  for (const prescription of record.prescriptions) {
    await tx.prescription.create({
      data: {
        medicalVisitId: medicalVisit.id,
        notes: prescription.instructions || null,
        items: {
          create: {
            medicineName: prescription.medicineName,
            dosage: prescription.dosage || "Không ghi nhận",
            frequency: prescription.frequency || "Không ghi nhận",
            durationDays: prescription.durationDays,
            instructions: prescription.instructions || null,
          },
        },
      },
    });
  }

  return medicalVisit;
}

async function createFollowUpAppointment(tx, originalAppointment, record) {
  const slot = getFollowUpSlot(record);
  if (!slot) return null;

  if (
    dateText(originalAppointment.requestedDate) === dateText(slot.date)
    && timeText(originalAppointment.requestedTime) === timeText(slot.time)
  ) {
    return null;
  }

  const conflictingAppointment = await tx.appointment.findFirst({
    where: {
      id: { not: originalAppointment.id },
      doctorId: originalAppointment.doctorId,
      requestedDate: slot.date,
      requestedTime: slot.time,
      status: { in: ACTIVE_APPOINTMENT_STATUSES },
    },
    select: { id: true },
  });
  if (conflictingAppointment) {
    throw appError("Bác sĩ đã có lịch hẹn trong khung giờ tái khám này", 409);
  }

  const scheduleSlot = await tx.doctorScheduleSlot.findFirst({
    where: {
      doctorId: originalAppointment.doctorId,
      slotDate: slot.date,
      startTime: slot.time,
      endTime: addMinutes(slot.time, 30),
      status: "AVAILABLE",
    },
  });
  if (!scheduleSlot) {
    throw appError("Khung giờ tái khám không còn khả dụng", 409);
  }

  const reservation = await tx.doctorScheduleSlot.updateMany({
    where: { id: scheduleSlot.id, status: "AVAILABLE" },
    data: { status: "BOOKED" },
  });
  if (reservation.count !== 1) {
    throw appError("Khung giờ tái khám vừa được đặt", 409);
  }

  const service = await tx.service.findFirst({
    where: { type: "MEDICAL", isActive: true },
    orderBy: { id: "asc" },
  });
  const note = [
    `Tái khám từ lịch ${String(originalAppointment.id).padStart(6, "0")}`,
    record.clinicalNote ? `Ghi chú: ${record.clinicalNote}` : "",
  ].filter(Boolean).join(". ");

  const followUp = await tx.appointment.create({
    data: {
      petId: originalAppointment.petId,
      doctorId: originalAppointment.doctorId,
      doctorScheduleSlotId: scheduleSlot.id,
      appointmentType: "MEDICAL",
      status: "PENDING",
      requestedDate: slot.date,
      requestedTime: slot.time,
      note,
      appointmentServices: service
        ? {
            create: {
              serviceId: service.id,
              quantity: 1,
              unitPrice: service.price,
              status: "PENDING",
            },
          }
        : undefined,
    },
  });

  const customerUserId = originalAppointment.pet.customer.userId;
  if (!customerUserId) throw appError("Không tìm thấy tài khoản khách hàng", 409);

  await tx.notification.create({
    data: {
      userId: customerUserId,
      title: "Lịch tái khám mới",
      content: `${originalAppointment.pet.name} có lịch tái khám vào ${dateText(slot.date)} lúc ${timeText(slot.time).slice(0, 5)}. Mã lịch hẹn: APT-${String(followUp.id).padStart(6, "0")}.`,
      type: "APPOINTMENT",
    },
  });

  return {
    id: followUp.id,
    date: dateText(slot.date),
    time: timeText(slot.time),
  };
}

async function createOrUpdateInvoice(tx, appointment, medicalVisitId) {
  const appointmentService = getBillableAppointmentService(appointment);
  const service = appointmentService?.service;
  const quantity = Math.max(1, Number(appointmentService?.quantity || 1));
  const unitPrice = moneyNumber(appointmentService?.unitPrice || service?.price);
  const totalPrice = quantity * unitPrice;

  let invoice = await tx.invoice.findUnique({ where: { appointmentId: appointment.id } });
  if (!invoice) {
    invoice = await tx.invoice.create({
      data: {
        appointmentId: appointment.id,
        subtotalAmount: totalPrice,
        totalAmount: totalPrice,
        paymentStatus: "UNPAID",
        status: "PENDING",
      },
    });
  }

  const itemData = {
    serviceId: appointmentService?.serviceId || service?.id || null,
    appointmentServiceId: appointmentService?.id || null,
    medicalVisitId,
    sourceType: "MEDICAL_VISIT",
    description: service?.name || "Khám bệnh",
    quantity,
    unitPrice,
    totalPrice,
  };
  const existingItem = await tx.invoiceItem.findFirst({
    where: { invoiceId: invoice.id, medicalVisitId },
  });

  if (existingItem) {
    await tx.invoiceItem.update({ where: { id: existingItem.id }, data: itemData });
  } else {
    await tx.invoiceItem.create({ data: { invoiceId: invoice.id, ...itemData } });
  }

  if (appointmentService) {
    await tx.appointmentService.update({
      where: { id: appointmentService.id },
      data: { status: "COMPLETED" },
    });
  }

  if (invoice.paymentStatus !== "PAID") {
    const invoiceItems = await tx.invoiceItem.findMany({
      where: { invoiceId: invoice.id },
      select: { totalPrice: true },
    });
    const subtotal = invoiceItems.reduce((sum, item) => sum + moneyNumber(item.totalPrice), 0);
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        subtotalAmount: subtotal,
        totalAmount: subtotal,
        paymentStatus: "UNPAID",
        status: "PENDING",
      },
    });
  }
}

async function completeDoctorExam({ appointmentId, doctorId, record }) {
  if (!Number.isInteger(doctorId) || doctorId <= 0) {
    throw appError("Không tìm thấy hồ sơ bác sĩ", 403);
  }

  const prisma = getPrismaClient();

  return prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findFirst({
      where: { id: appointmentId, doctorId },
      include: {
        pet: { include: { customer: true } },
        appointmentServices: { include: { service: true } },
      },
    });
    if (!appointment) throw appError("Không tìm thấy lịch hẹn", 404);
    if (appointment.status !== "IN_PROGRESS") {
      throw appError("Chỉ có thể hoàn thành lịch hẹn đang trong quá trình khám", 409);
    }

    const completion = await tx.appointment.updateMany({
      where: { id: appointmentId, doctorId, status: "IN_PROGRESS" },
      data: { status: "COMPLETED" },
    });
    if (completion.count !== 1) {
      throw appError("Lịch hẹn đã được cập nhật bởi một yêu cầu khác", 409);
    }

    const medicalVisit = await saveMedicalVisit(tx, appointmentId, record);
    const followUpAppointment = await createFollowUpAppointment(tx, appointment, record);
    await createOrUpdateInvoice(tx, appointment, medicalVisit.id);

    if (appointment.doctorScheduleSlotId) {
      await tx.doctorScheduleSlot.update({
        where: { id: appointment.doctorScheduleSlotId },
        data: { status: "DONE" },
      });
    }

    return { followUpAppointment };
  });
}

async function saveDoctorExamDraft({ appointmentId, doctorId, record }) {
  if (!Number.isInteger(doctorId) || doctorId <= 0) {
    throw appError("Không tìm thấy hồ sơ bác sĩ", 403);
  }

  const prisma = getPrismaClient();

  return prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findFirst({
      where: { id: appointmentId, doctorId },
      select: { id: true, status: true },
    });
    if (!appointment) throw appError("Không tìm thấy lịch hẹn", 404);
    if (appointment.status !== "IN_PROGRESS") {
      throw appError("Chỉ có thể lưu phiếu khám sau khi nhân viên đã check-in thú cưng", 409);
    }

    const medicalVisit = await saveMedicalVisit(tx, appointmentId, record);
    return { medicalVisitId: medicalVisit.id };
  });
}

module.exports = {
  completeDoctorExam,
  saveDoctorExamDraft,
};
