import { getAuthHeaders } from "../utils/authSession";
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

  // Debug: log the outgoing payload to help trace species_id issues
  try {
    // eslint-disable-next-line no-console
    console.debug("createCustomerPet payloadBody:", payloadBody);
  } catch (e) {
    // ignore
  }
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
