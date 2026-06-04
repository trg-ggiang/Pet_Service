import { getAuthHeaders } from "../../utils/authSession";
import { requestJson } from "../../utils/requestJson";
import type {
  CustomerServiceHistoryListPayload,
  CustomerServiceHistoryTypeFilter,
} from "../../types/customer/serviceHistory";

type CustomerServiceHistoryListParams = {
  type?: CustomerServiceHistoryTypeFilter;
};

export async function fetchCustomerServiceHistory(
  params: CustomerServiceHistoryListParams = {},
): Promise<CustomerServiceHistoryListPayload> {
  const search = new URLSearchParams();
  if (params.type && params.type !== "all") search.set("type", params.type);

  const query = search.toString();
  const payload = await requestJson<{ ok: true } & CustomerServiceHistoryListPayload>(
    `/api/customer/service-history${query ? `?${query}` : ""}`,
    { headers: getAuthHeaders() },
  );

  return {
    history: payload.history,
    summary: payload.summary,
  };
}
