const { createSupabaseQuery } = require("../helpers/supabaseQuery");
const { createPetInput, customerRow, petRow } = require("../mocks/customerCore.mock");

jest.mock("../../src/lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = require("../../src/lib/supabaseClient");
const {
  createCustomerPet,
  getCustomerPetDashboard,
  getPetDetail,
  updateCustomerPet,
} = require("../../src/services/customerPetsService");

describe("customerPetsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabase.from.mockReset();
  });

  test("creates a customer pet with normalized optional fields", async () => {
    // Arrange
    const insertQuery = createSupabaseQuery({
      data: { ...petRow, name: createPetInput.name },
      error: null,
    });
    supabase.from.mockReturnValueOnce(insertQuery);

    // Act
    const pet = await createCustomerPet(createPetInput, customerRow.id);

    // Assert
    expect(pet.name).toBe(createPetInput.name);
    expect(insertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_id: customerRow.id,
        species_id: createPetInput.speciesId,
        breed_id: createPetInput.breedId,
        name: createPetInput.name,
        color: null,
        allergies: null,
        chronic_diseases: null,
      }),
    );
  });

  test("rejects pet creation when customer id is missing", async () => {
    // Arrange
    const customerId = undefined;

    // Act
    const action = () => createCustomerPet(createPetInput, customerId);

    // Assert
    await expect(action()).rejects.toThrow();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test("rejects pet creation when the pet name is empty", async () => {
    // Arrange
    const input = { ...createPetInput, name: "   " };

    // Act
    const action = () => createCustomerPet(input, customerRow.id);

    // Assert
    await expect(action()).rejects.toThrow();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test("rejects viewing a pet owned by another customer", async () => {
    // Arrange
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: petRow, error: null }))
      .mockReturnValueOnce(
        createSupabaseQuery({ data: [], error: null }, { resolveMethods: ["order"] }),
      );

    // Act
    const action = () => getPetDetail(petRow.id, 999);

    // Assert
    await expect(action()).rejects.toThrow();
  });

  test("builds pet dashboard summaries with latest vaccination and medical visit", async () => {
    // Arrange
    const species = { id: 1, name: "Dog", description: null, care_instruction: null };
    const breed = { id: 11, species_id: 1, name: "Poodle", description: null };
    const appointment = {
      id: 200,
      pet_id: petRow.id,
      appointment_type: "MEDICAL",
      status: "COMPLETED",
      created_at: "2026-06-15T09:00:00.000Z",
      updated_at: "2026-06-15T10:00:00.000Z",
    };
    const vaccination = {
      id: 300,
      pet_id: petRow.id,
      appointment_id: appointment.id,
      vaccine_name: "Rabies",
      date_given: "2026-06-10",
      next_due_date: "2026-12-10",
      note: "Annual shot",
    };
    const medicalVisit = {
      id: 400,
      appointment_id: appointment.id,
      symptoms: "Itching",
      clinical_exam: "Skin redness",
      diagnosis_note: "Dermatitis",
      next_visit_date: "2026-07-01",
      created_at: "2026-06-15T09:30:00.000Z",
      updated_at: "2026-06-15T10:00:00.000Z",
    };

    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: customerRow, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [petRow], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [species], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [breed], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [vaccination], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [appointment], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [medicalVisit], error: null }));

    // Act
    const dashboard = await getCustomerPetDashboard(customerRow.id);

    // Assert
    expect(dashboard.customer).toEqual(customerRow);
    expect(dashboard.pets).toEqual([
      expect.objectContaining({
        id: petRow.id,
        species: species.name,
        breed: breed.name,
        latestVaccination: expect.objectContaining({
          vaccineName: vaccination.vaccine_name,
          nextDueDate: vaccination.next_due_date,
        }),
        latestMedicalVisit: expect.objectContaining({
          symptoms: medicalVisit.symptoms,
          diagnosisNote: medicalVisit.diagnosis_note,
        }),
      }),
    ]);
  });

  test("returns pet detail with invoice items grouped by invoice", async () => {
    // Arrange
    const appointment = {
      id: 200,
      pet_id: petRow.id,
      appointment_type: "MEDICAL",
      status: "COMPLETED",
      created_at: "2026-06-15T09:00:00.000Z",
      updated_at: "2026-06-15T10:00:00.000Z",
    };
    const invoice = {
      id: 500,
      appointment_id: appointment.id,
      subtotal_amount: 250000,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: 250000,
      payment_method: "cash",
      payment_status: "PAID",
      transaction_code: "TX-500",
      paid_at: "2026-06-15T10:30:00.000Z",
      status: "ISSUED",
      created_at: "2026-06-15T10:00:00.000Z",
      updated_at: "2026-06-15T10:30:00.000Z",
    };
    const invoiceItem = {
      id: 501,
      invoice_id: invoice.id,
      source_type: "SERVICE",
      description: "General exam",
      quantity: 1,
      unit_price: 250000,
      total_price: 250000,
    };

    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: petRow, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [appointment], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [invoice], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [invoiceItem], error: null }));

    // Act
    const detail = await getPetDetail(petRow.id, customerRow.id);

    // Assert
    expect(detail.invoices).toEqual([
      expect.objectContaining({
        id: invoice.id,
        items: [invoiceItem],
      }),
    ]);
  });

  test("updates a pet only when it belongs to the customer", async () => {
    // Arrange
    const updateQuery = createSupabaseQuery({
      data: { ...petRow, name: "Milo Updated" },
      error: null,
    });
    supabase.from.mockReturnValueOnce(updateQuery);

    // Act
    const pet = await updateCustomerPet(petRow.id, {
      ...createPetInput,
      name: "Milo Updated",
    }, customerRow.id);

    // Assert
    expect(pet.name).toBe("Milo Updated");
    expect(updateQuery.eq).toHaveBeenCalledWith("id", petRow.id);
    expect(updateQuery.eq).toHaveBeenCalledWith("customer_id", customerRow.id);
  });

  test("returns not found when update ownership check does not match", async () => {
    // Arrange
    supabase.from.mockReturnValueOnce(createSupabaseQuery({ data: null, error: null }));

    // Act
    const action = () => updateCustomerPet(petRow.id, createPetInput, customerRow.id);

    // Assert
    await expect(action()).rejects.toThrow();
  });
});
