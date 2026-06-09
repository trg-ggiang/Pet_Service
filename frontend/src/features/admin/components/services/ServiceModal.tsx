import { useState } from "react";
import {
  Check,
  ChevronDown,
  Plus,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import {
  CATEGORY_CONFIG,
  EMPTY_SERVICE,
} from "../../constants/services.constants";
import type {
  Category,
  PriceVariant,
  Service,
} from "../../types/services.types";

export function ServiceModal({
  editing,
  onClose,
  onSave,
}: {
  editing: Service | null;
  onClose: () => void;
  onSave: (svc: Service) => void;
}) {
  const isEdit = !!editing;
  const [form, setForm] = useState<
    Omit<Service, "id" | "bookingsMonth" | "revenueMonth">
  >(
    editing
      ? {
          category: editing.category,
          name: editing.name,
          description: editing.description,
          duration: editing.duration,
          durationUnit: editing.durationUnit,
          pricingType: editing.pricingType,
          basePrice: editing.basePrice,
          variants: editing.variants ?? EMPTY_SERVICE.variants,
          status: editing.status,
          tag: editing.tag,
        }
      : { ...EMPTY_SERVICE },
  );

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const setVariant = (
    i: number,
    field: keyof PriceVariant,
    val: string | number,
  ) =>
    setForm((f) => {
      const vs = [...(f.variants ?? [])];
      vs[i] = { ...vs[i], [field]: val };
      return { ...f, variants: vs };
    });

  const addVariant = () =>
    setForm((f) => ({
      ...f,
      variants: [...(f.variants ?? []), { label: "", price: 0 }],
    }));

  const removeVariant = (i: number) =>
    setForm((f) => ({
      ...f,
      variants: (f.variants ?? []).filter((_, j) => j !== i),
    }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      ...form,
      id: editing?.id ?? `SV-${Date.now()}`,
      bookingsMonth: editing?.bookingsMonth ?? 0,
      revenueMonth: editing?.revenueMonth ?? 0,
    });
  };

  const catOptions: { v: Category; label: string; icon: React.ElementType }[] =
    [
      { v: "clinic", label: "Khám bệnh", icon: CATEGORY_CONFIG.clinic.icon },
      {
        v: "vaccination",
        label: "Tiêm chủng",
        icon: CATEGORY_CONFIG.vaccination.icon,
      },
      { v: "grooming", label: "Grooming", icon: CATEGORY_CONFIG.grooming.icon },
      { v: "boarding", label: "Lưu trú", icon: CATEGORY_CONFIG.boarding.icon },
    ];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="w-[520px] bg-white h-full shadow-2xl flex flex-col border-l border-border">
        <div className="px-6 py-5 border-b border-border flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-foreground tracking-tight">
              {isEdit ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEdit
                ? `Đang sửa: ${editing!.name}`
                : "Điền thông tin để tạo dịch vụ mới"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors mt-0.5"
          >
            <X size={15} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">
              Danh mục dịch vụ
            </label>
            <div className="grid grid-cols-2 gap-2">
              {catOptions.map(({ v, label, icon: Icon }) => {
                const cfg = CATEGORY_CONFIG[v];
                return (
                  <button
                    key={v}
                    onClick={() => !isEdit && set("category", v)}
                    disabled={isEdit}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-[13px] font-medium transition-all text-left ${form.category === v ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "border-border bg-muted/30 text-muted-foreground"} disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    <Icon
                      size={15}
                      className={
                        form.category === v
                          ? cfg.color
                          : "text-muted-foreground"
                      }
                    />
                    {label}
                    {form.category === v && (
                      <Check
                        size={13}
                        className={`${cfg.color} ml-auto flex-shrink-0`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {isEdit && (
              <p className="text-[11px] text-muted-foreground mt-1.5 italic">
                Không thể đổi danh mục sau khi tạo.
              </p>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">
              Tên dịch vụ
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="VD: Khám tổng quát, Tắm & sấy tiêu chuẩn..."
              className="w-full h-10 px-4 border border-border rounded-xl text-[14px] font-semibold text-foreground placeholder:font-normal placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">
              Mô tả
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="Mô tả chi tiết dịch vụ, bao gồm những gì..."
              className="w-full px-4 py-3 border border-border rounded-xl text-[13.5px] leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">
              Thời gian thực hiện
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={form.duration}
                onChange={(e) => set("duration", Number(e.target.value))}
                className="w-24 h-10 px-3 border border-border rounded-xl text-[14px] font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white"
              />
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                {(["phút", "đêm", "ngày"] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => set("durationUnit", u)}
                    className={`px-3 py-1.5 rounded-md text-[12.5px] font-semibold transition-colors ${form.durationUnit === u ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">
              Kiểu định giá
            </label>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => set("pricingType", "fixed")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-semibold transition-all ${form.pricingType === "fixed" ? "bg-cyan-50 border-cyan-300 text-cyan-700" : "border-border bg-white text-muted-foreground hover:bg-muted"}`}
              >
                {form.pricingType === "fixed" && (
                  <Check size={13} className="text-cyan-600" />
                )}
                Giá cố định
              </button>
              <button
                onClick={() => set("pricingType", "variants")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-semibold transition-all ${form.pricingType === "variants" ? "bg-cyan-50 border-cyan-300 text-cyan-700" : "border-border bg-white text-muted-foreground hover:bg-muted"}`}
              >
                {form.pricingType === "variants" && (
                  <Check size={13} className="text-cyan-600" />
                )}
                Theo kích thước / biến thể
              </button>
            </div>

            {form.pricingType === "fixed" ? (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
                  ₫
                </span>
                <input
                  type="number"
                  value={form.basePrice || ""}
                  onChange={(e) => set("basePrice", Number(e.target.value))}
                  placeholder="0"
                  className="w-full h-10 pl-8 pr-4 border border-border rounded-xl text-[14px] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white"
                />
              </div>
            ) : (
              <div className="space-y-2">
                {(form.variants ?? []).map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={v.label}
                      onChange={(e) => setVariant(i, "label", e.target.value)}
                      placeholder="Tên biến thể"
                      className="flex-1 h-9 px-3 border border-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white"
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">
                        ₫
                      </span>
                      <input
                        type="number"
                        value={v.price || ""}
                        onChange={(e) =>
                          setVariant(i, "price", Number(e.target.value))
                        }
                        placeholder="0"
                        className="w-32 h-9 pl-7 pr-3 border border-border rounded-lg text-[13px] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white"
                      />
                    </div>
                    <button
                      onClick={() => removeVariant(i)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <X
                        size={13}
                        className="text-muted-foreground hover:text-red-500"
                      />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addVariant}
                  className="w-full flex items-center justify-center gap-2 h-9 border border-dashed border-border rounded-lg text-[12.5px] font-medium text-muted-foreground hover:text-foreground hover:border-slate-400 hover:bg-muted/30 transition-all"
                >
                  <Plus size={13} /> Thêm biến thể
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
            <div>
              <div className="text-[13px] font-semibold text-foreground">
                Trạng thái dịch vụ
              </div>
              <div className="text-[12px] text-muted-foreground mt-0.5">
                {form.status === "active"
                  ? "Dịch vụ đang hiển thị và nhận đặt lịch"
                  : "Dịch vụ tạm ngưng, không nhận đặt lịch mới"}
              </div>
            </div>
            <button
              onClick={() =>
                set("status", form.status === "active" ? "inactive" : "active")
              }
            >
              {form.status === "active" ? (
                <ToggleRight size={36} className="text-primary" />
              ) : (
                <ToggleLeft size={36} className="text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center gap-3 flex-shrink-0 bg-muted/20">
          <button
            onClick={onClose}
            className="flex-1 h-10 border border-border bg-white rounded-xl text-[13px] font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Huỷ bỏ
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim()}
            className="flex-1 h-10 bg-primary text-primary-foreground rounded-xl text-[13px] font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-cyan-500/20"
          >
            {isEdit ? "Lưu thay đổi" : "Tạo dịch vụ"}
          </button>
        </div>
      </div>
    </div>
  );
}
