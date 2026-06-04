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

export type CustomerNotificationSummary = {
  total: number;
  unreadCount: number;
};

export type CustomerNotificationsPayload = {
  notifications: CustomerNotification[];
  summary: CustomerNotificationSummary;
};

export async function fetchCustomerNotifications(): Promise<CustomerNotificationsPayload> {
  const payload = await requestJson<{ ok: true } & CustomerNotificationsPayload>(
    "/api/customer/notifications",
    {
      headers: getAuthHeaders(),
    },
  );

  return {
    notifications: payload.notifications,
    summary: payload.summary,
  };
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

export async function dismissCustomerNotification(notificationId: number): Promise<void> {
  await requestJson<{ ok: true }>(
    `/api/customer/notifications/${notificationId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );
}
