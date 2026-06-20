const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));

jest.mock("nodemailer", () => ({
  createTransport: (...args) => mockCreateTransport(...args),
}));

jest.mock("../../src/services/settingsService", () => ({
  getStoredSetting: jest.fn(),
  saveStoredSetting: jest.fn(),
}));

jest.mock("../../src/lib/supabaseClient", () => ({
  supabase: { from: jest.fn() },
}));

const { getStoredSetting, saveStoredSetting } = require("../../src/services/settingsService");
const {
  getEmailTemplates,
  safeSendTemplateEmail,
  sendCustomEmail,
  sendTemplateEmail,
  updateEmailTemplates,
} = require("../../src/services/emailService");

describe("emailService", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SMTP_USER = "sender@example.test";
    process.env.SMTP_APP_PASSWORD = "test app password";
    process.env.EMAIL_FROM = "Pet Service <sender@example.test>";
    process.env.SMTP_HOST = "smtp.example.test";
    process.env.SMTP_PORT = "465";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("merges stored email template fields with defaults", async () => {
    // Arrange
    getStoredSetting.mockResolvedValueOnce({
      appointment_confirmation: { subject: "Appointment {{appointmentCode}}" },
    });

    // Act
    const templates = await getEmailTemplates();

    // Assert
    expect(templates.appointment_confirmation.subject).toBe("Appointment {{appointmentCode}}");
    expect(templates.appointment_confirmation.heading).toEqual(expect.any(String));
    expect(templates.custom).toEqual(expect.objectContaining({ subject: expect.any(String) }));
  });

  test("persists only known template keys", async () => {
    // Arrange
    getStoredSetting.mockResolvedValueOnce({});
    saveStoredSetting.mockImplementation(async (_key, value) => value);

    // Act
    const result = await updateEmailTemplates({
      custom: { subject: "Clinic news", heading: "Hello", message: "Update" },
      unknown_template: { subject: "Ignored", heading: "Ignored", message: "Ignored" },
    });

    // Assert
    expect(result.custom).toEqual({ subject: "Clinic news", heading: "Hello", message: "Update" });
    expect(result.unknown_template).toBeUndefined();
    expect(saveStoredSetting).toHaveBeenCalledWith("email.templates", expect.any(Object));
  });

  test("does not send a notification template disabled by admin settings", async () => {
    // Arrange
    getStoredSetting.mockResolvedValueOnce({ notifications: { emailNewAppt: false } });

    // Act
    const result = await sendTemplateEmail("appointment_confirmation", "customer@example.test", {});

    // Assert
    expect(result).toEqual({ sent: false, disabled: true });
    expect(mockCreateTransport).not.toHaveBeenCalled();
  });

  test("renders variables and sends a template through mocked SMTP", async () => {
    // Arrange
    getStoredSetting
      .mockResolvedValueOnce({ notifications: { emailNewAppt: true } })
      .mockResolvedValueOnce({
        appointment_confirmation: {
          subject: "Appointment {{appointmentCode}}",
          heading: "Hello {{customerName}}",
          message: "Pet {{petName}} is booked",
        },
      });
    mockSendMail.mockResolvedValueOnce({ messageId: "mock-message" });

    // Act
    const result = await sendTemplateEmail("appointment_confirmation", "customer@example.test", {
      appointmentCode: "APT-000001",
      customerName: "Customer Test",
      petName: "Milo",
    });

    // Assert
    expect(result).toEqual({ sent: true });
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: "customer@example.test",
      subject: "Appointment APT-000001",
      text: "Hello Customer Test\n\nPet Milo is booked",
      html: expect.stringContaining("Pet Milo is booked"),
    }));
  });

  test("safe send converts mocked SMTP failures into a non-throwing result", async () => {
    // Arrange
    getStoredSetting
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    mockSendMail.mockRejectedValueOnce(new Error("SMTP rejected message"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Act
    const result = await safeSendTemplateEmail("custom", "customer@example.test", {});

    // Assert
    expect(result).toEqual({ sent: false, error: "SMTP rejected message" });
    expect(consoleSpy).toHaveBeenCalled();
  });

  test("custom email rejects a missing recipient before mocked delivery", async () => {
    // Arrange & Act
    const action = () => sendCustomEmail({ to: "", subject: "Test", heading: "Test", message: "Test" });

    // Assert
    await expect(action()).rejects.toThrow();
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
