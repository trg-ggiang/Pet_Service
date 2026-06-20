import { beforeEach, describe, expect, test, vi } from "vitest";
import { mockAuthSession } from "../../tests/mocks/auth.mock";
import {
  mockAppointment,
  mockAppointmentListPayload,
  mockAppointmentOptions,
  mockProvider,
} from "../../tests/mocks/customerAppointments.mock";
import { writeStorage } from "../../utils/authSession";
import {
  cancelCustomerAppointment,
  confirmCustomerAppointment,
  createCustomerAppointment,
  fetchCustomerAppointmentOptions,
  fetchCustomerAppointmentProviders,
  fetchCustomerAppointments,
  rescheduleCustomerAppointment,
} from "./customerAppointmentsApi";

function mockFetchJson(payload: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(payload),
    }),
  );
}

describe("customerAppointmentsApi", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    writeStorage(localStorage, mockAuthSession);
  });

  test("fetches appointment options with auth headers", async () => {
    // Arrange
    mockFetchJson({ ok: true, options: mockAppointmentOptions });

    // Act
    const options = await fetchCustomerAppointmentOptions();

    // Assert
    expect(options).toEqual(mockAppointmentOptions);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/customer/appointment-options",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockAuthSession.token}`,
        }),
      }),
    );
  });

  test("fetches appointments with filters and pagination query params", async () => {
    // Arrange
    mockFetchJson({ ok: true, ...mockAppointmentListPayload });

    // Act
    const payload = await fetchCustomerAppointments({
      status: "upcoming",
      pet: "Milo",
      serviceType: "Khám bệnh",
      page: 2,
      pageSize: 10,
    });

    // Assert
    expect(payload).toEqual(mockAppointmentListPayload);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/customer/appointments?status=upcoming&pet=Milo&serviceType=Kh%C3%A1m+b%E1%BB%87nh&page=2&pageSize=10",
      expect.any(Object),
    );
  });

  test("loads provider options using POST payload", async () => {
    // Arrange
    const input = {
      serviceId: 501,
      serviceType: "Khám bệnh",
      date: "2099-07-20",
      time: "09:00",
    };
    mockFetchJson({ ok: true, providers: [mockProvider] });

    // Act
    const providers = await fetchCustomerAppointmentProviders(input);

    // Assert
    expect(providers).toEqual([mockProvider]);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/customer/appointment-provider-options",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
  });

  test("creates an appointment with selected pet, service and provider", async () => {
    // Arrange
    const input = {
      petId: 100,
      serviceId: 501,
      serviceName: "Kham tong quat",
      serviceType: "Khám bệnh",
      date: "2099-07-20",
      time: "09:00",
      providerRole: "doctor",
      providerId: 300,
      note: "First visit",
    };
    mockFetchJson({ ok: true, appointment: mockAppointment });

    // Act
    const appointment = await createCustomerAppointment(input);

    // Assert
    expect(appointment).toEqual(mockAppointment);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/customer/appointments",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
  });

  test("confirms an appointment using encoded appointment id", async () => {
    // Arrange
    mockFetchJson({ ok: true, appointment: mockAppointment });

    // Act
    const appointment = await confirmCustomerAppointment("APT-000200");

    // Assert
    expect(appointment).toEqual(mockAppointment);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/customer/appointments/APT-000200/confirm",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  test("reschedules an appointment with requested date and reason", async () => {
    // Arrange
    const input = { date: "2099-07-21", time: "10:00", reason: "Change time" };
    mockFetchJson({ ok: true, appointment: mockAppointment });

    // Act
    await rescheduleCustomerAppointment("APT-000200", input);

    // Assert
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/customer/appointments/APT-000200/reschedule",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    );
  });

  test("cancels an appointment with optional reason payload", async () => {
    // Arrange
    const input = { reason: "Cannot come" };
    mockFetchJson({ ok: true, appointment: mockAppointment });

    // Act
    await cancelCustomerAppointment("APT-000200", input);

    // Assert
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/customer/appointments/APT-000200/cancel",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    );
  });
});
