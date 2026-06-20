import { getAuthHeaders } from "../utils/authSession";
import { apiUrl } from "../utils/apiUrl";
import { requestJson } from "../utils/requestJson";
import type {
  CreateCustomerPetInput,
  CustomerPetDashboard,
  PetDetail,
  UpdateCustomerPetInput,
} from "../types/customerPets";

export type {
  BreedOption,
  CustomerPetDashboard,
  PetDetail,
  PetSummary,
  SpeciesOption,
} from "../types/customerPets";

export async function fetchCustomerPetDashboard(): Promise<CustomerPetDashboard> {
  const payload = await requestJson<{ ok: true } & CustomerPetDashboard>(
    `/api/customer/pets`,
    {
      headers: getAuthHeaders(),
    },
  );
  return {
    customer: payload.customer,
    species: payload.species,
    breeds: payload.breeds,
    pets: payload.pets,
  };
}

export async function fetchPetDetail(petId: number): Promise<PetDetail> {
  const payload = await requestJson<{ ok: true } & PetDetail>(
    `/api/customer/pets/${petId}`,
    {
      headers: getAuthHeaders(),
    },
  );
  return {
    pet: payload.pet,
    appointments: payload.appointments,
    vaccinations: payload.vaccinations,
    medicalVisits: payload.medicalVisits,
    groomingRecords: payload.groomingRecords,
    boardingRecords: payload.boardingRecords,
    invoices: payload.invoices,
  };
}

export async function createCustomerPet(input: CreateCustomerPetInput): Promise<{ id: number }> {
  const speciesId = Number(input.speciesId);

  const payloadBody = {
    name: input.name,
    gender: input.gender,
    dob: input.dob ?? null,
    weight: input.weight ?? null,
    color: input.color ?? null,
    imgUrl: input.imgUrl ?? null,
    allergies: input.allergies ?? null,
    chronicDiseases: input.chronicDiseases ?? null,
    specialNote: input.specialNote ?? null,
    breedId: input.breedId ?? null,
    speciesId,
    // compatibility: backend also accepts snake_case in some versions
    species_id: speciesId,
  };

  const payload = await requestJson<{ ok: true; pet: { id: number } }>(
    "/api/customer/pets",
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payloadBody),
    },
  );

  return payload.pet;
}

function getFilenameFromContentDisposition(headerValue: string | null, fallback: string) {
  if (!headerValue) return fallback;

  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].trim());
  }

  const filenameMatch = headerValue.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1]?.trim() || fallback;
}

async function downloadInvoicePdfFromUrl(url: string, fallbackFilename: string): Promise<void> {
  const response = await fetch(apiUrl(url), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || `Yêu cầu thất bại (${response.status})`);
  }

  const blob = await response.blob();
  const filename = getFilenameFromContentDisposition(
    response.headers.get("Content-Disposition"),
    fallbackFilename,
  );
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function downloadCustomerInvoicePdf(invoiceId: number): Promise<void> {
  await downloadInvoicePdfFromUrl(
    `/api/customer/invoices/${invoiceId}/pdf`,
    `invoice-${String(invoiceId).padStart(6, "0")}.pdf`,
  );
}

export async function downloadLatestCustomerInvoicePdf(): Promise<void> {
  await downloadInvoicePdfFromUrl(
    "/api/customer/invoices/latest/pdf",
    "invoice-latest.pdf",
  );
}

export async function downloadMatchingCustomerInvoicePdf(input: {
  petName: string;
  serviceName: string;
  serviceType: string;
  date: string;
}): Promise<void> {
  const params = new URLSearchParams({
    petName: input.petName,
    serviceName: input.serviceName,
    serviceType: input.serviceType,
    date: input.date,
  });

  await downloadInvoicePdfFromUrl(
    `/api/customer/invoices/match/pdf?${params.toString()}`,
    "invoice.pdf",
  );
}

export async function updateCustomerPet(petId: number, input: UpdateCustomerPetInput): Promise<{ id: number }> {
  const speciesId = Number(input.speciesId);

  const payloadBody = {
    name: input.name,
    gender: input.gender,
    dob: input.dob ?? null,
    weight: input.weight ?? null,
    color: input.color ?? null,
    imgUrl: input.imgUrl ?? null,
    allergies: input.allergies ?? null,
    chronicDiseases: input.chronicDiseases ?? null,
    specialNote: input.specialNote ?? null,
    breedId: input.breedId ?? null,
    speciesId,
    species_id: speciesId,
  };

  const payload = await requestJson<{ ok: true; pet: { id: number } }>(
    `/api/customer/pets/${petId}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payloadBody),
    },
  );

  return payload.pet;
}
