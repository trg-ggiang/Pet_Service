import { getAuthHeaders } from "../../utils/authSession";
import { requestJson } from "../../utils/requestJson";

export async function submitCustomerRating(appointmentId: number, score: number, comment?: string): Promise<void> {
  await requestJson<{ ok: true; appointmentId: number; score: number }>(
    `/api/customer/appointments/${appointmentId}/rating`,
    {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ score, comment: comment || undefined }),
    },
  );
}
