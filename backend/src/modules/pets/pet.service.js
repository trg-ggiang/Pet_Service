const { supabase } = require("../../lib/supabaseClient");

const PET_COLOR_BY_SPECIES = {
  1: "slate",
  2: "amber",
  3: "emerald",
};

function formatDate(value) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Chưa có"
    : date.toLocaleDateString("vi-VN");
}

function formatAge(dob) {
  if (!dob) return "Chưa rõ";

  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "Chưa rõ";

  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) {
    years -= 1;
  }

  if (years <= 0) {
    const months = Math.max(
      1,
      Math.floor(
        (now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30),
      ),
    );
    return `${months} tháng`;
  }

  return `${years} tuổi`;
}

function getGenderLabel(gender) {
  if (gender === "MALE") return "Đực";
  if (gender === "FEMALE") return "Cái";
  return "Chưa xác định";
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getPetColorId(speciesId) {
  return PET_COLOR_BY_SPECIES[speciesId] ?? "violet";
}

function normalizeOptionalText(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

  if (["khong co", "khong", "none", "no", "n/a", "na"].includes(normalized)) {
    return null;
  }

  return text;
}

function hasHealthConcern(value) {
  return normalizeOptionalText(value) !== null;
}

function pickLatestByDate(records, fieldName) {
  return (
    [...records].sort((left, right) => {
      const leftTime = new Date(left?.[fieldName] ?? 0).getTime();
      const rightTime = new Date(right?.[fieldName] ?? 0).getTime();
      return rightTime - leftTime;
    })[0] ?? null
  );
}

function buildPetSummary(
  pet,
  speciesMap,
  breedMap,
  vaccinations,
  medicalVisits,
  appointmentsByPetId,
) {
  const petVaccinations = vaccinations.filter(
    (record) => record.pet_id === pet.id,
  );
  const petVisits = medicalVisits.filter(
    (record) => appointmentsByPetId[record.appointment_id] === pet.id,
  );

  const latestVaccination = pickLatestByDate(petVaccinations, "date_given");
  const latestVisit = pickLatestByDate(petVisits, "created_at");

  const species = speciesMap.get(pet.species_id);
  const breed = pet.breed_id ? breedMap.get(pet.breed_id) : null;

  return {
    id: pet.id,
    customerId: pet.customer_id,
    speciesId: pet.species_id,
    breedId: pet.breed_id,
    name: pet.name,
    gender: pet.gender,
    genderLabel: getGenderLabel(pet.gender),
    species: species?.name ?? "Chưa rõ",
    breed: breed?.name ?? "Chưa rõ",
    age: formatAge(pet.dob),
    dob: pet.dob,
    weight: pet.weight ? `${pet.weight} kg` : "Chưa rõ",
    color: pet.color,
    image: pet.img_url,
    initials: getInitials(pet.name),
    colorId: getPetColorId(pet.species_id),
    allergies: pet.allergies,
    chronicDiseases: pet.chronic_diseases,
    specialNote: pet.special_note,
    healthy: !hasHealthConcern(pet.chronic_diseases),
    lastVisit: latestVisit ? formatDate(latestVisit.created_at) : "Chưa có",
    nextVaccine: latestVaccination
      ? formatDate(latestVaccination.next_due_date)
      : "Chưa có",
    latestVaccination: latestVaccination
      ? {
          vaccineName: latestVaccination.vaccine_name,
          dateGiven: latestVaccination.date_given,
          nextDueDate: latestVaccination.next_due_date,
          note: latestVaccination.note,
        }
      : null,
    latestMedicalVisit: latestVisit
      ? {
          symptoms: latestVisit.symptoms,
          clinicalExam: latestVisit.clinical_exam,
          diagnosisNote: latestVisit.diagnosis_note,
          nextVisitDate: latestVisit.next_visit_date,
          createdAt: latestVisit.created_at,
        }
      : null,
    createdAt: pet.created_at,
    updatedAt: pet.updated_at,
  };
}

async function getCustomerPetDashboard(customerId) {
  const effectiveCustomerId = Number(customerId);

  if (!Number.isFinite(effectiveCustomerId)) {
    throw new Error("Thiếu thông tin khách hàng");
  }

  const [customerResult, petsResult, speciesResult, breedsResult] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, full_name, phone, address, user_id")
        .eq("id", effectiveCustomerId)
        .single(),
      supabase
        .from("pets")
        .select("*")
        .eq("customer_id", effectiveCustomerId)
        .order("created_at", { ascending: true }),
      supabase
        .from("animal_species")
        .select("id, name, description, care_instruction")
        .order("id", { ascending: true }),
      supabase
        .from("breeds")
        .select("id, species_id, name, description")
        .order("species_id", { ascending: true })
        .order("id", { ascending: true }),
    ]);

  if (customerResult.error) throw new Error(customerResult.error.message);
  if (petsResult.error) throw new Error(petsResult.error.message);
  if (speciesResult.error) throw new Error(speciesResult.error.message);
  if (breedsResult.error) throw new Error(breedsResult.error.message);

  const pets = petsResult.data ?? [];
  const petIds = pets.map((pet) => pet.id);
  const species = speciesResult.data ?? [];
  const breeds = breedsResult.data ?? [];

  const [vaccinationsResult, appointmentsResult] = await Promise.all([
    petIds.length > 0
      ? supabase
          .from("vaccinations")
          .select(
            "id, pet_id, appointment_id, vaccine_name, date_given, next_due_date, note",
          )
          .in("pet_id", petIds)
          .order("date_given", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    petIds.length > 0
      ? supabase
          .from("appointments")
          .select(
            "id, pet_id, appointment_type, status, note, cancel_reason, created_at, updated_at",
          )
          .in("pet_id", petIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (vaccinationsResult.error)
    throw new Error(vaccinationsResult.error.message);
  if (appointmentsResult.error)
    throw new Error(appointmentsResult.error.message);

  const appointments = appointmentsResult.data ?? [];
  const appointmentsByPetId = Object.fromEntries(
    appointments.map((appointment) => [appointment.id, appointment.pet_id]),
  );

  const speciesMap = new Map(species.map((entry) => [entry.id, entry]));
  const breedMap = new Map(breeds.map((entry) => [entry.id, entry]));

  return {
    customer: customerResult.data,
    species,
    breeds,
    pets: pets.map((pet) =>
      buildPetSummary(
        pet,
        speciesMap,
        breedMap,
        vaccinationsResult.data ?? [],
        appointmentsResult.data ?? [],
        appointmentsByPetId,
      ),
    ),
  };
}

async function getPetDetail(petId, customerId) {
  const petIdNumber = Number(petId);
  if (!Number.isFinite(petIdNumber)) {
    throw new Error("Mã thú cưng không hợp lệ");
  }

  const effectiveCustomerId = Number(customerId);
  if (!Number.isFinite(effectiveCustomerId)) {
    throw new Error("Thiếu thông tin khách hàng");
  }

  const [petResult, appointmentsResult] = await Promise.all([
    supabase.from("pets").select("*").eq("id", petIdNumber).single(),
    supabase
      .from("appointments")
      .select(
        "id, pet_id, appointment_type, status, note, cancel_reason, created_at, updated_at",
      )
      .eq("pet_id", petIdNumber)
      .order("created_at", { ascending: false }),
  ]);

  if (petResult.error) throw new Error(petResult.error.message);
  if (appointmentsResult.error)
    throw new Error(appointmentsResult.error.message);

  const appointments = appointmentsResult.data ?? [];
  if (petResult.data.customer_id !== effectiveCustomerId) {
    throw new Error("Bạn không có quyền xem thú cưng này");
  }
  const appointmentIds = appointments.map((appointment) => appointment.id);

  const [
    vaccinationsResult,
    medicalVisitsResult,
    groomingResult,
    boardingResult,
    invoicesResult,
  ] = await Promise.all([
    supabase
      .from("vaccinations")
      .select(
        "id, pet_id, appointment_id, vaccine_name, date_given, next_due_date, note",
      )
      .eq("pet_id", petIdNumber)
      .order("date_given", { ascending: false }),
    appointmentIds.length > 0
      ? supabase
          .from("medical_visits")
          .select(
            "id, appointment_id, symptoms, clinical_exam, diagnosis_note, next_visit_date, created_at, updated_at",
          )
          .in("appointment_id", appointmentIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    appointmentIds.length > 0
      ? supabase
          .from("grooming_records")
          .select(
            "id, appointment_id, appointment_service_id, staff_id, status, started_at, completed_at, before_image_url, after_image_url, notes",
          )
          .in("appointment_id", appointmentIds)
          .order("started_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    appointmentIds.length > 0
      ? supabase
          .from("boarding")
          .select(
            "id, appointment_id, cage_id, check_in, check_out, feeding_instruction, habit_note, special_note, pickup_reminder_at, current_status, boarding_daily_updates (id, date, eating_status, health_status, activity_status, note, img_url)",
          )
          .in("appointment_id", appointmentIds)
          .order("check_in", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    appointmentIds.length > 0
      ? supabase
          .from("invoices")
          .select(
            "id, appointment_id, subtotal_amount, discount_amount, tax_amount, total_amount, payment_method, payment_status, transaction_code, paid_at, status, created_at, updated_at",
          )
          .in("appointment_id", appointmentIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (vaccinationsResult.error)
    throw new Error(vaccinationsResult.error.message);
  if (medicalVisitsResult.error)
    throw new Error(medicalVisitsResult.error.message);
  if (groomingResult.error) throw new Error(groomingResult.error.message);
  if (boardingResult.error) throw new Error(boardingResult.error.message);
  if (invoicesResult.error) throw new Error(invoicesResult.error.message);

  const invoices = invoicesResult.data ?? [];
  const invoiceIds = invoices.map((invoice) => invoice.id);
  const invoiceItemsResult =
    invoiceIds.length > 0
      ? await supabase
          .from("invoice_items")
          .select("id, invoice_id, source_type, description, quantity, unit_price, total_price")
          .in("invoice_id", invoiceIds)
          .order("id", { ascending: true })
      : { data: [], error: null };

  if (invoiceItemsResult.error) throw new Error(invoiceItemsResult.error.message);

  const itemsByInvoiceId = new Map();
  (invoiceItemsResult.data ?? []).forEach((item) => {
    const currentItems = itemsByInvoiceId.get(item.invoice_id) ?? [];
    currentItems.push(item);
    itemsByInvoiceId.set(item.invoice_id, currentItems);
  });

  return {
    pet: petResult.data,
    appointments,
    vaccinations: vaccinationsResult.data ?? [],
    medicalVisits: medicalVisitsResult.data ?? [],
    groomingRecords: groomingResult.data ?? [],
    boardingRecords: boardingResult.data ?? [],
    invoices: invoices.map((invoice) => ({
      ...invoice,
      items: itemsByInvoiceId.get(invoice.id) ?? [],
    })),
  };
}

async function createCustomerPet(input, customerId) {
  const effectiveCustomerId = Number(customerId);
  const rawSpecies = input?.speciesId ?? input?.species_id;
  let speciesId = Number(rawSpecies);

  const rawBreed = input?.breedId ?? input?.breed_id;
  let breedId =
    rawBreed === "" || rawBreed === undefined || rawBreed === null
      ? null
      : Number(rawBreed);
  if (breedId !== null && !Number.isFinite(breedId)) {
    breedId = null;
  }

  if (!Number.isFinite(effectiveCustomerId)) {
    throw new Error("Thiếu thông tin khách hàng");
  }

  // Debug: log parsed values to trace missing/invalid speciesId
  console.debug("[service] createCustomerPet parsed:", {
    effectiveCustomerId,
    speciesId,
    breedId,
    rawSpecies,
    rawBreed,
    name: input?.name,
  });

  if (!Number.isFinite(speciesId)) {
    const candidateName =
      typeof input?.species === "string"
        ? input.species
        : typeof input?.speciesName === "string"
          ? input.speciesName
          : typeof rawSpecies === "string"
            ? rawSpecies
            : "";

    const speciesName = String(candidateName || "").trim();

    if (speciesName) {
      const { data: speciesRow, error: speciesError } = await supabase
        .from("animal_species")
        .select("id")
        .ilike("name", speciesName)
        .maybeSingle();

      if (speciesError) throw new Error(speciesError.message);
      if (speciesRow?.id) {
        speciesId = Number(speciesRow.id);
      }
    }
  }

  if (!Number.isFinite(speciesId)) {
    throw new Error("Vui lòng chọn giống loài hợp lệ.");
  }

  if (breedId === null) {
    const candidateBreedName =
      typeof input?.breed === "string"
        ? input.breed
        : typeof input?.breedName === "string"
          ? input.breedName
          : typeof rawBreed === "string"
            ? rawBreed
            : "";
    const breedName = String(candidateBreedName || "").trim();

    if (breedName) {
      const { data: breedRow, error: breedError } = await supabase
        .from("breeds")
        .select("id")
        .ilike("name", breedName)
        .eq("species_id", speciesId)
        .maybeSingle();

      if (breedError) throw new Error(breedError.message);
      if (breedRow?.id) {
        breedId = Number(breedRow.id);
      }
    }
  }

  const imgUrl = input?.imgUrl ?? input?.img_url;
  const chronicDiseases = input?.chronicDiseases ?? input?.chronic_diseases;
  const specialNote = input?.specialNote ?? input?.special_note;

  const payload = {
    customer_id: effectiveCustomerId,
    species_id: speciesId,
    breed_id: breedId,
    name: input?.name?.trim(),
    gender: input?.gender ?? "UNKNOWN",
    dob: input?.dob || null,
    weight: input?.weight ? Number(input.weight) : null,
    color: normalizeOptionalText(input?.color),
    img_url: imgUrl?.trim() || null,
    allergies: normalizeOptionalText(input?.allergies),
    chronic_diseases: normalizeOptionalText(chronicDiseases),
    special_note: normalizeOptionalText(specialNote),
    updated_at: new Date().toISOString(),
  };

  if (!payload.name) {
    throw new Error("Vui lòng nhập tên thú cưng");
  }

  const { data, error } = await supabase
    .from("pets")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return data;
}

async function updateCustomerPet(petId, input, customerId) {
  const petIdNumber = Number(petId);
  const effectiveCustomerId = Number(customerId);
  const rawSpecies = input?.speciesId ?? input?.species_id;
  let speciesId = Number(rawSpecies);

  const rawBreed = input?.breedId ?? input?.breed_id;
  let breedId =
    rawBreed === "" || rawBreed === undefined || rawBreed === null
      ? null
      : Number(rawBreed);
  if (breedId !== null && !Number.isFinite(breedId)) {
    breedId = null;
  }

  if (!Number.isFinite(petIdNumber)) {
    throw new Error("Mã thú cưng không hợp lệ");
  }

  if (!Number.isFinite(effectiveCustomerId)) {
    throw new Error("Thiếu thông tin khách hàng");
  }

  console.debug("[service] updateCustomerPet parsed:", {
    petIdNumber,
    effectiveCustomerId,
    speciesId,
    breedId,
    rawSpecies,
    rawBreed,
    name: input?.name,
  });

  if (!Number.isFinite(speciesId)) {
    const candidateName =
      typeof input?.species === "string"
        ? input.species
        : typeof input?.speciesName === "string"
          ? input.speciesName
          : typeof rawSpecies === "string"
            ? rawSpecies
            : "";

    const speciesName = String(candidateName || "").trim();

    if (speciesName) {
      const { data: speciesRow, error: speciesError } = await supabase
        .from("animal_species")
        .select("id")
        .ilike("name", speciesName)
        .maybeSingle();

      if (speciesError) throw new Error(speciesError.message);
      if (speciesRow?.id) {
        speciesId = Number(speciesRow.id);
      }
    }
  }

  if (!Number.isFinite(speciesId)) {
    throw new Error("Vui lòng chọn giống loài hợp lệ.");
  }

  if (breedId === null) {
    const candidateBreedName =
      typeof input?.breed === "string"
        ? input.breed
        : typeof input?.breedName === "string"
          ? input.breedName
          : typeof rawBreed === "string"
            ? rawBreed
            : "";
    const breedName = String(candidateBreedName || "").trim();

    if (breedName) {
      const { data: breedRow, error: breedError } = await supabase
        .from("breeds")
        .select("id")
        .ilike("name", breedName)
        .eq("species_id", speciesId)
        .maybeSingle();

      if (breedError) throw new Error(breedError.message);
      if (breedRow?.id) {
        breedId = Number(breedRow.id);
      }
    }
  }

  const imgUrl = input?.imgUrl ?? input?.img_url;
  const chronicDiseases = input?.chronicDiseases ?? input?.chronic_diseases;
  const specialNote = input?.specialNote ?? input?.special_note;

  const payload = {
    species_id: speciesId,
    breed_id: breedId,
    name: input?.name?.trim(),
    gender: input?.gender ?? "UNKNOWN",
    dob: input?.dob || null,
    weight: input?.weight ? Number(input.weight) : null,
    color: normalizeOptionalText(input?.color),
    img_url: imgUrl?.trim() || null,
    allergies: normalizeOptionalText(input?.allergies),
    chronic_diseases: normalizeOptionalText(chronicDiseases),
    special_note: normalizeOptionalText(specialNote),
    updated_at: new Date().toISOString(),
  };

  if (!payload.name) {
    throw new Error("Vui lòng nhập tên thú cưng");
  }

  const { data, error } = await supabase
    .from("pets")
    .update(payload)
    .eq("id", petIdNumber)
    .eq("customer_id", effectiveCustomerId)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error("Không tìm thấy hồ sơ thú cưng cần cập nhật");
  }

  return data;
}

module.exports = {
  getCustomerPetDashboard,
  getPetDetail,
  createCustomerPet,
  updateCustomerPet,
};
