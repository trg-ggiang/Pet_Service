const { EventEmitter } = require("node:events");
const { createSupabaseQuery } = require("../helpers/supabaseQuery");

class MockPdfDocument extends EventEmitter {
  constructor() {
    super();
    this.page = { height: 841.89 };
    this.textValues = [];
  }

  registerFont() { return this; }
  addPage() { return this; }
  fillColor() { return this; }
  font() { return this; }
  fontSize() { return this; }
  moveTo() { return this; }
  lineTo() { return this; }
  strokeColor() { return this; }
  stroke() { return this; }
  rect() { return this; }
  roundedRect() { return this; }
  fill() { return this; }
  text(value) { this.textValues.push(String(value)); return this; }
  end() {
    this.emit("data", Buffer.from(this.textValues.join("\n"), "utf8"));
    this.emit("end");
  }
}

jest.mock("pdfkit", () => MockPdfDocument);

jest.mock("../../src/lib/supabaseClient", () => ({
  supabase: { from: jest.fn() },
}));

const { supabase } = require("../../src/lib/supabaseClient");
const { buildCustomerInvoicePdf } = require("../../src/services/invoicePdfService");

describe("invoicePdfService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("builds an owned invoice PDF with invoice, pet and service content", async () => {
    // Arrange
    const invoice = {
      id: 90,
      appointment_id: 30,
      subtotal_amount: 250000,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: 250000,
      payment_status: "PAID",
      created_at: "2099-07-20T10:00:00.000Z",
    };
    const appointment = {
      id: 30,
      pet_id: 20,
      doctor_id: null,
      staff_id: null,
      doctor_schedule_slot_id: null,
      appointment_type: "MEDICAL",
      requested_date: "2099-07-20",
    };
    const pet = { id: 20, name: "Milo", customer_id: 10 };
    const customer = { id: 10, full_name: "Customer Test", phone: "0901000001", address: "Hanoi" };
    const items = [{
      id: 100,
      description: "General Exam",
      quantity: 1,
      unit_price: 250000,
      total_price: 250000,
    }];
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: invoice, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: appointment, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: pet, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: customer, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: items, error: null }, { resolveMethods: ["order"] }));

    // Act
    const result = await buildCustomerInvoicePdf(invoice.id, customer.id);
    const renderedText = result.buffer.toString("utf8");

    // Assert
    expect(result.filename).toBe("customer-test-general-exam-2099-07-20.pdf");
    expect(renderedText).toContain("INV-000090");
    expect(renderedText).toContain("Customer Test");
    expect(renderedText).toContain("Milo");
    expect(renderedText).toContain("General Exam");
    expect(renderedText).toContain("250.000");
  });

  test("rejects PDF access when the pet belongs to another customer", async () => {
    // Arrange
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: { id: 90, appointment_id: 30 }, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: { id: 30, pet_id: 20 }, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: { id: 20, customer_id: 999 }, error: null }));

    // Act
    const action = () => buildCustomerInvoicePdf(90, 10);

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 403 });
  });
});
