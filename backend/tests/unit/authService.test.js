const bcrypt = require("bcryptjs");
const { createSupabaseQuery } = require("../helpers/supabaseQuery");
const {
  activeCustomerUser,
  customerProfile,
  lockedCustomerUser,
  registerInput,
} = require("../mocks/auth.mock");

jest.mock("../../src/lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("../../src/lib/jwt", () => ({
  signAuthToken: jest.fn(() => "signed-test-token"),
}));

jest.mock("../../src/services/emailService", () => ({
  sendTemplateEmail: jest.fn(),
}));

const { supabase } = require("../../src/lib/supabaseClient");
const { signAuthToken } = require("../../src/lib/jwt");
const { sendTemplateEmail } = require("../../src/services/emailService");
const {
  getUserAuthContext,
  loginWithCredentials,
  registerCustomer,
  requestPasswordReset,
  resetPassword,
  verifyPasswordResetCode,
} = require("../../src/services/authService");

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loginWithCredentials", () => {
    test("returns a signed customer session when credentials are valid", async () => {
      // Arrange
      supabase.from
        .mockReturnValueOnce(createSupabaseQuery({ data: activeCustomerUser, error: null }))
        .mockReturnValueOnce(createSupabaseQuery({ data: customerProfile, error: null }));

      // Act
      const result = await loginWithCredentials(" CUSTOMER@example.test ", "PetService@123");

      // Assert
      expect(result).toEqual({
        token: "signed-test-token",
        user: expect.objectContaining({
          id: activeCustomerUser.id,
          email: activeCustomerUser.email,
          role: "customer",
          status: "active",
          fullName: customerProfile.full_name,
          customerId: customerProfile.id,
        }),
      });
      expect(signAuthToken).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: String(activeCustomerUser.id),
          role: "customer",
          email: activeCustomerUser.email,
          authVersion: 0,
        }),
      );
    });

    test("rejects missing email or password before querying the database", async () => {
      // Arrange
      const emptyEmail = "";

      // Act
      const action = () => loginWithCredentials(emptyEmail, "PetService@123");

      // Assert
      await expect(action()).rejects.toThrow("email");
      expect(supabase.from).not.toHaveBeenCalled();
    });

    test("rejects locked users before password comparison succeeds", async () => {
      // Arrange
      supabase.from.mockReturnValueOnce(
        createSupabaseQuery({ data: lockedCustomerUser, error: null }),
      );

      // Act
      const action = () => loginWithCredentials("locked@example.test", "PetService@123");

      // Assert
      await expect(action()).rejects.toThrow("khóa");
      expect(signAuthToken).not.toHaveBeenCalled();
    });

    test("rejects an incorrect password", async () => {
      // Arrange
      supabase.from.mockReturnValueOnce(
        createSupabaseQuery({ data: activeCustomerUser, error: null }),
      );

      // Act
      const action = () => loginWithCredentials("customer@example.test", "wrong-password");

      // Assert
      await expect(action()).rejects.toThrow("khẩu");
      expect(signAuthToken).not.toHaveBeenCalled();
    });
  });

  describe("registerCustomer", () => {
    test("creates a customer account and returns a signed session", async () => {
      // Arrange
      const insertedUser = {
        id: 20,
        email: registerInput.email,
        role: "CUSTOMER",
        status: "ACTIVE",
        auth_version: 0,
      };
      const insertedCustomer = {
        id: 30,
        full_name: registerInput.name,
        phone: registerInput.phone,
        address: registerInput.address,
        user_id: insertedUser.id,
      };

      supabase.from
        .mockReturnValueOnce(createSupabaseQuery({ data: null, error: null }))
        .mockReturnValueOnce(createSupabaseQuery({ data: insertedUser, error: null }))
        .mockReturnValueOnce(createSupabaseQuery({ data: insertedCustomer, error: null }));

      // Act
      const result = await registerCustomer(registerInput);

      // Assert
      expect(result).toEqual({
        token: "signed-test-token",
        user: expect.objectContaining({
          id: insertedUser.id,
          email: insertedUser.email,
          role: "customer",
          status: "active",
          fullName: insertedCustomer.full_name,
          customerId: insertedCustomer.id,
        }),
      });
      expect(signAuthToken).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: String(insertedUser.id),
          role: "customer",
          email: insertedUser.email,
        }),
      );
    });

    test("rejects duplicate customer emails", async () => {
      // Arrange
      supabase.from.mockReturnValueOnce(
        createSupabaseQuery({ data: { id: 99 }, error: null }),
      );

      // Act
      const action = () => registerCustomer(registerInput);

      // Assert
      await expect(action()).rejects.toThrow("Email");
      expect(supabase.from).toHaveBeenCalledTimes(1);
    });

    test("rejects weak passwords before hashing", async () => {
      // Arrange
      const hashSpy = jest.spyOn(bcrypt, "hash");
      const weakInput = {
        ...registerInput,
        password: "123",
      };

      // Act
      const action = () => registerCustomer(weakInput);

      // Assert
      await expect(action()).rejects.toThrow("6");
      expect(hashSpy).not.toHaveBeenCalled();
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe("getUserAuthContext", () => {
    test("returns doctor context when the user role is doctor", async () => {
      // Arrange
      const doctorUser = {
        id: 40,
        email: "doctor@example.test",
        role: "DOCTOR",
        status: "ACTIVE",
      };
      const doctorProfile = {
        id: 400,
        full_name: "Dr. Nguyen",
        room_name: "Room 01",
        user_id: doctorUser.id,
      };
      supabase.from.mockReturnValueOnce(
        createSupabaseQuery({ data: doctorProfile, error: null }),
      );

      // Act
      const result = await getUserAuthContext(doctorUser);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          id: doctorUser.id,
          role: "doctor",
          fullName: doctorProfile.full_name,
          doctorId: doctorProfile.id,
          roomName: doctorProfile.room_name,
        }),
      );
    });

    test("returns staff context when the user role is staff", async () => {
      // Arrange
      const staffUser = {
        id: 50,
        email: "staff@example.test",
        role: "STAFF",
        status: "ACTIVE",
      };
      const staffProfile = {
        id: 500,
        full_name: "Le Staff",
        phone: "0903000003",
        address: "2 Tran Hung Dao",
        user_id: staffUser.id,
      };
      supabase.from.mockReturnValueOnce(
        createSupabaseQuery({ data: staffProfile, error: null }),
      );

      // Act
      const result = await getUserAuthContext(staffUser);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          id: staffUser.id,
          role: "staff",
          fullName: staffProfile.full_name,
          staffId: staffProfile.id,
          phone: staffProfile.phone,
          address: staffProfile.address,
        }),
      );
    });

    test("returns admin context without querying a profile table", async () => {
      // Arrange
      const adminUser = {
        id: 60,
        email: "admin@example.test",
        role: "ADMIN",
        status: "ACTIVE",
      };

      // Act
      const result = await getUserAuthContext(adminUser);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          id: adminUser.id,
          role: "admin",
          fullName: expect.stringContaining("trị"),
        }),
      );
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe("password reset", () => {
    test("does not reveal whether an email exists when requesting a reset", async () => {
      // Arrange
      supabase.from.mockReturnValueOnce(createSupabaseQuery({ data: null, error: null }));

      // Act
      const result = await requestPasswordReset("missing@example.test");

      // Assert
      expect(result).toEqual({});
      expect(sendTemplateEmail).not.toHaveBeenCalled();
    });

    test("returns a development reset code for an active user when email sending is disabled", async () => {
      // Arrange
      sendTemplateEmail.mockResolvedValueOnce({ sent: false });
      supabase.from
        .mockReturnValueOnce(
          createSupabaseQuery({
            data: { id: activeCustomerUser.id, email: activeCustomerUser.email, status: "ACTIVE" },
            error: null,
          }),
        )
        .mockReturnValueOnce(createSupabaseQuery({ data: null, error: null }))
        .mockReturnValueOnce(createSupabaseQuery({ data: null, error: null }));

      // Act
      const result = await requestPasswordReset(activeCustomerUser.email);

      // Assert
      expect(result.devCode).toMatch(/^\d{6}$/);
      expect(sendTemplateEmail).toHaveBeenCalledWith(
        "password_reset",
        activeCustomerUser.email,
        expect.objectContaining({ code: result.devCode }),
      );
    });

    test("verifies a valid reset code against the latest unused tokens", async () => {
      // Arrange
      const code = "123456";
      const tokenQuery = createSupabaseQuery();
      tokenQuery.limit.mockResolvedValueOnce({
        data: [
          {
            id: 70,
            code_hash: await bcrypt.hash(code, 4),
            expires_at: new Date(Date.now() + 60_000).toISOString(),
          },
        ],
        error: null,
      });

      supabase.from
        .mockReturnValueOnce(
          createSupabaseQuery({
            data: { id: activeCustomerUser.id, auth_version: 0 },
            error: null,
          }),
        )
        .mockReturnValueOnce(tokenQuery);

      // Act
      await verifyPasswordResetCode(activeCustomerUser.email, code);

      // Assert
      expect(tokenQuery.limit).toHaveBeenCalledWith(5);
    });

    test("resets a password and increments auth_version when the code is valid", async () => {
      // Arrange
      const code = "654321";
      const tokenQuery = createSupabaseQuery();
      const userUpdateQuery = createSupabaseQuery({ data: null, error: null });
      const tokenUpdateQuery = createSupabaseQuery({ data: null, error: null });

      tokenQuery.limit.mockResolvedValueOnce({
        data: [
          {
            id: 80,
            code_hash: await bcrypt.hash(code, 4),
            expires_at: new Date(Date.now() + 60_000).toISOString(),
          },
        ],
        error: null,
      });

      supabase.from
        .mockReturnValueOnce(
          createSupabaseQuery({
            data: { id: activeCustomerUser.id, auth_version: 3 },
            error: null,
          }),
        )
        .mockReturnValueOnce(tokenQuery)
        .mockReturnValueOnce(userUpdateQuery)
        .mockReturnValueOnce(tokenUpdateQuery);

      // Act
      await resetPassword(activeCustomerUser.email, code, "NewPassword@123");

      // Assert
      expect(userUpdateQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          auth_version: 4,
          updated_at: expect.any(String),
        }),
      );
      expect(userUpdateQuery.eq).toHaveBeenCalledWith("id", activeCustomerUser.id);
      expect(tokenUpdateQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          used_at: expect.any(String),
        }),
      );
      expect(tokenUpdateQuery.eq).toHaveBeenCalledWith("user_id", activeCustomerUser.id);
    });

    test("rejects reset attempts with weak new passwords before token lookup", async () => {
      // Arrange
      const weakPassword = "1234567";

      // Act
      const action = () => resetPassword(activeCustomerUser.email, "123456", weakPassword);

      // Assert
      await expect(action()).rejects.toThrow("8");
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });
});
