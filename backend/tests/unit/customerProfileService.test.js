const { createSupabaseQuery } = require("../helpers/supabaseQuery");
const { customerRow } = require("../mocks/customerCore.mock");

jest.mock("../../src/lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = require("../../src/lib/supabaseClient");
const {
  getCustomerProfile,
  updateCustomerProfile,
} = require("../../src/services/customer/customerProfileService");

describe("customerProfileService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("maps a customer profile with derived age and read-only email", async () => {
    // Arrange
    supabase.from.mockReturnValueOnce(createSupabaseQuery({ data: customerRow, error: null }));

    // Act
    const profile = await getCustomerProfile(customerRow.id);

    // Assert
    expect(profile).toEqual(
      expect.objectContaining({
        id: customerRow.id,
        userId: customerRow.user_id,
        fullName: customerRow.full_name,
        email: customerRow.users.email,
        phone: customerRow.phone,
        address: customerRow.address,
        gender: customerRow.gender,
      }),
    );
    expect(profile.age).toEqual(expect.any(Number));
  });

  test("updates allowed customer profile fields and ignores email input", async () => {
    // Arrange
    const updateQuery = createSupabaseQuery({
      data: {
        ...customerRow,
        full_name: "Updated Name",
        phone: "0901888999",
        address: "New Address",
        gender: "OTHER",
      },
      error: null,
    });
    supabase.from.mockReturnValueOnce(updateQuery);

    // Act
    const profile = await updateCustomerProfile(customerRow.id, {
      fullName: " Updated Name ",
      phone: "0901888999",
      address: "New Address",
      dateOfBirth: "1990-02-18",
      gender: "OTHER",
      email: "changed@example.test",
    });

    // Assert
    expect(updateQuery.update).toHaveBeenCalledWith({
      full_name: "Updated Name",
      phone: "0901888999",
      address: "New Address",
      date_of_birth: "1990-02-18",
      gender: "OTHER",
    });
    expect(profile.email).toBe(customerRow.users.email);
  });

  test("rejects an empty full name before updating", async () => {
    // Arrange
    const input = { fullName: "   " };

    // Act
    const action = () => updateCustomerProfile(customerRow.id, input);

    // Assert
    await expect(action()).rejects.toThrow();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test("rejects future dates of birth", async () => {
    // Arrange
    const input = { fullName: "Nguyen Van Minh", dateOfBirth: "2999-01-01" };

    // Act
    const action = () => updateCustomerProfile(customerRow.id, input);

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 400 });
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
