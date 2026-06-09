import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import {
  APPOINTMENT_DOCTORS,
  APPOINTMENT_SERVICES,
} from "../../constants/appointments.constants";
import { Appointment, Status } from "../../types/appointments.types";

export function AptModal({
  apt,
  onClose,
  onSave,
}: {
  apt: Appointment | null;
  onClose: () => void;
  onSave: (data: Partial<Appointment>) => void;
}) {
  const [form, setForm] = useState({
    customer: apt?.customer ?? "",
    pet: apt?.pet ?? "",
    species: apt?.species ?? ("Chó" as "Chó" | "Mèo"),
    time: apt?.time ?? "09:00",
    service: apt?.service ?? APPOINTMENT_SERVICES[0],
    staff: apt?.staff ?? APPOINTMENT_DOCTORS[0],
    amount: apt?.amount ?? "",
    status: apt?.status ?? ("scheduled" as Status),
    notes: apt?.notes ?? "",
  });
  const isNew = !apt;

  function set<K extends keyof typeof form>(k: K) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  function handleSave() {
    onSave(form);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[560px] bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <h3 className="text-base font-bold text-foreground">
            {isNew ? "Tạo lịch hẹn mới" : `Chỉnh sửa ${apt.id}`}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                Khách hàng
              </label>
              <input
                value={form.customer}
                onChange={set("customer")}
                placeholder="Tên khách hàng"
                className="mt-1.5 w-full h-10 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                Thú cưng
              </label>
              <input
                value={form.pet}
                onChange={set("pet")}
                placeholder="Tên thú cưng"
                className="mt-1.5 w-full h-10 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                Loài
              </label>
              <div className="relative mt-1.5">
                <select
                  value={form.species}
                  onChange={set("species")}
                  className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 appearance-none transition-all"
                >
                  <option>Chó</option>
                  <option>Mèo</option>
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                Giờ hẹn
              </label>
              <input
                type="time"
                value={form.time}
                onChange={set("time")}
                className="mt-1.5 w-full h-10 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
              Dịch vụ
            </label>
            <div className="relative mt-1.5">
              <select
                value={form.service}
                onChange={set("service")}
                className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 appearance-none transition-all"
              >
                {APPOINTMENT_SERVICES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
              Nhân viên phụ trách
            </label>
            <div className="relative mt-1.5">
              <select
                value={form.staff}
                onChange={set("staff")}
                className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 appearance-none transition-all"
              >
                {APPOINTMENT_DOCTORS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                Phí dịch vụ (₫)
              </label>
              <input
                value={form.amount}
                onChange={set("amount")}
                placeholder="250.000"
                className="mt-1.5 w-full h-10 px-3 rounded-xl border border-border bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                Trạng thái
              </label>
              <div className="relative mt-1.5">
                <select
                  value={form.status}
                  onChange={set("status")}
                  className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 appearance-none transition-all"
                >
                  <option value="scheduled">Chờ khám</option>
                  <option value="in_progress">Đang khám</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Đã huỷ</option>
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
              Ghi chú
            </label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              rows={3}
              placeholder="Dị ứng thuốc, yêu cầu đặc biệt..."
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-border bg-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center gap-3 flex-shrink-0 bg-muted/20">
          <button
            onClick={onClose}
            className="flex-1 h-10 border border-border bg-white rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Huỷ bỏ
          </button>
          <button
            onClick={handleSave}
            className="flex-1 h-10 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
          >
            {isNew ? "Tạo lịch hẹn" : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
