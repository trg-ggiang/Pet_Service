export type CustomerServiceHistoryType =
  | "medical"
  | "vaccine"
  | "grooming"
  | "boarding";

export type CustomerServiceHistoryRecord = {
  id: string;
  invoiceId?: number;
  sortAt?: string;
  date: string;
  service: string;
  services: string[];
  items: Array<{
    id: number;
    description: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
  pet: string;
  cost: string;
  status: "completed" | "pending" | "cancelled";
  type: CustomerServiceHistoryType;
  staff: string;
  details?: string;
};
