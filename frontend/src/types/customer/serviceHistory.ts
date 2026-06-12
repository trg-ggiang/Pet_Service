export type CustomerServiceHistoryType =
  | "medical"
  | "grooming"
  | "boarding";

export type CustomerServiceHistoryTypeFilter = CustomerServiceHistoryType | "all";

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

export type CustomerServiceHistorySummary = {
  total: number;
  filtered: number;
  typeCounts: Array<{
    type: CustomerServiceHistoryTypeFilter;
    count: number;
  }>;
};

export type CustomerServiceHistoryListPayload = {
  history: CustomerServiceHistoryRecord[];
  summary: CustomerServiceHistorySummary;
};
