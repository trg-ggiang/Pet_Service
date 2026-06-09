import { useState } from "react";
import { ToggleLeft, ToggleRight, X } from "lucide-react";
import type { StaffMember } from "../../types/staff.types";
import {
  DEPT_CONFIG,
  DEPT_ORDER,
  EMPTY_STAFF,
  SHIFTS,
  STATUS_CONFIG,
  WORK_STATUSES,
} from "../../constants/staff.constants";

export function StaffModal({
  editing,
  onClose,
  onSave,
}: {
  editing: StaffMember | null;
  onClose: () => void;
  onSave: (s: StaffMember) => void;
}) {
  const isEdit = !!editing;
  const [form, setForm] = useState<Omit<StaffMember, "id">>(
    editing ? { ...editing } : { ...EMPTY_STAFF },
  );

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim() || !form.position.trim()) return;
    const initials = form.name
      .split(" ")
      .slice(-2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
    onSave({
      ...form,
      avatar: initials,
      id: editing?.id ?? `NV-${Date.now()}`,
    });
  };

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
              {isEdit ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEdit
                ? `Đang sửa: ${editing!.name}`
                : "Điền thông tin nhân viên mới"}
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
              Bộ phận
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DEPT_ORDER.map((d) => {
                const cfg = DEPT_CONFIG[d];
                const Icon = cfg.icon;
                return (
                  <button
                    key={d}
                    onClick={() => set("department", d)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-[12.5px] font-medium transition-all text-left ${
                      form.department === d
                        ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                        : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon
                      size={13}
                      className={
                        form.department === d
                          ? cfg.color
                          : "text-muted-foreground"
                      }
                    />
                    <span className="truncate">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">
                Họ và tên
              </label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] font-semibold text-foreground placeholder:font-normal placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">
                Chức vụ
              </label>
              <input
                value={form.position}
                onChange={(e) => set("position", e.target.value)}
                placeholder="VD: Bác sĩ thú y, Groomer..."
                className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">
                Số điện thoại
              </label>
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="09xx xxx xxx"
                className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] font-mono text-foreground placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">
                Email
              </label>
              <input
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="ten@petcare.vn"
                className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">
                Ca làm việc
              </label>
              <div className="space-y-1.5">
                {SHIFTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => set("shift", s)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-[12.5px] font-medium text-left transition-all ${
                      form.shift === s
                        ? "bg-cyan-50 border-cyan-300 text-cyan-700"
                        : "border-border bg-white text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${form.shift === s ? "border-cyan-500 bg-cyan-500" : "border-slate-300"}`}
                    />
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">
                  Ngày vào làm
                </label>
                <input
                  value={form.joinDate}
                  onChange={(e) => set("joinDate", e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] font-mono text-foreground placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">
                  Trạng thái
                </label>
                <div className="space-y-1.5">
                  {WORK_STATUSES.map(({ v, label }) => (
                    <button
                      key={v}
                      onClick={() => set("workStatus", v)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-[12.5px] font-medium text-left transition-all ${
                        form.workStatus === v
                          ? `${STATUS_CONFIG[v].cls} border-current`
                          : "border-border bg-white text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_CONFIG[v].dot.replace("animate-pulse", "")}`}
                      />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {form.department === "clinic" && (
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-cyan-50/50 border border-cyan-200">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-cyan-700 block mb-2">
                  Chuyên khoa
                </label>
                <input
                  value={form.specialty ?? ""}
                  onChange={(e) => set("specialty", e.target.value)}
                  placeholder="VD: Nội khoa, Ngoại khoa..."
                  className="w-full h-9 px-3 border border-cyan-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/20 focus:border-cyan-400 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-cyan-700 block mb-2">
                  Phòng khám
                </label>
                <input
                  value={form.room ?? ""}
                  onChange={(e) => set("room", e.target.value)}
                  placeholder="VD: Phòng 1"
                  className="w-full h-9 px-3 border border-cyan-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/20 focus:border-cyan-400 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">
              Ghi chú nội bộ
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Kỹ năng đặc biệt, ghi chú nội bộ..."
              className="w-full px-4 py-3 border border-border rounded-xl text-[13.5px] leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white resize-none"
            />
          </div>

          {isEdit && (
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
              <div>
                <div className="text-[13px] font-semibold text-foreground">
                  Trạng thái tài khoản
                </div>
                <div className="text-[12px] text-muted-foreground mt-0.5">
                  {form.locked
                    ? "Tài khoản đang bị khoá — nhân viên không thể đăng nhập"
                    : "Tài khoản đang hoạt động bình thường"}
                </div>
              </div>
              <button onClick={() => set("locked", !form.locked)}>
                {!form.locked ? (
                  <ToggleRight size={36} className="text-primary" />
                ) : (
                  <ToggleLeft size={36} className="text-muted-foreground" />
                )}
              </button>
            </div>
          )}
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
            disabled={!form.name.trim() || !form.position.trim()}
            className="flex-1 h-10 bg-primary text-primary-foreground rounded-xl text-[13px] font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-cyan-500/20"
          >
            {isEdit ? "Lưu thay đổi" : "Thêm nhân viên"}
          </button>
        </div>
      </div>
    </div>
  );
}
