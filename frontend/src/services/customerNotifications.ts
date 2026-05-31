import { getAuthHeaders } from "../utils/authSession";
import { requestJson } from "../utils/requestJson";

export type CustomerNotification = {
  id: number;
  user_id: number;
  title: string;
  content: string;
  type: "APPOINTMENT" | "PAYMENT" | "VACCINE" | "GROOMING" | "BOARDING" | "SYSTEM";
  is_read: boolean;
  created_at: string;
};

export async function fetchCustomerNotifications(): Promise<CustomerNotification[]> {
  const payload = await requestJson<{ ok: true; notifications: CustomerNotification[] }>(
    "/api/customer/notifications",
    {
      headers: getAuthHeaders(),
    },
  );

  return payload.notifications;
}

export async function markCustomerNotificationRead(notificationId: number): Promise<void> {
  await requestJson<{ ok: true }>(
    `/api/customer/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
  );
}

export async function markAllCustomerNotificationsRead(): Promise<void> {
  await requestJson<{ ok: true }>(
    "/api/customer/notifications/read-all",
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
  );
}
