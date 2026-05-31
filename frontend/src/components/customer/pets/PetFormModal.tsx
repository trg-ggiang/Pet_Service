import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, ChevronDown, Upload, X, Calendar as CalendarIcon } from "lucide-react";
import type { BreedOption, PetDetail, SpeciesOption } from "../../../types/customer/pets";
import { Calendar as CalendarPicker } from "../../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";

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

export function PetFormModal({
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

