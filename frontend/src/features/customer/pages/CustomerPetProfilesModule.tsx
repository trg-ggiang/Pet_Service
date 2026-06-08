import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import {
  createCustomerPet,
  fetchCustomerPetDashboard,
  fetchPetDetail,
  updateCustomerPet,
  type CustomerPetDashboard,
  type PetDetail,
  type PetSummary,
} from "../../../services/customer/customerPetsApi";
import { PetFormModal } from "../../../components/customer/pets/PetFormModal";
import { PetDetailModal } from "../../../components/customer/pets/PetDetailModal";

const PET_COLOR_PRESETS = [
  { id: "amber", from: "#FB923C", to: "#EA580C", ring: "#FBBF24" },
  { id: "slate", from: "#94A3B8", to: "#475569", ring: "#64748B" },
  { id: "cyan", from: "#22D3EE", to: "#0891B2", ring: "#06B6D4" },
  { id: "rose", from: "#FB7185", to: "#E11D48", ring: "#F43F5E" },
  { id: "violet", from: "#A78BFA", to: "#7C3AED", ring: "#8B5CF6" },
  { id: "emerald", from: "#34D399", to: "#059669", ring: "#10B981" },
];

const PET_COVER_IMAGES: Record<string, string> = {
  "Chó": "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1200&h=420&fit=crop",
  "Mèo": "https://images.unsplash.com/photo-1513245543132-31f507417b26?w=1200&h=420&fit=crop",
  "Thỏ": "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=1200&h=420&fit=crop",
  default: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=1200&h=420&fit=crop",
};

function getPetColorById(id: string) {
  return PET_COLOR_PRESETS.find((item) => item.id === id) ?? PET_COLOR_PRESETS[0];
}

function getPetCoverImage(species?: string) {
  return (species && PET_COVER_IMAGES[species]) || PET_COVER_IMAGES.default;
}

export function CustomerPetProfilesModule({ onBookAppointment }: { onBookAppointment?: (petName: string) => void }) {
  const [dashboard, setDashboard] = useState<CustomerPetDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<PetDetail["pet"] | null>(null);
  const [selectedPet, setSelectedPet] = useState<PetSummary | null>(null);
  const [detail, setDetail] = useState<PetDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      else setRefreshing(true);
      setError("");
      const result = await fetchCustomerPetDashboard();
      setDashboard(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu thú cưng.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const speciesOptions = dashboard?.species ?? [];
  const breedOptions = dashboard?.breeds ?? [];

  const openPetDetail = async (pet: PetSummary) => {
    setSelectedPet(pet);
    setDetail(null);
    setDetailLoading(true);
    try {
      const result = await fetchPetDetail(pet.id);
      setDetail(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải hồ sơ thú cưng.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreatePet = async (payload: {
    name: string;
    speciesId: number;
    breedId?: number | null;
    gender: "MALE" | "FEMALE" | "UNKNOWN";
    dob?: string | null;
    weight?: string | number | null;
    color?: string | null;
    imgUrl?: string | null;
    allergies?: string | null;
    chronicDiseases?: string | null;
    specialNote?: string | null;
  }) => {
    await createCustomerPet({
      ...payload,
    });
    setIsAddOpen(false);
    await loadDashboard(false);
  };

  const handleUpdatePet = async (petId: number, payload: {
    name: string;
    speciesId: number;
    breedId?: number | null;
    gender: "MALE" | "FEMALE" | "UNKNOWN";
    dob?: string | null;
    weight?: string | number | null;
    color?: string | null;
    imgUrl?: string | null;
    allergies?: string | null;
    chronicDiseases?: string | null;
    specialNote?: string | null;
  }) => {
    await updateCustomerPet(petId, payload);
    setEditingPet(null);
    await loadDashboard(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Hồ sơ thú cưng của tôi</h2>
          <p className="text-sm text-slate-500 mt-1">
            {dashboard ? `Khách hàng: ${dashboard.customer.full_name} · ${dashboard.pets.length} hồ sơ` : "Đang tải dữ liệu thực tế từ Supabase..."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void loadDashboard(false)}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {refreshing ? "Đang làm mới..." : "Làm mới"}
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white shadow-sm hover:shadow-md transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
          >
            <Plus size={16} strokeWidth={2.5} /> Thêm thú cưng
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải hồ sơ thú cưng...
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && dashboard && (
        <>
          <div className="grid md:grid-cols-2 gap-5">
            {dashboard.pets.map((pet) => {
              const clr = getPetColorById(pet.colorId);
              const coverImage = pet.image || getPetCoverImage(pet.species);
              return (
                <div key={pet.id} className="relative z-0 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="h-36 relative overflow-hidden">
                    <img
                      src={coverImage}
                      alt={`${pet.species} ${pet.name}`}
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        const target = event.currentTarget as HTMLImageElement;
                        const fallback = getPetCoverImage(pet.species);
                        if (target.src !== fallback) {
                          target.src = fallback;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/15 to-transparent" />
                    <div className="absolute left-5 bottom-4 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-white/90 text-slate-800 text-[11px] font-bold shadow-sm backdrop-blur-sm">{pet.species}</span>
                      <span className="px-2.5 py-1 rounded-full bg-cyan-500/90 text-white text-[11px] font-bold shadow-sm backdrop-blur-sm">{pet.breed}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      {pet.image ? (
                        <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 shadow-md" style={{ border: `3px solid ${clr.ring}` }}>
                          <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 shadow-md" style={{ background: `linear-gradient(135deg, ${clr.from}, ${clr.to})`, border: "3px solid white" }}>
                          <span className="text-2xl font-bold text-white">{pet.initials}</span>
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 text-xl tracking-tight">{pet.name}</div>
                        <div className="text-sm font-medium text-slate-500 mt-0.5">{pet.species} • {pet.breed}</div>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ring-1 ring-inset ${pet.healthy ? "bg-emerald-50 text-emerald-700 ring-emerald-200/50" : "bg-amber-50 text-amber-700 ring-amber-200/50"}`}>
                            {pet.healthy ? "Khoẻ mạnh" : "Cần theo dõi"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100">
                      {[
                        { label: "Tuổi", value: pet.age },
                        { label: "Cân nặng", value: pet.weight },
                        { label: "Tiêm nhắc", value: pet.nextVaccine },
                      ].map((info) => (
                        <div key={info.label} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{info.label}</div>
                          <div className="text-sm font-bold text-slate-800 mt-1">{info.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => void openPetDetail(pet)}
                        className="flex-1 h-11 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        Hồ sơ đầy đủ
                      </button>
                      <button
                        onClick={() => {
                          if (onBookAppointment) onBookAppointment(pet.name);
                          else void openPetDetail(pet);
                        }}
                        className="flex-1 h-11 rounded-xl text-sm font-bold text-white shadow-sm transition-colors hover:shadow-md"
                        style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
                      >
                        Đặt lịch khám
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {dashboard.pets.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center text-slate-500">
              Chưa có thú cưng nào trong hồ sơ khách hàng này.
            </div>
          )}
        </>
      )}

      {isAddOpen && (
        <PetFormModal
          mode="create"
          speciesOptions={speciesOptions}
          breedOptions={breedOptions}
          onClose={() => setIsAddOpen(false)}
          onSubmit={handleCreatePet}
        />
      )}

      {editingPet && (
        <PetFormModal
          mode="edit"
          initialPet={editingPet}
          speciesOptions={speciesOptions}
          breedOptions={breedOptions}
          onClose={() => setEditingPet(null)}
          onSubmit={(payload) => handleUpdatePet(editingPet.id, payload)}
        />
      )}

      {selectedPet && (
        <PetDetailModal
          pet={selectedPet}
          detail={detail}
          loading={detailLoading}
          onEdit={() => {
            if (detail?.pet) {
              setEditingPet(detail.pet);
              setSelectedPet(null);
              setDetail(null);
            }
          }}
          onClose={() => {
            setSelectedPet(null);
            setDetail(null);
          }}
        />
      )}
    </div>
  );
}

