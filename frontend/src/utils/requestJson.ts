import { apiUrl } from "./apiUrl";

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(url), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || `Request failed (${response.status})`);
  }

  return payload as T;
}
