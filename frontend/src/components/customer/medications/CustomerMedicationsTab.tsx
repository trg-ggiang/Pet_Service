import { AlertTriangle, CheckCircle2, Moon, Pill, Sunrise, Sun, Sunset } from "lucide-react";
import type { ActiveMedicationsPayload, ActiveMedication, PetMedications } from "../../../types/customer/medications";

type Props = {
  data: ActiveMedicationsPayload | null;
  loading: boolean;
  error: string;
};

/* ── Constants ─────────────────────────────────────────────────────────── */

const SLOTS = ["Sáng", "Trưa", "Chiều", "Tối"] as const;
type Slot = (typeof SLOTS)[number];

const SLOT_CFG: Record<Slot, { Icon: React.ElementType; hex: string; light: string; borderHex: string }> = {
  "Sáng":  { Icon: Sunrise, hex: "#D97706", light: "#FFFBEB", borderHex: "#FCD34D" },
  "Trưa":  { Icon: Sun,     hex: "#EA580C", light: "#FFF7ED", borderHex: "#FDBA74" },
  "Chiều": { Icon: Sunset,  hex: "#0284C7", light: "#F0F9FF", borderHex: "#7DD3FC" },
  "Tối":   { Icon: Moon,    hex: "#4F46E5", light: "#EEF2FF", borderHex: "#A5B4FC" },
};

function urgencyLevel(days: number): "red" | "amber" | "green" {
  if (days <= 2) return "red";
  if (days <= 5) return "amber";
  return "green";
}

const U = {
  red:   { ring: "#EF4444", text: "text-red-600",    bg: "bg-red-50",    border: "border-red-200",   label: "text-red-700"    },
  amber: { ring: "#F59E0B", text: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200", label: "text-amber-700"  },
  green: { ring: "#10B981", text: "text-emerald-600",bg: "bg-emerald-50",border: "border-emerald-200",label: "text-emerald-700"},
};

function petEmoji(species: string) {
  const s = (species ?? "").toLowerCase();
  if (s.includes("mèo") || s.includes("cat"))    return "🐱";
  if (s.includes("thỏ") || s.includes("rabbit")) return "🐰";
  if (s.includes("hamster"))                      return "🐹";
  return "🐶";
}

/* ── Signature element: countdown ring ────────────────────────────────── */

function CountdownRing({ days, total }: { days: number; total: number }) {
  const level = urgencyLevel(days);
  const R = 19;
  const circ = 2 * Math.PI * R;
  const fill = Math.max(0, Math.min(1, total > 0 ? days / total : 0));
  const offset = circ * (1 - fill);
  const colors = U[level];

  return (
    <div className="relative flex-shrink-0" style={{ width: 48, height: 48 }}>
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        {/* Track */}
        <circle cx="24" cy="24" r={R} fill="none" stroke="#E2E8F0" strokeWidth="4" />
        {/* Progress */}
        <circle
          cx="24"
          cy="24"
          r={R}
          fill="none"
          stroke={U[level].ring}
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-sm font-black leading-none ${colors.text}`}>{days}</span>
        <span className="text-[8px] font-semibold text-slate-400 leading-none mt-0.5">ngày</span>
      </div>
    </div>
  );
}

/* ── Today slot block ──────────────────────────────────────────────────── */

type SlotMed = ActiveMedication & { petName: string; petSpecies: string };

function SlotBlock({ slot, meds }: { slot: Slot; meds: SlotMed[] }) {
  const cfg = SLOT_CFG[slot];
  const { Icon } = cfg;
  if (meds.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      {/* Slot header */}
      <div
        className="flex items-center gap-2.5 px-4 py-2.5"
        style={{ background: cfg.light, borderBottom: `1px solid ${cfg.borderHex}40` }}
      >
        <div
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ background: cfg.hex + "18" }}
        >
          <Icon size={14} style={{ color: cfg.hex }} />
        </div>
        <span className="text-sm font-black" style={{ color: cfg.hex }}>
          {slot}
        </span>
        <span className="ml-auto text-xs font-semibold text-slate-400">
          {meds.length} loại
        </span>
      </div>

      {/* Medication rows */}
      <div className="divide-y divide-slate-50">
        {meds.map((m, i) => {
          const level = urgencyLevel(m.daysRemaining);
          const colors = U[level];
          return (
            <div
              key={`${m.id}-${i}`}
              className="flex items-center gap-3 py-3 pl-4 pr-4"
              style={{ borderLeft: `3px solid ${cfg.borderHex}` }}
            >
              <span className="text-lg leading-none">{petEmoji(m.petSpecies)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
                  <span className="text-sm font-bold text-slate-900">{m.petName}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-sm text-slate-700">{m.medicineName}</span>
                  {m.dosage && (
                    <span className="text-xs text-slate-400">({m.dosage})</span>
                  )}
                </div>
                {m.instructions && (
                  <p className="mt-0.5 text-[11px] italic text-slate-400 truncate">
                    {m.instructions}
                  </p>
                )}
              </div>
              <span
                className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${colors.bg} ${colors.border} ${colors.label}`}
              >
                {m.daysRemaining === 0 ? "Cuối" : `${m.daysRemaining}n`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Per-pet detail card (right column) ───────────────────────────────── */

function PetDetailCard({ pet }: { pet: PetMedications }) {
  const urgentCount = pet.medications.filter((m) => m.daysRemaining <= 2).length;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      {/* Pet header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        <span className="text-xl leading-none">{petEmoji(pet.species)}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">{pet.petName}</p>
          <p className="text-[11px] text-slate-400">{pet.medications.length} loại thuốc</p>
        </div>
        {urgentCount > 0 && (
          <span className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
            <AlertTriangle size={9} />
            {urgentCount} sắp hết
          </span>
        )}
      </div>

      {/* Medications list */}
      <div className="divide-y divide-slate-50 px-4">
        {pet.medications.map((med) => {
          const level = urgencyLevel(med.daysRemaining);
          return (
            <div key={med.id} className="flex items-center gap-3 py-3">
              {/* Countdown ring */}
              <CountdownRing days={med.daysRemaining} total={med.durationDays} />

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 line-clamp-1">
                  {med.medicineName}
                </p>
                {(med.dosage || med.frequency) && (
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {[med.dosage, med.frequency].filter(Boolean).join(" · ")}
                  </p>
                )}
                {/* Time slots */}
                {med.timeSlots.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {med.timeSlots.map((s) => {
                      const sc = SLOT_CFG[s as Slot];
                      return sc ? (
                        <span
                          key={s}
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                          style={{ background: sc.light, color: sc.hex }}
                        >
                          {s}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                {/* Progress bar */}
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(4, Math.min(100, med.durationDays > 0 ? (med.daysRemaining / med.durationDays) * 100 : 0))}%`,
                      background: U[level].ring,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Skeleton loader ───────────────────────────────────────────────────── */

function SkeletonLoader() {
  return (
    <div className="flex gap-6">
      <div className="flex-[3] min-w-0 space-y-4">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
        {[64, 48, 72].map((h, i) => (
          <div key={i} className="animate-pulse rounded-xl bg-slate-100" style={{ height: h }} />
        ))}
      </div>
      <div className="w-72 flex-shrink-0 space-y-4">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
        {[88, 72].map((h, i) => (
          <div key={i} className="animate-pulse rounded-xl bg-slate-100" style={{ height: h }} />
        ))}
      </div>
    </div>
  );
}

/* ── Main export ───────────────────────────────────────────────────────── */

export function CustomerMedicationsTab({ data, loading, error }: Props) {
  if (loading) return <SkeletonLoader />;

  if (error) return (
    <div className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-5">
      <AlertTriangle size={20} className="flex-shrink-0 text-red-500" />
      <p className="text-sm font-semibold text-red-700">{error}</p>
    </div>
  );

  const hasData = data && data.pets.length > 0;
  const dateStr = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  /* Build slot→meds map for the "today" column */
  const bySlot: Record<Slot, SlotMed[]> = { Sáng: [], Trưa: [], Chiều: [], Tối: [] };

  if (hasData) {
    for (const pet of data.pets) {
      for (const med of pet.medications) {
        for (const slot of med.timeSlots as Slot[]) {
          if (bySlot[slot]) {
            bySlot[slot].push({ ...med, petName: pet.petName, petSpecies: pet.species });
          }
        }
      }
    }
  }

  const urgentTotal = hasData
    ? data.pets.flatMap((p) => p.medications).filter((m) => m.daysRemaining <= 2).length
    : 0;

  return (
    <div className="w-full">

      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Lịch thuốc thú cưng</h2>
          <p className="mt-0.5 text-sm text-slate-500">{dateStr}</p>
        </div>

        {hasData && (
          <div className="flex items-center gap-3">
            {urgentTotal > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">
                <AlertTriangle size={12} />
                {urgentTotal} sắp hết thuốc
              </div>
            )}
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm">
              <Pill size={13} className="text-cyan-600" />
              <span className="text-xs font-bold text-slate-700">{data.totalActive} loại</span>
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!hasData ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 size={30} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-700">Không có thuốc đang dùng</p>
            <p className="mt-1 text-sm text-slate-400">Tất cả thú cưng đều khoẻ mạnh 🎉</p>
          </div>
        </div>
      ) : (
        /* Two-column layout */
        <div className="flex items-start gap-6">

          {/* LEFT (60%): Today's schedule by time slot */}
          <div className="min-w-0 flex-[3]">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Lịch uống hôm nay
            </p>

            {SLOTS.every((s) => bySlot[s].length === 0) ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
                <p className="text-sm text-slate-400">Không có ca uống thuốc nào hôm nay</p>
              </div>
            ) : (
              <div className="space-y-3">
                {SLOTS.map((slot) => (
                  <SlotBlock key={slot} slot={slot} meds={bySlot[slot]} />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT (40%): Per-pet detail with countdown rings */}
          <div className="w-72 flex-shrink-0">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Trạng thái từng bé
            </p>
            <div className="space-y-3">
              {data.pets.map((pet) => (
                <PetDetailCard key={pet.petId} pet={pet} />
              ))}
            </div>

            {/* Legend */}
            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Chú thích vòng đếm ngược
              </p>
              <div className="space-y-1.5">
                {(
                  [
                    { level: "green", label: "Còn nhiều (> 5 ngày)" },
                    { level: "amber", label: "Sắp hết (3–5 ngày)" },
                    { level: "red",   label: "Rất ít (≤ 2 ngày)" },
                  ] as const
                ).map(({ level, label }) => (
                  <div key={level} className="flex items-center gap-2">
                    <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: U[level].ring }} />
                    <span className="text-[11px] text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
