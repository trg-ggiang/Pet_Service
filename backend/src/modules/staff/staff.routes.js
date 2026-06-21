const express = require("express");
const { authMiddleware, requireRole } = require("../../middlewares/auth.middleware");
const {
  getStaffProfile,
  listStaffAppointments,
  confirmAppointment,
  checkInAppointment,
  approveAppointmentRequest,
  completeGroomingAppointment,
  listGroomingTasks,
  updateGroomingStatus,
  listBoardingGuests,
  updateBoardingDailyStatus,
  listPayments,
  markPaymentPaid,
  getStaffPortalSummary,
  createWalkInAppointment,
} = require("./staff.service");
const { getStoredSetting, saveStoredSetting } = require("../users/settings.service");

const AUTO_CONFIRM_HOURS_DEFAULT = 2;
const {
  listPendingBoardings,
  listConfirmedBoardings,
  approveBoardingBooking,
  checkInBoarding,
  checkOutBoarding,
  listAllRoomsForStaff,
  createCage,
  updateCage,
  deleteCage,
} = require("../boarding/boarding.service");
const { supabase } = require("../../lib/supabaseClient");
const { sendError } = require("../../utils/http");

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("staff"));

router.get("/profile", async function getProfile(req, res) {
  try {
    const profile = await getStaffProfile(req.auth?.user?.staffId);
    res.json({ ok: true, profile });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/summary", async function getSummary(req, res) {
  try {
    const summary = await getStaffPortalSummary(req.auth?.user?.staffId);
    res.json({ ok: true, summary });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/appointments", async function getAppointments(req, res) {
  try {
    const { appointments, autoConfirmedCount } = await listStaffAppointments(req.auth?.user?.staffId);
    res.json({ ok: true, appointments, autoConfirmedCount });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/settings/auto-confirm", async function getAutoConfirmSetting(req, res) {
  try {
    const raw = await getStoredSetting("auto_confirm_hours");
    const hours = Number(raw ?? AUTO_CONFIRM_HOURS_DEFAULT);
    res.json({ ok: true, hours: Number.isFinite(hours) ? hours : AUTO_CONFIRM_HOURS_DEFAULT });
  } catch (error) {
    sendError(res, error);
  }
});

router.put("/settings/auto-confirm", async function updateAutoConfirmSetting(req, res) {
  try {
    const hours = Number(req.body?.hours);
    if (!Number.isFinite(hours) || hours < 0 || hours > 72) {
      const err = new Error("Số giờ phải từ 0 đến 72");
      err.statusCode = 400;
      throw err;
    }
    await saveStoredSetting("auto_confirm_hours", hours);
    res.json({ ok: true, message: "Đã cập nhật cài đặt tự động xác nhận", hours });
  } catch (error) {
    sendError(res, error);
  }
});

// POST /api/staff/appointments/walk-in – tạo lịch hẹn vãng lai (không đặt trước)
router.post("/appointments/walk-in", async function createWalkIn(req, res) {
  try {
    const result = await createWalkInAppointment(req.auth?.user?.staffId, req.body ?? {});
    res.status(201).json({ ok: true, message: "Đã tạo lịch hẹn vãng lai", ...result });
  } catch (error) {
    sendError(res, error);
  }
});

// GET /api/staff/walk-in/customers?q=... – tìm khách hàng theo tên/sdt
router.get("/walk-in/customers", async function searchCustomers(req, res) {
  try {
    const q = String(req.query.q || "").trim();
    if (!q || q.length < 2) return res.json({ ok: true, customers: [] });
    const { data, error } = await supabase
      .from("customers")
      .select("id, full_name, phone")
      .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(10);
    if (error) throw new Error(error.message);
    res.json({ ok: true, customers: data ?? [] });
  } catch (error) {
    sendError(res, error);
  }
});

// GET /api/staff/walk-in/pets/:customerId – lấy danh sách thú cưng của khách
router.get("/walk-in/pets/:customerId", async function getCustomerPets(req, res) {
  try {
    const customerId = parseInt(req.params.customerId, 10);
    if (!customerId) return res.status(400).json({ ok: false, message: "ID khách hàng không hợp lệ" });
    const { data, error } = await supabase
      .from("pets")
      .select("id, name, species:species_id(name), breed:breed_id(name)")
      .eq("customer_id", customerId)
      .eq("is_active", true);
    if (error) throw new Error(error.message);
    res.json({ ok: true, pets: data ?? [] });
  } catch (error) {
    sendError(res, error);
  }
});

// GET /api/staff/walk-in/doctors – lấy danh sách bác sĩ hôm nay
router.get("/walk-in/doctors", async function getTodayDoctors(req, res) {
  try {
    const { data, error } = await supabase
      .from("doctors")
      .select("id, full_name, specialization, room_name")
      .order("full_name");
    if (error) throw new Error(error.message);
    res.json({ ok: true, doctors: data ?? [] });
  } catch (error) {
    sendError(res, error);
  }
});

router.put("/appointments/:id/confirm", async function confirmApt(req, res) {
  try {
    await confirmAppointment(req.params.id, req.auth?.user?.staffId);
    res.json({ ok: true, message: "Đã xác nhận lịch hẹn" });
  } catch (error) {
    sendError(res, error);
  }
});

router.put("/appointments/:id/checkin", async function checkIn(req, res) {
  try {
    await checkInAppointment(req.params.id, req.auth?.user?.staffId);
    res.json({ ok: true, message: "Check-in thành công" });
  } catch (error) {
    sendError(res, error);
  }
});

router.put("/appointments/:id/complete-grooming", async function completeGrooming(req, res) {
  try {
    await completeGroomingAppointment(req.params.id, req.auth?.user?.staffId);
    res.json({ ok: true, message: "Đã hoàn thành grooming và tạo hóa đơn" });
  } catch (error) {
    sendError(res, error);
  }
});

router.put("/appointments/:id/approve-request", async function approveRequest(req, res) {
  try {
    await approveAppointmentRequest(req.params.id, req.auth?.user?.staffId);
    res.json({ ok: true, message: "Đã duyệt yêu cầu lịch hẹn" });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/grooming", async function getGrooming(req, res) {
  try {
    const tasks = await listGroomingTasks(req.auth?.user?.staffId);
    res.json({ ok: true, tasks });
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/grooming/:id/status", async function patchGroomingStatus(req, res) {
  try {
    await updateGroomingStatus(req.params.id, req.body?.status, req.auth?.user?.staffId);
    res.json({ ok: true, message: "Đã cập nhật grooming" });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/boarding", async function getBoarding(req, res) {
  try {
    const guests = await listBoardingGuests();
    res.json({ ok: true, guests });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/boarding/pending", async function getPendingBoardings(req, res) {
  try {
    const bookings = await listPendingBoardings();
    res.json({ ok: true, bookings });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/boarding/confirmed", async function getConfirmedBoardings(req, res) {
  try {
    const bookings = await listConfirmedBoardings();
    res.json({ ok: true, bookings });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/boarding/rooms", async function getBoardingRooms(req, res) {
  try {
    const rooms = await listAllRoomsForStaff();
    res.json({ ok: true, rooms });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/boarding/rooms", async function createCageRoute(req, res) {
  try {
    const cage = await createCage(req.body ?? {});
    res.json({ ok: true, message: "Đã tạo phòng mới", cage });
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/boarding/rooms/:id", async function updateCageRoute(req, res) {
  try {
    await updateCage(req.params.id, req.body ?? {});
    res.json({ ok: true, message: "Đã cập nhật phòng" });
  } catch (error) {
    sendError(res, error);
  }
});

router.delete("/boarding/rooms/:id", async function deleteCageRoute(req, res) {
  try {
    await deleteCage(req.params.id);
    res.json({ ok: true, message: "Đã xóa phòng" });
  } catch (error) {
    sendError(res, error);
  }
});

router.put("/boarding/:id/approve", async function approveBoardingRoute(req, res) {
  try {
    await approveBoardingBooking(req.params.id, req.auth?.user?.staffId);
    res.json({ ok: true, message: "Đã duyệt phòng lưu trú" });
  } catch (error) {
    sendError(res, error);
  }
});

router.put("/boarding/:id/check-in", async function checkInBoardingRoute(req, res) {
  try {
    await checkInBoarding(req.params.id, req.auth?.user?.staffId);
    res.json({ ok: true, message: "Check-in thành công" });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/boarding/:id/checkout", async function checkOutBoardingRoute(req, res) {
  try {
    const result = await checkOutBoarding(req.params.id, req.auth?.user?.staffId, req.body ?? {});
    res.json({ ok: true, message: "Checkout thành công", ...result });
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/boarding/:id/daily-status", async function patchBoardingDailyStatus(req, res) {
  try {
    const result = await updateBoardingDailyStatus(req.params.id, req.body?.todayStatus, req.auth?.user?.staffId, req.body ?? {});
    res.json({ ok: true, message: "Đã cập nhật lưu trú" });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/payments", async function getPayments(req, res) {
  try {
    const payments = await listPayments();
    res.json({ ok: true, payments });
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/payments/:id/pay", async function payInvoice(req, res) {
  try {
    await markPaymentPaid(req.params.id, req.body?.method);
    res.json({ ok: true, message: "Đã xác nhận thanh toán" });
  } catch (error) {
    sendError(res, error);
  }
});

// DELETE /api/staff/appointments/:id – xóa lịch hẹn khi còn PENDING/CONFIRMED
router.delete("/appointments/:id", async function deleteAppointment(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || id < 1) return res.status(400).json({ ok: false, message: "ID không hợp lệ" });

    const { data: apt, error: fetchErr } = await supabase
      .from("appointments")
      .select("id, status")
      .eq("id", id)
      .single();

    if (fetchErr || !apt) return res.status(404).json({ ok: false, message: "Không tìm thấy lịch hẹn" });
    if (!["PENDING", "CONFIRMED"].includes(apt.status)) {
      return res.status(400).json({ ok: false, message: "Chỉ có thể xóa lịch hẹn đang chờ xác nhận hoặc chờ check-in" });
    }

    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) throw new Error(error.message);

    res.json({ ok: true, message: "Đã xóa lịch hẹn" });
  } catch (err) {
    sendError(res, err);
  }
});

// ── SPECIALIST QUEUE ──────────────────────────────────────────────────

// GET /api/staff/specialist-queue?roomType=XRAY – queue của phòng chuyên khoa
router.get("/specialist-queue", async function getSpecialistQueue(req, res) {
  try {
    const { roomType, status } = req.query;
    let query = supabase
      .from("appointment_services")
      .select(`
        id, quantity, unit_price, status, note, ordered_at,
        services ( id, name, specialist_room_type ),
        appointments (
          id,
          pets:pet_id (
            name,
            species:species_id ( name ),
            breed:breed_id ( name ),
            customers:customer_id ( full_name, phone )
          )
        ),
        ordered_by:users!appointment_services_ordered_by_doctor_id_fkey (
          doctor:doctors ( full_name )
        ),
        service_order_results ( id, result_text, image_urls, measurements, notes, performed_at )
      `)
      .not("ordered_by_doctor_id", "is", null)
      .order("ordered_at");

    if (roomType) {
      query = query.eq("services.specialist_room_type", roomType);
    }
    if (status) {
      query = query.eq("status", status.toUpperCase());
    } else {
      query = query.in("status", ["PENDING", "IN_PROGRESS"]);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const filtered = roomType
      ? (data ?? []).filter(row => row.services?.specialist_room_type === roomType)
      : (data ?? []);

    res.json({ ok: true, queue: filtered });
  } catch (err) {
    sendError(res, err);
  }
});

// PATCH /api/staff/service-orders/:id/start – bắt đầu thực hiện (PENDING → IN_PROGRESS)
router.patch("/service-orders/:id/start", async function startServiceOrder(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || id < 1) return res.status(400).json({ ok: false, message: "ID không hợp lệ" });

    const { data: order, error: fetchErr } = await supabase
      .from("appointment_services")
      .select("id, status, ordered_by_doctor_id")
      .eq("id", id)
      .single();

    if (fetchErr || !order) return res.status(404).json({ ok: false, message: "Không tìm thấy chỉ định" });
    if (!order.ordered_by_doctor_id) return res.status(400).json({ ok: false, message: "Đây không phải chỉ định dịch vụ chuyên khoa" });
    if (order.status !== "PENDING") return res.status(400).json({ ok: false, message: "Chỉ định phải ở trạng thái Chờ" });

    const { error } = await supabase
      .from("appointment_services")
      .update({ status: "IN_PROGRESS" })
      .eq("id", id);

    if (error) throw new Error(error.message);
    res.json({ ok: true, message: "Đã bắt đầu thực hiện" });
  } catch (err) {
    sendError(res, err);
  }
});

// POST /api/staff/service-orders/:id/result – nhập kết quả và hoàn thành
router.post("/service-orders/:id/result", async function submitServiceOrderResult(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || id < 1) return res.status(400).json({ ok: false, message: "ID không hợp lệ" });

    const staffUserId = req.auth?.user?.id;
    const { resultText, imageUrls, measurements, notes } = req.body ?? {};

    const { data: order, error: fetchErr } = await supabase
      .from("appointment_services")
      .select("id, status, appointment_id, service_id, unit_price, quantity, ordered_by_doctor_id, services(name)")
      .eq("id", id)
      .single();

    if (fetchErr || !order) return res.status(404).json({ ok: false, message: "Không tìm thấy chỉ định" });
    if (!order.ordered_by_doctor_id) return res.status(400).json({ ok: false, message: "Đây không phải chỉ định dịch vụ chuyên khoa" });
    if (order.status === "COMPLETED") return res.status(400).json({ ok: false, message: "Đã có kết quả rồi" });
    if (!resultText && (!imageUrls || imageUrls.length === 0)) {
      return res.status(400).json({ ok: false, message: "Cần nhập kết quả hoặc tải ảnh lên" });
    }

    const now = new Date().toISOString();

    // Lưu kết quả
    const { error: resultErr } = await supabase
      .from("service_order_results")
      .upsert({
        appointment_service_id: id,
        performed_by_id: staffUserId,
        result_text: resultText ?? null,
        image_urls: imageUrls ?? [],
        measurements: measurements ?? null,
        notes: notes ?? null,
        performed_at: now,
        updated_at: now,
      }, { onConflict: "appointment_service_id" });

    if (resultErr) throw new Error(resultErr.message);

    // Cập nhật trạng thái AppointmentService → COMPLETED
    const { error: statusErr } = await supabase
      .from("appointment_services")
      .update({ status: "COMPLETED" })
      .eq("id", id);

    if (statusErr) throw new Error(statusErr.message);

    // Thêm InvoiceItem vào hóa đơn của lịch hẹn
    await addSpecialistServiceToInvoice(order);

    res.json({ ok: true, message: "Đã lưu kết quả và hoàn thành dịch vụ" });
  } catch (err) {
    sendError(res, err);
  }
});

async function addSpecialistServiceToInvoice(order) {
  const unitPrice = parseFloat(order.unit_price) || 0;
  const quantity = order.quantity || 1;
  const totalPrice = unitPrice * quantity;

  // Tìm invoice của lịch hẹn
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, payment_status")
    .eq("appointment_id", order.appointment_id)
    .maybeSingle();

  if (!invoice?.id) return; // Nếu chưa có invoice thì thôi (sẽ tính khi exam-complete)

  // Kiểm tra đã có InvoiceItem cho AppointmentService này chưa
  const { data: existing } = await supabase
    .from("invoice_items")
    .select("id")
    .eq("appointment_service_id", order.id)
    .maybeSingle();

  if (existing?.id) return; // Đã có rồi, bỏ qua

  const { error: itemErr } = await supabase
    .from("invoice_items")
    .insert({
      invoice_id: invoice.id,
      service_id: order.service_id,
      appointment_service_id: order.id,
      source_type: "SERVICE",
      description: order.services?.name ?? "Dịch vụ chuyên khoa",
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
    });

  if (itemErr) throw new Error(itemErr.message);

  // Cộng dồn lại tổng hóa đơn
  if (invoice.payment_status !== "PAID") {
    const { data: items } = await supabase
      .from("invoice_items")
      .select("total_price")
      .eq("invoice_id", invoice.id);

    const subtotal = (items ?? []).reduce((sum, i) => sum + (parseFloat(i.total_price) || 0), 0);
    await supabase
      .from("invoices")
      .update({ subtotal_amount: subtotal, total_amount: subtotal, updated_at: new Date().toISOString() })
      .eq("id", invoice.id);
  }
}

module.exports = router;
