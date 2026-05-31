export type CustomerNotification = {
  id: number;
  user_id: number;
  title: string;
  content: string;
  type: "APPOINTMENT" | "PAYMENT" | "VACCINE" | "GROOMING" | "BOARDING" | "SYSTEM";
  is_read: boolean;
  created_at: string;
};
