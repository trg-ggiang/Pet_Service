import { getAuthHeaders } from "../auth";
import { requestJson } from "../../utils/requestJson";

export type CustomerGender = "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";

export interface CustomerProfile {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string | null;
  age: number | null;
  gender: CustomerGender;
}

export interface CustomerProfileInput {
  fullName: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string | null;
  gender?: CustomerGender;
}

export async function fetchCustomerProfile() {
  return requestJson<{ ok: true; profile: CustomerProfile }>("/api/customer/profile", {
    headers: getAuthHeaders(),
  });
}

export async function updateCustomerProfile(input: CustomerProfileInput) {
  return requestJson<{ ok: true; profile: CustomerProfile }>("/api/customer/profile", {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });
}
