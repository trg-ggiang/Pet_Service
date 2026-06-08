import { getAuthHeaders } from "../../utils/authSession";
import { requestJson } from "../../utils/requestJson";
import type {
  CreateCustomerAppointmentInput,
  CustomerAppointment,
  CustomerAppointmentListParams,
  CustomerAppointmentListPayload,
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

export async function fetchCustomerAppointments(params?: CustomerAppointmentListParams): Promise<CustomerAppointmentListPayload> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") query.set("status", params.status);
  if (params?.pet && params.pet !== "all") query.set("pet", params.pet);
  if (params?.serviceType && params.serviceType !== "all") query.set("serviceType", params.serviceType);
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("pageSize", String(params.pageSize));
  const suffix = query.toString() ? `?${query.toString()}` : "";

  const payload = await requestJson<{ ok: true } & CustomerAppointmentListPayload>(
    `/api/customer/appointments${suffix}`,
    { headers: getAuthHeaders() },
  );

  return {
    appointments: payload.appointments,
    summary: payload.summary,
    pagination: payload.pagination,
  };
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

export async function confirmCustomerAppointment(appointmentId: string): Promise<CustomerAppointment> {
  const payload = await requestJson<{ ok: true; appointment: CustomerAppointment }>(
    `/api/customer/appointments/${encodeURIComponent(appointmentId)}/confirm`,
    { method: "PATCH", headers: getAuthHeaders() },
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

export async function cancelCustomerAppointment(appointmentId: string, input?: { reason?: string }): Promise<CustomerAppointment> {
  const payload = await requestJson<{ ok: true; appointment: CustomerAppointment }>(
    `/api/customer/appointments/${encodeURIComponent(appointmentId)}/cancel`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: input ? JSON.stringify(input) : undefined,
    },
  );

  return payload.appointment;
}
