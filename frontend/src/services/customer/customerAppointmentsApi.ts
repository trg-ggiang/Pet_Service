import { getAuthHeaders } from "../../utils/authSession";
import { requestJson } from "../../utils/requestJson";
import type {
  CreateCustomerAppointmentInput,
  CustomerAppointment,
  CustomerAppointmentOptions,
  CustomerAppointmentProvider,
  CustomerAppointmentProviderInput,
  RescheduleCustomerAppointmentInput,
} from "../../types/customer/appointments";

export async function fetchCustomerAppointmentOptions(): Promise<CustomerAppointmentOptions> {
  const payload = await requestJson<{ ok: true; options: CustomerAppointmentOptions }>(
    "/api/customer/appointment-options",
    { headers: getAuthHeaders() },
  );

  return payload.options;
}

export async function fetchCustomerAppointments(): Promise<CustomerAppointment[]> {
  const payload = await requestJson<{ ok: true; appointments: CustomerAppointment[] }>(
    "/api/customer/appointments",
    { headers: getAuthHeaders() },
  );

  return payload.appointments;
}

export async function fetchCustomerAppointmentProviders(
  input: CustomerAppointmentProviderInput,
): Promise<CustomerAppointmentProvider[]> {
  const payload = await requestJson<{ ok: true; providers: CustomerAppointmentProvider[] }>(
    "/api/customer/appointment-provider-options",
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(input),
    },
  );

  return payload.providers;
}

export async function createCustomerAppointment(input: CreateCustomerAppointmentInput): Promise<CustomerAppointment> {
  const payload = await requestJson<{ ok: true; appointment: CustomerAppointment }>(
    "/api/customer/appointments",
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(input),
    },
  );

  return payload.appointment;
}

export async function rescheduleCustomerAppointment(
  appointmentId: string,
  input: RescheduleCustomerAppointmentInput,
): Promise<CustomerAppointment> {
  const payload = await requestJson<{ ok: true; appointment: CustomerAppointment }>(
    `/api/customer/appointments/${encodeURIComponent(appointmentId)}/reschedule`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(input),
    },
  );

  return payload.appointment;
}

export async function cancelCustomerAppointment(appointmentId: string): Promise<CustomerAppointment> {
  const payload = await requestJson<{ ok: true; appointment: CustomerAppointment }>(
    `/api/customer/appointments/${encodeURIComponent(appointmentId)}/cancel`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
  );

  return payload.appointment;
}
