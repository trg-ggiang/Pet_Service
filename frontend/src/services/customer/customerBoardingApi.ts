import { getAuthHeaders } from "../../utils/authSession";
import { apiUrl } from "../../utils/apiUrl";

async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(url), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.message || "Yêu cầu thất bại");
  }
  return data as T;
}

export interface BoardingRoom {
  id: number;
  cageNumber: string;
  status: "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE";
  pricePerDay: number;
  sizeType: "SMALL" | "MEDIUM" | "LARGE" | "VIP";
  sizeLabel: string;
  description: string;
  note: string;
  isAvailable: boolean;
}

export interface BookBoardingInput {
  petId: number;
  cageId: number;
  checkIn: string;
  checkOut: string;
  feedingInstruction?: string;
  habitNote?: string;
  specialNote?: string;
}

export async function fetchBoardingRooms(checkIn: string, checkOut: string): Promise<BoardingRoom[]> {
  const params = new URLSearchParams({ checkIn, checkOut });
  const data = await fetchWithAuth<{ ok: true; rooms: BoardingRoom[] }>(
    `/api/customer/boarding/rooms?${params}`,
  );
  return data.rooms;
}

export async function bookBoardingRoom(input: BookBoardingInput): Promise<{ boardingId: number; appointmentId: number }> {
  const data = await fetchWithAuth<{ ok: true; boardingId: number; appointmentId: number }>(
    "/api/customer/boarding/book",
    { method: "POST", body: JSON.stringify(input) },
  );
  return { boardingId: data.boardingId, appointmentId: data.appointmentId };
}

export async function rescheduleBoardingBooking(appointmentId: string, checkIn: string, checkOut: string): Promise<void> {
  await fetchWithAuth<{ ok: true }>(
    `/api/customer/boarding/${appointmentId}/reschedule`,
    { method: "PATCH", body: JSON.stringify({ checkIn, checkOut }) },
  );
}
