const { supabase } = require("../../lib/supabaseClient");

function assertCustomerId(customerId) {
  const id = Number(customerId);
  if (!Number.isFinite(id)) {
    const err = new Error("Không xác định được khách hàng");
    err.statusCode = 401;
    throw err;
  }
  return id;
}

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("vi-VN");
}

// Map frequency text → time-of-day slots
function parseTimeSlots(frequency) {
  if (!frequency) return [];
  const f = frequency.toLowerCase();
  const match = f.match(/(\d+)\s*l[aâ]n/);
  const count = match ? parseInt(match[1], 10) : 1;
  const slots4 = ["Sáng", "Trưa", "Chiều", "Tối"];
  const slots3 = ["Sáng", "Trưa", "Tối"];
  const slots2 = ["Sáng", "Tối"];
  const slots1 = ["Sáng"];
  if (count >= 4) return slots4;
  if (count === 3) return slots3;
  if (count === 2) return slots2;
  return slots1;
}

async function getActiveMedications(customerId) {
  const effectiveId = assertCustomerId(customerId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Load pets
  const { data: pets, error: petsErr } = await supabase
    .from("pets")
    .select("id, name, animal_species(name)")
    .eq("customer_id", effectiveId);
  if (petsErr) throw new Error(petsErr.message);
  if (!pets || pets.length === 0) return { pets: [], totalActive: 0 };

  const petIds = pets.map((p) => p.id);

  // 2. Load appointments for those pets
  const { data: appointments, error: aptsErr } = await supabase
    .from("appointments")
    .select("id, pet_id")
    .in("pet_id", petIds);
  if (aptsErr) throw new Error(aptsErr.message);
  if (!appointments || appointments.length === 0) return { pets: [], totalActive: 0 };

  const aptIds = appointments.map((a) => a.id);
  const petByAptId = new Map(appointments.map((a) => [a.id, a.pet_id]));

  // 3. Load medical visits for those appointments
  const { data: visits, error: visitsErr } = await supabase
    .from("medical_visits")
    .select("id, appointment_id, created_at")
    .in("appointment_id", aptIds);
  if (visitsErr) throw new Error(visitsErr.message);
  if (!visits || visits.length === 0) return { pets: [], totalActive: 0 };

  const visitIds = visits.map((v) => v.id);
  const aptIdByVisitId = new Map(visits.map((v) => [v.id, v.appointment_id]));
  const visitById = new Map(visits.map((v) => [v.id, v]));

  // 4. Load prescriptions
  const { data: prescriptions, error: rxErr } = await supabase
    .from("prescriptions")
    .select("id, medical_visit_id")
    .in("medical_visit_id", visitIds);
  if (rxErr) throw new Error(rxErr.message);
  if (!prescriptions || prescriptions.length === 0) return { pets: [], totalActive: 0 };

  const rxIds = prescriptions.map((r) => r.id);
  const visitIdByRxId = new Map(prescriptions.map((r) => [r.id, r.medical_visit_id]));

  // 5. Load prescription items
  const { data: items, error: itemsErr } = await supabase
    .from("prescription_items")
    .select("id, prescription_id, medicine_name, dosage, frequency, duration_days, instructions")
    .in("prescription_id", rxIds);
  if (itemsErr) throw new Error(itemsErr.message);
  if (!items || items.length === 0) return { pets: [], totalActive: 0 };

  // 6. Calculate active medications per pet
  const petMedMap = new Map(); // petId → []

  for (const item of items) {
    const durationDays = item.duration_days;
    if (!durationDays || durationDays <= 0) continue;

    const visitId = visitIdByRxId.get(item.prescription_id);
    if (!visitId) continue;

    const visit = visitById.get(visitId);
    if (!visit?.created_at) continue;

    const startDate = new Date(visit.created_at);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    if (endDate < today) continue; // already finished

    const aptId  = aptIdByVisitId.get(visitId);
    const petId  = petByAptId.get(aptId);
    if (!petId) continue;

    const msLeft = endDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

    const med = {
      id:            item.id,
      medicineName:  item.medicine_name || "Không rõ",
      dosage:        item.dosage        || null,
      frequency:     item.frequency     || null,
      timeSlots:     parseTimeSlots(item.frequency),
      durationDays,
      daysRemaining,
      startDate:     formatDate(visit.created_at),
      endDate:       formatDate(endDate.toISOString()),
      instructions:  item.instructions  || null,
    };

    const current = petMedMap.get(petId) ?? [];
    current.push(med);
    petMedMap.set(petId, current);
  }

  if (petMedMap.size === 0) return { pets: [], totalActive: 0 };

  const petsById = new Map(pets.map((p) => [p.id, p]));

  let totalActive = 0;
  const result = [];

  for (const [petId, meds] of petMedMap.entries()) {
    const pet = petsById.get(petId);
    if (!pet) continue;
    totalActive += meds.length;
    // Sort: most urgent (fewest days remaining) first
    meds.sort((a, b) => a.daysRemaining - b.daysRemaining);
    result.push({
      petId:   pet.id,
      petName: pet.name,
      species: pet.animal_species?.name ?? "",
      medications: meds,
    });
  }

  // Sort pets: pets with medications expiring soonest first
  result.sort((a, b) => a.medications[0].daysRemaining - b.medications[0].daysRemaining);

  return { pets: result, totalActive };
}

module.exports = { getActiveMedications };
