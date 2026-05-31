import { getAuthHeaders } from "../../utils/authSession";
import { requestJson } from "../../utils/requestJson";
import type { CustomerServiceHistoryRecord } from "../../types/customer/serviceHistory";

export async function fetchCustomerServiceHistory(): Promise<CustomerServiceHistoryRecord[]> {
  const payload = await requestJson<{ ok: true; history: CustomerServiceHistoryRecord[] }>(
    "/api/customer/service-history",
    { headers: getAuthHeaders() },
  );

  return payload.history;
}
