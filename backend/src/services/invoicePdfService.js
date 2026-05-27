const fs = require("fs");
const PDFDocument = require("pdfkit");
const { supabase } = require("../lib/supabaseClient");

const STATUS_LABELS = {
  DRAFT: "Nhap",
  PENDING: "Cho thanh toan",
  PAID: "Da thanh toan",
  CANCELLED: "Da huy",
  REFUNDED: "Da hoan tien",
  UNPAID: "Chua thanh toan",
};

const PAYMENT_METHOD_LABELS = {
  CASH: "Tien mat",
  BANK_TRANSFER: "Chuyen khoan",
  VNPAY: "VNPAY",
};

function pickFontPath() {
  const candidates = [
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/calibri.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
  ];

  return candidates.find((fontPath) => fs.existsSync(fontPath)) ?? null;
}

function toNumber(value) {
  if (value === null || value === undefined) return 0;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatCurrency(value) {
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(toNumber(value))} VND`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
}

function formatDateForFilename(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown-date";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function slugifyFilenamePart(value, fallback) {
  const slug = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function getInvoiceServiceName(data) {
  return data.items[0]?.description || data.appointment.appointment_type || "dich-vu";
}

function getInvoiceServiceDate(data) {
  return data.doctorSchedule?.work_date || data.invoice.created_at;
}

function buildInvoiceFilename(data) {
  const customerName = slugifyFilenamePart(data.customer.full_name, "khach-hang");
  const serviceName = slugifyFilenamePart(getInvoiceServiceName(data), "dich-vu");
  const serviceDate = formatDateForFilename(getInvoiceServiceDate(data));
  return `${customerName}-${serviceName}-${serviceDate}.pdf`;
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseHistoryDate(value) {
  const match = String(value || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function getExpectedSourceType(serviceType) {
  const typeMap = {
    medical: "MEDICAL_VISIT",
    vaccine: "VACCINATION",
    grooming: "GROOMING",
    boarding: "BOARDING",
  };
  return typeMap[serviceType] ?? null;
}

function requireRow(result, message, statusCode = 404) {
  if (result.error) {
    const error = new Error(result.error.message);
    error.statusCode = statusCode;
    throw error;
  }

  if (!result.data) {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
  }

  return result.data;
}

async function getInvoicePdfData(invoiceId, customerId) {
  const effectiveInvoiceId = Number(invoiceId);
  const effectiveCustomerId = Number(customerId);

  if (!Number.isFinite(effectiveInvoiceId)) {
    const error = new Error("Ma hoa don khong hop le");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isFinite(effectiveCustomerId)) {
    const error = new Error("Thieu thong tin khach hang");
    error.statusCode = 401;
    throw error;
  }

  const invoice = requireRow(
    await supabase.from("invoices").select("*").eq("id", effectiveInvoiceId).maybeSingle(),
    "Khong tim thay hoa don",
  );

  const appointment = requireRow(
    await supabase
      .from("appointments")
      .select("*")
      .eq("id", invoice.appointment_id)
      .maybeSingle(),
    "Khong tim thay lich hen cua hoa don",
  );

  const pet = requireRow(
    await supabase.from("pets").select("*").eq("id", appointment.pet_id).maybeSingle(),
    "Khong tim thay thu cung cua hoa don",
  );

  if (Number(pet.customer_id) !== effectiveCustomerId) {
    const error = new Error("Ban khong co quyen tai hoa don nay");
    error.statusCode = 403;
    throw error;
  }

  const [
    customerResult,
    itemsResult,
    doctorResult,
    staffResult,
    doctorScheduleResult,
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, phone, address")
      .eq("id", effectiveCustomerId)
      .maybeSingle(),
    supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", effectiveInvoiceId)
      .order("id", { ascending: true }),
    appointment.doctor_id
      ? supabase
          .from("doctors")
          .select("id, full_name")
          .eq("id", appointment.doctor_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    appointment.staff_id
      ? supabase
          .from("staffs")
          .select("id, full_name")
          .eq("id", appointment.staff_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    appointment.doctor_schedule_id
      ? supabase
          .from("doctor_schedules")
          .select("id, work_date")
          .eq("id", appointment.doctor_schedule_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const customer = requireRow(customerResult, "Khong tim thay khach hang");
  if (itemsResult.error) {
    const error = new Error(itemsResult.error.message);
    error.statusCode = 500;
    throw error;
  }
  if (doctorResult.error) throw new Error(doctorResult.error.message);
  if (staffResult.error) throw new Error(staffResult.error.message);
  if (doctorScheduleResult.error) throw new Error(doctorScheduleResult.error.message);

  return {
    invoice,
    items: itemsResult.data ?? [],
    appointment,
    pet,
    customer,
    provider: doctorResult.data ?? staffResult.data ?? null,
    doctorSchedule: doctorScheduleResult.data ?? null,
  };
}

async function getLatestCustomerInvoiceId(customerId) {
  const effectiveCustomerId = Number(customerId);
  if (!Number.isFinite(effectiveCustomerId)) {
    const error = new Error("Thieu thong tin khach hang");
    error.statusCode = 401;
    throw error;
  }

  const petsResult = await supabase
    .from("pets")
    .select("id")
    .eq("customer_id", effectiveCustomerId);

  if (petsResult.error) throw new Error(petsResult.error.message);

  const petIds = (petsResult.data ?? []).map((pet) => pet.id);
  if (petIds.length === 0) {
    const error = new Error("Khach hang chua co hoa don");
    error.statusCode = 404;
    throw error;
  }

  const appointmentsResult = await supabase
    .from("appointments")
    .select("id")
    .in("pet_id", petIds);

  if (appointmentsResult.error) throw new Error(appointmentsResult.error.message);

  const appointmentIds = (appointmentsResult.data ?? []).map((appointment) => appointment.id);
  if (appointmentIds.length === 0) {
    const error = new Error("Khach hang chua co hoa don");
    error.statusCode = 404;
    throw error;
  }

  const invoiceResult = await supabase
    .from("invoices")
    .select("id")
    .in("appointment_id", appointmentIds)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const invoice = requireRow(invoiceResult, "Khach hang chua co hoa don");
  return invoice.id;
}

async function findMatchingCustomerInvoiceId(customerId, criteria) {
  const effectiveCustomerId = Number(customerId);
  if (!Number.isFinite(effectiveCustomerId)) {
    const error = new Error("Thieu thong tin khach hang");
    error.statusCode = 401;
    throw error;
  }

  const petsResult = await supabase
    .from("pets")
    .select("id, name")
    .eq("customer_id", effectiveCustomerId);

  if (petsResult.error) throw new Error(petsResult.error.message);

  const pets = petsResult.data ?? [];
  const requestedPet = normalizeSearchText(criteria.petName);
  const candidatePets = requestedPet
    ? pets.filter((pet) => normalizeSearchText(pet.name) === requestedPet)
    : pets;
  const petIds = (candidatePets.length ? candidatePets : pets).map((pet) => pet.id);

  if (petIds.length === 0) {
    const error = new Error("Khach hang chua co hoa don");
    error.statusCode = 404;
    throw error;
  }

  const appointmentsResult = await supabase
    .from("appointments")
    .select("id, pet_id, appointment_type, created_at, doctor_schedule_id")
    .in("pet_id", petIds);

  if (appointmentsResult.error) throw new Error(appointmentsResult.error.message);

  const appointments = appointmentsResult.data ?? [];
  const appointmentIds = appointments.map((appointment) => appointment.id);
  if (appointmentIds.length === 0) {
    const error = new Error("Khong tim thay lich hen phu hop voi hoa don");
    error.statusCode = 404;
    throw error;
  }

  const invoicesResult = await supabase
    .from("invoices")
    .select("id, appointment_id, created_at")
    .in("appointment_id", appointmentIds);

  if (invoicesResult.error) throw new Error(invoicesResult.error.message);

  const invoices = invoicesResult.data ?? [];
  if (invoices.length === 0) {
    const error = new Error("Khong tim thay hoa don phu hop");
    error.statusCode = 404;
    throw error;
  }

  const invoiceIds = invoices.map((invoice) => invoice.id);
  const itemsResult = await supabase
    .from("invoice_items")
    .select("invoice_id, source_type, description")
    .in("invoice_id", invoiceIds);

  if (itemsResult.error) throw new Error(itemsResult.error.message);

  const itemsByInvoiceId = new Map();
  (itemsResult.data ?? []).forEach((item) => {
    const currentItems = itemsByInvoiceId.get(item.invoice_id) ?? [];
    currentItems.push(item);
    itemsByInvoiceId.set(item.invoice_id, currentItems);
  });

  const expectedSourceType = getExpectedSourceType(criteria.serviceType);
  const requestedService = normalizeSearchText(criteria.serviceName);
  const requestedDate = parseHistoryDate(criteria.date);
  const appointmentById = new Map(
    appointments.map((appointment) => [appointment.id, appointment]),
  );

  const scoredInvoices = invoices.map((invoice) => {
    const appointment = appointmentById.get(invoice.appointment_id);
    const items = itemsByInvoiceId.get(invoice.id) ?? [];
    let score = 0;

    if (appointment?.pet_id && petIds.includes(appointment.pet_id)) score += 40;
    if (expectedSourceType && items.some((item) => item.source_type === expectedSourceType)) score += 80;

    if (requestedService) {
      const serviceWords = requestedService.split(/\s+/).filter((word) => word.length >= 3);
      const descriptionText = normalizeSearchText(
        items.map((item) => item.description).join(" "),
      );
      score += serviceWords.filter((word) => descriptionText.includes(word)).length * 12;
    }

    if (requestedDate && invoice.created_at?.startsWith(requestedDate)) score += 10;

    return {
      invoice,
      score,
    };
  });

  scoredInvoices.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    return new Date(right.invoice.created_at).getTime() - new Date(left.invoice.created_at).getTime();
  });

  const bestMatch = scoredInvoices[0];
  if (!bestMatch || bestMatch.score <= 0) {
    const error = new Error("Khong tim thay hoa don phu hop");
    error.statusCode = 404;
    throw error;
  }

  return bestMatch.invoice.id;
}

function drawKeyValue(doc, label, value, x, y, width = 230) {
  doc.font(doc.invoiceFonts.regular).fontSize(9).fillColor("#64748b").text(label, x, y, { width });
  doc.font(doc.invoiceFonts.bold).fontSize(10).fillColor("#0f172a").text(value || "-", x, y + 14, { width });
}

function drawTableHeader(doc, y) {
  doc.roundedRect(40, y, 515, 28, 4).fill("#ecfeff");
  doc.fillColor("#0f172a").font(doc.invoiceFonts.bold).fontSize(9);
  doc.text("Mo ta", 52, y + 9, { width: 220 });
  doc.text("SL", 292, y + 9, { width: 40, align: "right" });
  doc.text("Don gia", 350, y + 9, { width: 80, align: "right" });
  doc.text("Thanh tien", 452, y + 9, { width: 90, align: "right" });
}

function generateInvoicePdfBuffer(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
    const chunks = [];
    const fontPath = pickFontPath();

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    if (fontPath) {
      doc.registerFont("Regular", fontPath);
      doc.registerFont("Bold", fontPath);
    }
    doc.invoiceFonts = {
      regular: fontPath ? "Regular" : "Helvetica",
      bold: fontPath ? "Bold" : "Helvetica-Bold",
    };

    const { invoice, items, appointment, pet, customer, provider } = data;
    const invoiceCode = `INV-${String(invoice.id).padStart(6, "0")}`;

    doc.rect(0, 0, 595.28, 115).fill("#0891b2");
    doc.fillColor("#ffffff").font(doc.invoiceFonts.bold).fontSize(22).text("HOA DON DICH VU", 40, 34);
    doc.font(doc.invoiceFonts.regular).fontSize(10).text("Pet Service", 40, 64);
    doc.font(doc.invoiceFonts.bold).fontSize(12).text(invoiceCode, 390, 38, { width: 165, align: "right" });
    doc.font(doc.invoiceFonts.regular).fontSize(9).text(`Ngay xuat: ${formatDate(new Date())}`, 390, 59, {
      width: 165,
      align: "right",
    });

    doc.fillColor("#0f172a");
    drawKeyValue(doc, "Khach hang", customer.full_name, 40, 145);
    drawKeyValue(doc, "So dien thoai", customer.phone, 300, 145);
    drawKeyValue(doc, "Dia chi", customer.address, 40, 190, 500);

    doc.moveTo(40, 238).lineTo(555, 238).strokeColor("#e2e8f0").stroke();
    drawKeyValue(doc, "Thu cung", pet.name, 40, 258);
    drawKeyValue(doc, "Loai lich hen", appointment.appointment_type, 190, 258);
    drawKeyValue(doc, "Nguoi phu trach", provider?.full_name ?? "-", 340, 258);
    drawKeyValue(doc, "Ngay tao hoa don", formatDate(invoice.created_at), 40, 303);
    drawKeyValue(
      doc,
      "Trang thai thanh toan",
      STATUS_LABELS[invoice.payment_status] ?? invoice.payment_status,
      190,
      303,
    );
    drawKeyValue(
      doc,
      "Phuong thuc",
      PAYMENT_METHOD_LABELS[invoice.payment_method] ?? invoice.payment_method ?? "-",
      340,
      303,
    );

    let y = 372;
    drawTableHeader(doc, y);
    y += 38;

    const rows = items.length
      ? items
      : [
          {
            description: "Dich vu",
            quantity: 1,
            unit_price: invoice.total_amount,
            total_price: invoice.total_amount,
          },
        ];

    rows.forEach((item, index) => {
      if (y > 690) {
        doc.addPage();
        y = 60;
        drawTableHeader(doc, y);
        y += 38;
      }

      if (index % 2 === 0) {
        doc.rect(40, y - 7, 515, 32).fill("#f8fafc");
      }

      doc.fillColor("#0f172a").font(doc.invoiceFonts.regular).fontSize(9);
      doc.text(item.description || "Dich vu", 52, y, { width: 220 });
      doc.text(String(item.quantity ?? 1), 292, y, { width: 40, align: "right" });
      doc.text(formatCurrency(item.unit_price), 350, y, { width: 80, align: "right" });
      doc.text(formatCurrency(item.total_price), 452, y, { width: 90, align: "right" });
      y += 34;
    });

    y += 14;
    doc.moveTo(320, y).lineTo(555, y).strokeColor("#e2e8f0").stroke();
    y += 16;

    const totals = [
      ["Tam tinh", invoice.subtotal_amount],
      ["Giam gia", invoice.discount_amount],
      ["Thue", invoice.tax_amount],
    ];

    totals.forEach(([label, value]) => {
      doc.fillColor("#475569").font(doc.invoiceFonts.regular).fontSize(10).text(label, 350, y, { width: 90 });
      doc.fillColor("#0f172a").font(doc.invoiceFonts.bold).fontSize(10).text(formatCurrency(value), 445, y, {
        width: 100,
        align: "right",
      });
      y += 20;
    });

    doc.roundedRect(330, y + 4, 225, 34, 4).fill("#ecfeff");
    doc.fillColor("#0f172a").font(doc.invoiceFonts.bold).fontSize(11).text("Tong cong", 350, y + 14, { width: 90 });
    doc.fillColor("#0891b2").font(doc.invoiceFonts.bold).fontSize(12).text(formatCurrency(invoice.total_amount), 445, y + 13, {
      width: 100,
      align: "right",
    });

    const footerY = 770;
    doc.fillColor("#64748b").font(doc.invoiceFonts.regular).fontSize(8);
    doc.text("Cam on quy khach da su dung dich vu Pet Service.", 40, footerY, {
      width: 515,
      align: "center",
    });

    doc.end();
  });
}

async function buildCustomerInvoicePdf(invoiceId, customerId) {
  const data = await getInvoicePdfData(invoiceId, customerId);
  const buffer = await generateInvoicePdfBuffer(data);
  return {
    buffer,
    filename: buildInvoiceFilename(data),
  };
}

async function buildLatestCustomerInvoicePdf(customerId) {
  const invoiceId = await getLatestCustomerInvoiceId(customerId);
  return buildCustomerInvoicePdf(invoiceId, customerId);
}

async function buildMatchingCustomerInvoicePdf(customerId, criteria) {
  const invoiceId = await findMatchingCustomerInvoiceId(customerId, criteria);
  return buildCustomerInvoicePdf(invoiceId, customerId);
}

module.exports = {
  buildCustomerInvoicePdf,
  buildLatestCustomerInvoicePdf,
  buildMatchingCustomerInvoicePdf,
};
