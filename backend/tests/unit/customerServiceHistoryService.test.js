const { createSupabaseQuery } = require("../helpers/supabaseQuery");
const { customerRow, petRow } = require("../mocks/customerCore.mock");

jest.mock("../../src/lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = require("../../src/lib/supabaseClient");
const {
  listCustomerServiceHistory,
  listCustomerServiceHistoryView,
} = require("../../src/services/customer/customerServiceHistoryService");

describe("customerServiceHistoryService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns an empty list when the customer has no pets", async () => {
    // Arrange
    supabase.from.mockReturnValueOnce(
      createSupabaseQuery({ data: [], error: null }, { resolveMethods: ["eq"] }),
    );

    // Act
    const history = await listCustomerServiceHistory(customerRow.id);

    // Assert
    expect(history).toEqual([]);
  });

  test("builds and filters service history records from paid invoices", async () => {
    // Arrange
    const appointment = {
      id: 200,
      pet_id: petRow.id,
      appointment_type: "MEDICAL",
      doctor_id: 300,
      staff_id: null,
      requested_date: "2026-06-15T09:00:00.000Z",
    };
    const invoice = {
      id: 400,
      appointment_id: appointment.id,
      total_amount: 250000,
      payment_status: "PAID",
      transaction_code: "TXN-1",
      status: "PAID",
      created_at: "2026-06-15T10:00:00.000Z",
    };
    const invoiceItem = {
      id: 500,
      invoice_id: invoice.id,
      source_type: "MEDICAL",
      description: "Kham tong quat",
      quantity: 1,
      unit_price: 250000,
      total_price: 250000,
    };
    const medicalVisit = {
      id: 600,
      appointment_id: appointment.id,
      symptoms: "Itchy skin",
      clinical_exam: JSON.stringify({ chiefComplaint: "Itchy skin" }),
      diagnosis_note: "Mild dermatitis",
      next_visit_date: null,
    };

    supabase.from
      .mockReturnValueOnce(
        createSupabaseQuery({ data: [petRow], error: null }, { resolveMethods: ["eq"] }),
      )
      .mockReturnValueOnce(
        createSupabaseQuery({ data: [appointment], error: null }, { resolveMethods: ["in"] }),
      )
      .mockReturnValueOnce(
        createSupabaseQuery({ data: [invoice], error: null }, { resolveMethods: ["order"] }),
      )
      .mockReturnValueOnce(
        createSupabaseQuery({ data: [{ id: 300, full_name: "Dr. Nguyen" }], error: null }, { resolveMethods: ["in"] }),
      )
      .mockReturnValueOnce(
        createSupabaseQuery({ data: [invoiceItem], error: null }, { resolveMethods: ["order"] }),
      )
      .mockReturnValueOnce(
        createSupabaseQuery({ data: [medicalVisit], error: null }, { resolveMethods: ["in"] }),
      )
      .mockReturnValueOnce(
        createSupabaseQuery({ data: [], error: null }, { resolveMethods: ["in"] }),
      )
      .mockReturnValueOnce(
        createSupabaseQuery({ data: [], error: null }, { resolveMethods: ["in"] }),
      )
      .mockReturnValueOnce(
        createSupabaseQuery({ data: [], error: null }, { resolveMethods: ["in"] }),
      )
      .mockReturnValueOnce(
        createSupabaseQuery({ data: [], error: null }, { resolveMethods: ["in"] }),
      )
      .mockReturnValueOnce(
        createSupabaseQuery({ data: [], error: null }, { resolveMethods: ["in"] }),
      );

    // Act
    const result = await listCustomerServiceHistoryView(customerRow.id, { type: "medical" });

    // Assert
    expect(result.summary).toEqual(
      expect.objectContaining({
        total: 1,
        filtered: 1,
      }),
    );
    expect(result.history[0]).toEqual(
      expect.objectContaining({
        invoiceId: invoice.id,
        appointmentId: appointment.id,
        service: invoiceItem.description,
        pet: petRow.name,
        type: "medical",
        staff: "Dr. Nguyen",
        details: medicalVisit.diagnosis_note,
        status: "completed",
      }),
    );
  });

  test("rejects missing customer ids before querying history", async () => {
    // Arrange
    const customerId = undefined;

    // Act
    const action = () => listCustomerServiceHistory(customerId);

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 401 });
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
