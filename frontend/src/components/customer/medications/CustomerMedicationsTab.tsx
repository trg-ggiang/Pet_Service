import { AlertTriangle, CheckCircle2, Clock, Coffee, Pill, Sunrise, Sunset } from "lucide-react";
import type { ActiveMedicationsPayload, ActiveMedication, PetMedications } from "../../../types/customer/medications";

type Props = {
  data: ActiveMedicationsPayload | null;
  loading: boolean;
  error: string;
};

/* ── Helpers ───────────────────────────────────────────────────────── */

const SLOTS = ["Sáng", "Trưa", "Chiều", "Tối"] as const;
type Slot = (typeof SLOTS)[number];

const SLOT_CFG: Record<Slot, { icon: React.ElementType; bg: string; text: string; border: string }> = {
  "Sáng":  { icon: Sunrise, bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-100"  },
  "Trưa":  { icon: Coffee,  bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-100" },
  "Chiều": { icon: Clock,   bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-100"    },
  "Tối":   { icon: Sunset,  bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-100" },
};

function urgencyColor(days: number) {
  if (days <= 2) return { dot: "bg-red-500",    text: "text-red-600",    badge: "bg-red-50 border-red-200 text-red-700"        };
  if (days <= 5) return { dot: "bg-amber-400",  text: "text-amber-600",  badge: "bg-amber-50 border-amber-200 text-amber-700"  };
  return              { dot: "bg-emerald-500", text: "text-emerald-600", badge: "bg-emerald-50 border-emerald-200 text-emerald-700" };
}

function petEmoji(species: string) {
  const s = (species ?? "").toLowerCase();
  if (s.includes("mèo") || s.includes("cat")) return "🐱";
  if (s.includes("thỏ") || s.includes("rabbit")) return "🐰";
  if (s.includes("hamster")) return "🐹";
  return "🐶";
}

/* ── Today schedule section ────────────────────────────────────────── */

type SlotMed = ActiveMedication & { petName: string; petSpecies: string };

function TodaySchedule({ pets }: { pets: PetMedications[] }) {
  const bySlot: Record<Slot, SlotMed[]> = { Sáng: [], Trưa: [], Chiều: [], Tối: [] };

  for (const pet of pets) {
    for (const med of pet.medications) {
      for (const slot of med.timeSlots as Slot[]) {
        if (bySlot[slot]) {
          bySlot[slot].push({ ...med, petName: pet.petName, petSpecies: pet.species });
        }
      }
    }
  }

  const activeSlots = SLOTS.filter(s => bySlot[s].length > 0);
  if (activeSlots.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-[15px] font-bold text-slate-900">Lịch uống thuốc hôm nay</h3>
        <p className="mt-0.5 text-[12px] text-slate-400">
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {activeSlots.map(slot => {
          const cfg  = SLOT_CFG[slot];
          const Icon = cfg.icon;
          const meds = bySlot[slot];

          return (
            <div key={slot} className="flex gap-0">
              {/* Time label */}
              <div className={`flex w-20 flex-shrink-0 flex-col items-center justify-start gap-1 py-4 ${cfg.bg}`}>
                <Icon size={16} className={cfg.text} />
                <span className={`text-[12px] font-bold ${cfg.text}`}>{slot}</span>
              </div>

              {/* Medicine rows */}
              <div className="flex flex-1 flex-col divide-y divide-slate-50 py-1">
                {meds.map((m, i) => {
                  const u = urgencyColor(m.daysRemaining);
                  return (
                    <div key={`${m.id}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="text-base leading-none">{petEmoji(m.petSpecies)}</span>
                      <div className="min-w-0 flex-1">
                        <span className="text-[13px] font-bold text-slate-800">{m.petName}</span>
                        <span className="mx-1.5 text-slate-300">·</span>
                        <span className="text-[13px] text-slate-700">{m.medicineName}</span>
                        {m.dosage && (
                          <span className="ml-1.5 text-[12px] text-slate-400">({m.dosage})</span>
                        )}
                      </div>
                      <span className={`flex-shrink-0 rounded-lg border px-2 py-0.5 text-[11px] font-bold ${u.badge}`}>
                        {m.daysRemaining === 0 ? "Hôm nay cuối" : `Còn ${m.daysRemaining}n`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Per-pet medication list ───────────────────────────────────────── */

function PetMedList({ pet }: { pet: PetMedications }) {
  const urgentCount = pet.medications.filter(m => m.daysRemaining <= 2).length;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Pet header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="text-xl">{petEmoji(pet.species)}</span>
          <div>
            <p className="text-[14px] font-bold text-slate-900">{pet.petName}</p>
            <p className="text-[11px] text-slate-400">{pet.medications.length} loại thuốc đang dùng</p>
          </div>
        </div>
        {urgentCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600">
            <AlertTriangle size={11} />
            {urgentCount} sắp hết thuốc
          </span>
        )}
      </div>

      {/* Medication rows */}
      <div className="divide-y divide-slate-50">
        {pet.medications.map(med => {
          const u = urgencyColor(med.daysRemaining);
          const progress = Math.max(5, Math.min(100,
            ((med.durationDays - med.daysRemaining) / med.durationDays) * 100
          ));

          return (
            <div key={med.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className={`mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${u.dot}`} />
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-slate-900">{med.medicineName}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-slate-500">
                      {med.dosage    && <span>{med.dosage}</span>}
                      {med.frequency && <><span className="text-slate-300">·</span><span>{med.frequency}</span></>}
                    </div>
                    {med.instructions && (
                      <p className="mt-1.5 text-[11px] italic text-slate-400">{med.instructions}</p>
                    )}
                  </div>
                </div>

                {/* Days remaining */}
                <div className="flex-shrink-0 text-right">
                  <p className={`text-lg font-black leading-none ${u.text}`}>{med.daysRemaining}</p>
                  <p className="text-[10px] font-semibold text-slate-400">ngày còn lại</p>
                </div>
              </div>

              {/* Thin progress bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>{med.startDate}</span>
                  <span>→ {med.endDate}</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${u.dot}`} style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main tab ──────────────────────────────────────────────────────── */

export function CustomerMedicationsTab({ data, loading, error }: Props) {
  if (loading) return (
    <div className="space-y-4">
      <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-5">
      <AlertTriangle size={20} className="flex-shrink-0 text-red-500" />
      <p className="text-sm font-semibold text-red-700">{error}</p>
    </div>
  );

  const hasData = data && data.pets.length > 0;

  return (
    <div className="w-full space-y-5">

      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Lịch thuốc thú cưng</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {hasData ? `${data.totalActive} loại thuốc đang theo dõi` : "Không có thuốc đang dùng"}
          </p>
        </div>
        {hasData && (
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
            <Pill size={15} className="text-cyan-600" />
            <span className="text-sm font-bold text-slate-700">{data.totalActive} loại</span>
          </div>
        )}
      </div>

      {/* Empty */}
      {!hasData ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 size={28} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-700">Không có thuốc đang dùng</p>
            <p className="mt-1 text-sm text-slate-400">Tất cả thú cưng đều khoẻ mạnh 🎉</p>
          </div>
        </div>
      ) : (
        <>
          {/* 1. TODAY's schedule — PRIMARY, always first */}
          <TodaySchedule pets={data.pets} />

          {/* 2. Per-pet detail — SECONDARY */}
          <div>
            <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-slate-400">
              Chi tiết theo thú cưng
            </p>
            <div className="space-y-4">
              {data.pets.map(pet => (
                <PetMedList key={pet.petId} pet={pet} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
