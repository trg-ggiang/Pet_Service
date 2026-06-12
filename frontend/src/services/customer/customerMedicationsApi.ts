import { getAuthHeaders } from "../../utils/authSession";
import { requestJson } from "../../utils/requestJson";
import type { ActiveMedicationsPayload } from "../../types/customer/medications";

export async function fetchActiveMedications(): Promise<ActiveMedicationsPayload> {
  const payload = await requestJson<{ ok: true } & ActiveMedicationsPayload>(
    "/api/customer/medications/active",
    { headers: getAuthHeaders() },
  );
  return { pets: payload.pets, totalActive: payload.totalActive };
}
