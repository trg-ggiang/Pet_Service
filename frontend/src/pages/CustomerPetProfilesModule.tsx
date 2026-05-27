import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, CheckCircle2, ChevronDown, ChevronLeft, ClipboardList, Download, Heart, Loader2, Pencil, Plus, Scissors, Syringe, Upload, X, Calendar as CalendarIcon } from "lucide-react";
import {
  createCustomerPet,
  downloadCustomerInvoicePdf,
  fetchCustomerPetDashboard,
  fetchPetDetail,
  updateCustomerPet,
  type BreedOption,
  type CustomerPetDashboard,
  type PetDetail,
  type PetSummary,
  type SpeciesOption,
} from "../services/customerPets";
import { Calendar as CalendarPicker } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";

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

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Chưa có" : date.toLocaleDateString("vi-VN");
}

function formatCurrency(amount?: number | null) {
  if (amount == null) return "0₫";
  return new Intl.NumberFormat("vi-VN").format(amount) + "₫";
}

function getGenderLabel(gender: PetSummary["gender"]) {
  if (gender === "MALE") return "Đực";
  if (gender === "FEMALE") return "Cái";
  return "Chưa xác định";
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDateForInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) return date;
    return null;
  }

  const viMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (viMatch) {
    const day = Number(viMatch[1]);
    const month = Number(viMatch[2]);
    const year = Number(viMatch[3]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) return date;
    return null;
  }

  return null;
}

function isFutureDate(value: string) {
  if (!value) return false;
  const selected = new Date(`${value}T00:00:00`);
  if (Number.isNaN(selected.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected > today;
}

const HISTORY_TABS = [
  { id: "overview", label: "Tổng quan", icon: Heart },
  { id: "medical", label: "Lịch sử khám", icon: ClipboardList },
  { id: "vaccine", label: "Tiêm chủng", icon: Syringe },
  { id: "grooming", label: "Grooming", icon: Scissors },
  { id: "boarding", label: "Lưu trú", icon: ChevronLeft },
  { id: "invoice", label: "Hóa đơn", icon: CheckCircle2 },
] as const;

type PetDetailTab = typeof HISTORY_TABS[number]["id"];

export function CustomerPetProfilesModule() {
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
                        onClick={() => void openPetDetail(pet)}
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

type PetFormMode = "create" | "edit";

function buildPetFormState(pet?: PetDetail["pet"] | null, speciesFallback?: number, breedOptions: BreedOption[] = []) {
  const dobDate = pet?.dob ? parseDateInput(pet.dob) : null;
  const nextSpeciesId = pet?.species_id ?? speciesFallback ?? 1;
  const defaultBreedId = pet?.breed_id
    ? String(pet.breed_id)
    : String(breedOptions.find((breed) => breed.species_id === nextSpeciesId)?.id ?? "");

  return {
    name: pet?.name ?? "",
    speciesId: nextSpeciesId,
    breedId: defaultBreedId,
    gender: pet?.gender ?? ("UNKNOWN" as const),
    dob: dobDate ? formatDateForInput(dobDate) : "",
    weight: pet?.weight != null ? String(pet.weight) : "",
    color: pet?.color ?? "",
    imgUrl: pet?.img_url ?? "",
    allergies: pet?.allergies ?? "Không có",
    chronicDiseases: pet?.chronic_diseases ?? "Không có",
    specialNote: pet?.special_note ?? "Không có",
  };
}

function PetFormModal({
  mode,
  initialPet,
  speciesOptions,
  breedOptions,
  onClose,
  onSubmit,
}: {
  mode: PetFormMode;
  initialPet?: PetDetail["pet"] | null;
  speciesOptions: SpeciesOption[];
  breedOptions: BreedOption[];
  onClose: () => void;
  onSubmit: (payload: {
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
  }) => Promise<void>;
}) {
  const [form, setForm] = useState(() => buildPetFormState(initialPet, speciesOptions[0]?.id, breedOptions));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imgUrlBroken, setImgUrlBroken] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredBreeds = useMemo(
    () => breedOptions.filter((breed) => breed.species_id === form.speciesId),
    [breedOptions, form.speciesId],
  );

  useEffect(() => {
    if (speciesOptions.length > 0 && !speciesOptions.some((species) => species.id === form.speciesId)) {
      setForm((prev) => ({ ...prev, speciesId: speciesOptions[0].id, breedId: "" }));
      return;
    }

    if (filteredBreeds.length > 0 && !filteredBreeds.some((breed) => String(breed.id) === form.breedId)) {
      setForm((prev) => ({ ...prev, breedId: String(filteredBreeds[0].id) }));
    }
  }, [breedOptions, filteredBreeds, form.breedId, form.speciesId, speciesOptions]);

  useEffect(() => {
    setForm(buildPetFormState(initialPet, speciesOptions[0]?.id, breedOptions));
    setError("");
    setImgUrlBroken(false);
  }, [breedOptions, initialPet, mode, speciesOptions]);

  useEffect(() => {
    setImgUrlBroken(false);
  }, [form.imgUrl]);

  const selectedDobDate = form.dob ? parseDateInput(form.dob) : null;

  const defaultCover = (form.speciesId === 1
    ? "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&h=520&fit=crop"
    : form.speciesId === 2
      ? "https://images.unsplash.com/photo-1513245543132-31f507417b26?w=800&h=520&fit=crop"
      : form.speciesId === 3
        ? "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&h=520&fit=crop"
        : "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&h=520&fit=crop");

  const previewCover = !imgUrlBroken && form.imgUrl ? form.imgUrl : defaultCover;

  const validate = () => {
    if (!form.name.trim()) return "Vui lòng nhập tên thú cưng.";
    if (!Number.isFinite(form.speciesId) || !speciesOptions.some((species) => species.id === form.speciesId)) return "Vui lòng chọn giống loài hợp lệ.";
    if (!form.breedId || !filteredBreeds.some((breed) => String(breed.id) === form.breedId)) return "Vui lòng chọn giống hợp lệ.";
    if (!form.gender) return "Vui lòng chọn giới tính.";
    if (!form.dob.trim()) return "Vui lòng chọn ngày sinh.";
    if (!form.weight.trim()) return "Vui lòng nhập cân nặng.";
    if (Number.isNaN(Number(form.weight))) return "Cân nặng phải là số hợp lệ.";
    if (!form.color.trim()) return "Vui lòng nhập màu lông.";
    if (!form.imgUrl.trim()) return "Vui lòng nhập ảnh đại diện hoặc chọn ảnh từ máy.";
    if (!form.allergies.trim()) return "Vui lòng nhập dị ứng, hoặc nhập 'Không có'.";
    if (!form.chronicDiseases.trim()) return "Vui lòng nhập bệnh nền, hoặc nhập 'Không có'.";
    if (!form.specialNote.trim()) return "Vui lòng nhập ghi chú đặc biệt, hoặc nhập 'Không có'.";
    if (form.dob && isFutureDate(form.dob)) {
      return "Ngày sinh không được lớn hơn ngày hiện tại.";
    }
    return "";
  };

  const submit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const speciesId = speciesOptions.some((species) => species.id === form.speciesId)
        ? form.speciesId
        : speciesOptions[0]?.id;

      if (!speciesId) {
        setError("Vui lòng chọn giống loài hợp lệ.");
        return;
      }

      await onSubmit({
        name: form.name.trim(),
        speciesId,
        breedId: form.breedId ? Number(form.breedId) : null,
        gender: form.gender,
        dob: form.dob || null,
        weight: Number(form.weight),
        color: form.color.trim(),
        imgUrl: form.imgUrl.trim(),
        allergies: form.allergies.trim(),
        chronicDiseases: form.chronicDiseases.trim(),
        specialNote: form.specialNote.trim(),
      });
      onClose();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : mode === "edit" ? "Không thể cập nhật hồ sơ thú cưng." : "Không thể tạo hồ sơ thú cưng.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-3xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between rounded-t-3xl">
          <h3 className="text-lg font-bold text-slate-900">{mode === "edit" ? "Chỉnh sửa hồ sơ thú cưng" : "Thêm thú cưng mới"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-50 mb-4">
            <div className="h-36 relative">
              <img
                src={previewCover}
                alt="Preview cover"
                className="w-full h-full object-cover"
                onError={() => setImgUrlBroken(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-slate-950/10 to-transparent" />
            </div>
            <div className="absolute left-4 top-4 w-14 h-14 rounded-2xl border-2 border-white shadow-md overflow-hidden bg-white/90 backdrop-blur-sm flex items-center justify-center">
              {form.imgUrl && !imgUrlBroken ? (
                <img
                  src={form.imgUrl}
                  alt="Preview avatar"
                  className="w-full h-full object-cover"
                  onError={() => setImgUrlBroken(true)}
                />
              ) : (
                <Camera size={22} className="text-slate-400" />
              )}
            </div>
            <div className="absolute left-4 bottom-4 text-white">
              <div className="text-sm font-bold leading-tight">Ảnh bìa hồ sơ</div>
              <div className="text-[11px] text-white/80">Dùng ảnh URL hoặc ảnh từ máy</div>
            </div>
          </div>

          <Field label="Tên thú cưng" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} placeholder="VD: Mochi" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <SelectField label="Giống loài" value={String(form.speciesId)} onChange={(value) => setForm((prev) => ({ ...prev, speciesId: Number(value), breedId: "" }))} options={speciesOptions.map((species) => ({ label: species.name, value: String(species.id) }))} />
            </div>
            <SelectField label="Giống (Breed)" value={form.breedId} onChange={(value) => setForm((prev) => ({ ...prev, breedId: value }))} options={filteredBreeds.map((breed) => ({ label: breed.name, value: String(breed.id) }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Giới tính"
              value={form.gender}
              onChange={(value) => setForm((prev) => ({ ...prev, gender: value as typeof form.gender }))}
              options={[
                { label: "Đực", value: "MALE" },
                { label: "Cái", value: "FEMALE" },
                { label: "Chưa xác định", value: "UNKNOWN" },
              ]}
            />
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Ngày sinh</label>
              <div className="grid grid-cols-[minmax(0,1fr)_84px] gap-2 items-end">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="h-11 w-full min-w-0 px-4 rounded-xl border border-slate-200 bg-slate-50 text-left text-sm font-semibold text-slate-900 transition-all flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                    >
                      <span className={form.dob ? "truncate text-slate-900" : "truncate text-slate-400"}>
                        {form.dob ? formatDate(form.dob) : "Chọn ngày sinh"}
                      </span>
                      <CalendarIcon size={16} className="flex-shrink-0 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto border-0 bg-transparent p-0 shadow-none" align="start" side="bottom" sideOffset={8} avoidCollisions={false}>
                    <CalendarPicker
                      className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
                      mode="single"
                      selected={selectedDobDate ?? undefined}
                      onSelect={(selectedDate) =>
                        setForm((prev) => ({
                          ...prev,
                          dob: selectedDate ? formatDateForInput(selectedDate) : "",
                        }))
                      }
                      disabled={{ after: new Date() }}
                    />
                  </PopoverContent>
                </Popover>

                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, dob: "" }))}
                  disabled={!form.dob}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Xoá
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Cân nặng (kg)" value={form.weight} onChange={(value) => setForm((prev) => ({ ...prev, weight: value }))} placeholder="4.2" />
            <Field label="Màu lông" value={form.color} onChange={(value) => setForm((prev) => ({ ...prev, color: value }))} placeholder="Xám xanh" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Ảnh đại diện</label>
            <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-start">
              <div>
                <input
                  value={form.imgUrl}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, imgUrl: e.target.value }));
                    setImgUrlBroken(false);
                  }}
                  type="text"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  placeholder="https://... (link ảnh trực tiếp)"
                />
                <p className="mt-1 text-[11px] text-slate-500">Hoặc chọn ảnh từ máy để tự chuyển thành ảnh xem trước và lưu cùng hồ sơ.</p>
              </div>
              <div className="flex items-center gap-2 md:pt-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") {
                        setForm((prev) => ({ ...prev, imgUrl: reader.result as string }));
                        setImgUrlBroken(false);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-11 w-11 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center"
                  aria-label="Chọn ảnh trong máy"
                >
                  <Upload size={16} />
                </button>
              </div>
            </div>
            {form.imgUrl && imgUrlBroken && (
              <p className="mt-1 text-[11px] text-red-600 font-semibold">
                Link ảnh không tải được. Hãy dùng link ảnh trực tiếp/public (mở link ra phải thấy 1 ảnh, không phải trang web).
              </p>
            )}
          </div>

          <Field label="Dị ứng" value={form.allergies} onChange={(value) => setForm((prev) => ({ ...prev, allergies: value }))} placeholder="Không có nếu không dị ứng" />
          <Field label="Bệnh nền" value={form.chronicDiseases} onChange={(value) => setForm((prev) => ({ ...prev, chronicDiseases: value }))} placeholder="Không có nếu không bệnh nền" />
          <Field label="Ghi chú đặc biệt" value={form.specialNote} onChange={(value) => setForm((prev) => ({ ...prev, specialNote: value }))} placeholder="Không có nếu không có ghi chú" />
          <p className="text-[11px] text-slate-500 -mt-2">Nếu không có dị ứng, bệnh nền hoặc ghi chú đặc biệt thì nhập <span className="font-semibold text-slate-700">Không có</span>.</p>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-5 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="h-11 px-5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">Huỷ</button>
          <button onClick={() => void submit()} disabled={saving} className="h-11 px-5 rounded-xl text-sm font-bold text-white shadow-sm hover:shadow-md transition-all disabled:opacity-70" style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}>
            {saving ? "Đang lưu..." : mode === "edit" ? "Cập nhật thú cưng" : "Lưu thú cưng"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PetDetailModal({
  pet,
  detail,
  loading,
  onEdit,
  onClose,
}: {
  pet: PetSummary;
  detail: PetDetail | null;
  loading: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<PetDetailTab>("overview");
  const [downloadError, setDownloadError] = useState("");
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<number | null>(null);
  const clr = getPetColorById(pet.colorId);
  const latestVaccination = detail?.vaccinations?.[0] ?? null;
  const latestMedicalVisit = detail?.medicalVisits?.[0] ?? null;

  const handleDownloadInvoice = async (invoiceId: number) => {
    try {
      setDownloadingInvoiceId(invoiceId);
      setDownloadError("");
      await downloadCustomerInvoicePdf(invoiceId);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Khong the tai hoa don PDF.");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            {pet.image ? (
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex-shrink-0">
                <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${clr.from}, ${clr.to})` }}>
                <span className="text-xl font-bold text-white">{pet.initials}</span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-900">{pet.name}</h3>
              <p className="text-sm text-slate-500">{pet.species} • {pet.breed} • {getGenderLabel(pet.gender)}</p>
            </div>
            <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ring-1 ring-inset ${pet.healthy ? "bg-emerald-50 text-emerald-700 ring-emerald-200/50" : "bg-amber-50 text-amber-700 ring-amber-200/50"}`}>
              {pet.healthy ? "Khoẻ mạnh" : "Cần theo dõi"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="h-9 px-3 rounded-full flex items-center gap-2 text-sm font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 transition-colors">
              <Pencil size={15} />
              Chỉnh sửa
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="border-b border-slate-100 px-6 flex gap-1 overflow-x-auto">
          {HISTORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${active ? "text-cyan-600" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Icon size={14} />
                {tab.label}
                {active && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-500 rounded-t-full" />}
              </button>
            );
          })}
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải chi tiết thú cưng...
            </div>
          )}

          {downloadError && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {downloadError}
            </div>
          )}

          {!loading && detail && activeTab === "overview" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { label: "Ngày sinh", value: formatDate(pet.dob) },
                  { label: "Cân nặng", value: pet.weight },
                  { label: "Khám gần nhất", value: pet.lastVisit },
                  { label: "Tiêm nhắc", value: pet.nextVaccine },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</div>
                    <div className="text-base font-bold text-slate-800">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <SummaryCard title="Thông tin sức khoẻ" items={[
                  { label: "Dị ứng", value: pet.allergies ?? "Không có" },
                  { label: "Bệnh nền", value: pet.chronicDiseases ?? "Không có" },
                  { label: "Ghi chú", value: pet.specialNote ?? "Không có" },
                ]} />
                <SummaryCard title="Tiêm chủng gần nhất" items={latestVaccination ? [
                  { label: latestVaccination.vaccine_name, value: formatDate(latestVaccination.date_given) },
                  { label: "Lịch tiêm tiếp theo", value: formatDate(latestVaccination.next_due_date) },
                  { label: "Ghi chú", value: latestVaccination.note ?? "Không có" },
                ] : [{ label: "Trạng thái", value: "Chưa có lịch tiêm" }]} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <SummaryCard title="Lần khám gần nhất" items={latestMedicalVisit ? [
                  { label: "Triệu chứng", value: latestMedicalVisit.symptoms ?? "Không có" },
                  { label: "Chẩn đoán", value: latestMedicalVisit.diagnosis_note ?? "Không có" },
                  { label: "Tái khám", value: formatDate(latestMedicalVisit.next_visit_date) },
                ] : [{ label: "Trạng thái", value: "Chưa có lịch khám" }]} />
                <SummaryCard title="Thống kê nhanh" items={[
                  { label: "Lịch hẹn", value: String(detail.appointments.length) },
                  { label: "Vaccine", value: String(detail.vaccinations.length) },
                  { label: "Hóa đơn", value: String(detail.invoices.length) },
                ]} />
              </div>
            </div>
          )}

          {!loading && detail && activeTab === "medical" && <TimelineList rows={detail.medicalVisits.map((row) => ({ title: row.diagnosis_note ?? "Khám thú y", subtitle: row.symptoms ?? "", meta: formatDate(row.created_at) }))} emptyText="Chưa có lịch sử khám." />}
          {!loading && detail && activeTab === "vaccine" && <TimelineList rows={detail.vaccinations.map((row) => ({ title: row.vaccine_name, subtitle: row.note ?? "", meta: `${formatDate(row.date_given)} · nhắc ${formatDate(row.next_due_date)}` }))} emptyText="Chưa có lịch tiêm chủng." />}
          {!loading && detail && activeTab === "grooming" && <TimelineList rows={detail.groomingRecords.map((row) => ({ title: row.status, subtitle: row.notes ?? "", meta: formatDate(row.started_at) }))} emptyText="Chưa có dữ liệu grooming." />}
          {!loading && detail && activeTab === "boarding" && <TimelineList rows={detail.boardingRecords.map((row) => ({ title: row.current_status, subtitle: row.special_note ?? row.habit_note ?? "", meta: `${formatDate(row.check_in)} → ${formatDate(row.check_out)}` }))} emptyText="Chưa có dữ liệu lưu trú." />}
          {!loading && detail && activeTab === "invoice" && (
            detail.invoices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-500">Chưa có hóa đơn.</div>
            ) : (
              <div className="space-y-3">
                {detail.invoices.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{formatCurrency(row.total_amount)} · {row.payment_status}</div>
                        <div className="text-sm text-slate-500 mt-1">{row.transaction_code ?? row.status}</div>
                        <div className="text-xs font-semibold text-slate-400 mt-1">{formatDate(row.created_at)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDownloadInvoice(row.id)}
                        disabled={downloadingInvoiceId === row.id}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {downloadingInvoiceId === row.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        Tải PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, items }: { title: string; items: Array<{ label: string; value: string }> }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-bold text-slate-900 mb-3">{title}</div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-4">
            <div className="text-sm text-slate-500">{item.label}</div>
            <div className="text-sm font-semibold text-slate-900 text-right max-w-[65%]">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineList({ rows, emptyText }: { rows: Array<{ title: string; subtitle: string; meta: string }>; emptyText: string }) {
  if (rows.length === 0) {
    return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-500">{emptyText}</div>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={`${row.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-slate-900">{row.title}</div>
              <div className="text-sm text-slate-500 mt-1">{row.subtitle}</div>
            </div>
            <div className="text-xs font-semibold text-slate-400 whitespace-nowrap">{row.meta}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} type="text" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" placeholder={placeholder} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ label: string; value: string }> }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value) ?? null;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-left text-sm font-semibold text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
      >
        <span className={selectedOption ? "truncate text-slate-900" : "truncate text-slate-400"}>
          {selectedOption?.label ?? (options.length === 0 ? "Chưa có lựa chọn" : "Chọn...")}
        </span>
        <ChevronDown size={16} className={`flex-shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          {options.length === 0 ? (
            <div className="flex h-11 items-center px-4 text-sm font-medium text-slate-400">Chưa có lựa chọn</div>
          ) : (
            options.map((option, index) => {
              const selected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`relative flex h-10 w-full items-center px-4 pr-10 text-left text-sm font-extrabold transition-colors ${
                    selected ? "bg-cyan-50 text-cyan-700" : "text-slate-700 hover:bg-slate-50"
                  } ${index === 0 ? "rounded-t-2xl" : ""} ${index === options.length - 1 ? "rounded-b-2xl" : "border-b border-slate-100"}`}
                >
                  <span className="truncate">{option.label}</span>
                  {selected && <Check size={16} strokeWidth={3} className="absolute right-4 top-1/2 -translate-y-1/2 flex-shrink-0 text-cyan-700" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
