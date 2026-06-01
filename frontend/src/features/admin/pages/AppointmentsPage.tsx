import { useEffect, useState } from "react";
import {
  Plus, Search, Download, Eye, Edit, X, Clock, ChevronDown,
  Calendar, Stethoscope, Scissors, Syringe, BedDouble,
  CheckCircle2, AlertTriangle, ArrowRight, User, FileText,
  Phone, Mail, MoreHorizontal, Trash2,
} from "lucide-react";
import { adminService } from "../services/admin";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "scheduled" | "in_progress" | "completed" | "cancelled";

interface Appointment {
  id: string; time: string; customer: string; pet: string;
  species: "Chó" | "Mèo"; service: string; staff: string;
  status: Status; amount: string; phone?: string; email?: string; notes?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<Status, { label: string; cls: string; dot: string }> = {
  scheduled:   { label: "Chờ khám",   cls: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",         dot: "bg-blue-500" },
  in_progress: { label: "Đang khám",  cls: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",      dot: "bg-amber-500" },
  completed:   { label: "Hoàn thành", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200", dot: "bg-emerald-500" },
  cancelled:   { label: "Đã huỷ",     cls: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-200",            dot: "bg-red-400" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();
  const colors = ["from-cyan-400 to-cyan-600", "from-violet-400 to-violet-600", "from-emerald-400 to-emerald-600", "from-amber-400 to-amber-500", "from-pink-400 to-pink-600"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
      <span className="text-[10px] font-bold text-white">{initials}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const { label, cls, dot } = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {label}
    </span>
  );
}

// ─── Appointment Detail Drawer ────────────────────────────────────────────────

function AptDrawer({
  apt, onClose, onEdit, onOpenExam, onStatusChange,
}: {
  apt: Appointment;
  onClose: () => void;
  onEdit: () => void;
  onOpenExam: () => void;
  onStatusChange: (id: string, status: Status) => void;
}) {
  const cfg = STATUS_CFG[apt.status];

  const NEXT_STATUS: Partial<Record<Status, { to: Status; label: string; cls: string }>> = {
    scheduled:   { to: "in_progress", label: "Bắt đầu khám",  cls: "bg-amber-500 hover:bg-amber-600 text-white" },
    in_progress: { to: "completed",   label: "Hoàn thành",     cls: "bg-emerald-500 hover:bg-emerald-600 text-white" },
  };
  const nextAction = NEXT_STATUS[apt.status];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="w-[460px] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{apt.id}</span>
              <StatusBadge status={apt.status} />
            </div>
            <h3 className="text-base font-bold text-foreground mt-0.5">{apt.service}</h3>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onEdit} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Edit size={15} />
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Time */}
          <div className="px-6 py-4 border-b border-border/60">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-muted-foreground" />
                <span className="font-semibold text-foreground">21/05/2026</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-muted-foreground" />
                <span className="font-semibold text-foreground">{apt.time}</span>
              </div>
              <span className="font-bold text-foreground ml-auto">{apt.amount}₫</span>
            </div>
          </div>

          {/* Customer */}
          <div className="px-6 py-5 border-b border-border/60">
            <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground mb-3">Khách hàng</p>
            <div className="flex items-start gap-3">
              <Avatar name={apt.customer} />
              <div>
                <div className="font-semibold text-foreground text-sm">{apt.customer}</div>
                {apt.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Phone size={11} /> {apt.phone}
                  </div>
                )}
                {apt.email && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <Mail size={11} /> {apt.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pet */}
          <div className="px-6 py-5 border-b border-border/60">
            <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground mb-3">Thú cưng</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg">
                {apt.species === "Chó" ? "🐶" : "🐱"}
              </div>
              <div>
                <div className="font-semibold text-foreground">{apt.pet}</div>
                <div className="text-xs text-muted-foreground">{apt.species}</div>
              </div>
            </div>
          </div>

          {/* Service & Staff */}
          <div className="px-6 py-5 border-b border-border/60 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Dịch vụ & Nhân viên</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope size={14} className="text-muted-foreground" />
                <span className="text-sm text-foreground">{apt.service}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User size={14} className="text-muted-foreground" />
              <span className="text-sm text-foreground">{apt.staff}</span>
            </div>
          </div>

          {/* Notes */}
          {apt.notes && (
            <div className="px-6 py-5 border-b border-border/60">
              <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground mb-2">Ghi chú</p>
              <div className={`px-3 py-2.5 rounded-xl text-sm leading-relaxed ${apt.notes.includes("Dị ứng") ? "bg-red-50 text-red-700 border border-red-200" : "bg-muted/60 text-foreground"}`}>
                {apt.notes.includes("Dị ứng") && <AlertTriangle size={13} className="inline mr-1.5 -mt-0.5" />}
                {apt.notes}
              </div>
            </div>
          )}

          {/* Status change */}
          {apt.status !== "cancelled" && apt.status !== "completed" && (
            <div className="px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground mb-3">Thay đổi trạng thái</p>
              <div className="flex gap-2">
                {nextAction && (
                  <button
                    onClick={() => {
                      if (apt.status === "scheduled") {
                        onStatusChange(apt.id, "in_progress");
                      } else {
                        onStatusChange(apt.id, "completed");
                      }
                    }}
                    className={`flex-1 h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${nextAction.cls}`}
                  >
                    <CheckCircle2 size={15} /> {nextAction.label}
                  </button>
                )}
                {apt.status === "in_progress" && (
                  <button
                    onClick={onOpenExam}
                    className="flex-1 h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-primary text-white hover:opacity-90 transition-opacity"
                  >
                    Mở phiếu khám <ArrowRight size={15} />
                  </button>
                )}
                <button
                  onClick={() => onStatusChange(apt.id, "cancelled")}
                  className="h-10 px-4 rounded-xl text-sm font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
                >
                  Huỷ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Appointment Edit Modal ───────────────────────────────────────────────────

function AptModal({
  apt, onClose, onSave, serviceOptions, staffOptions,
}: {
  apt: Appointment | null;
  onClose: () => void;
  onSave: (data: Partial<Appointment>) => void;
  serviceOptions: string[];
  staffOptions: string[];
}) {
  const [form, setForm] = useState({
    customer: apt?.customer ?? "",
    pet:      apt?.pet      ?? "",
    species:  apt?.species  ?? "Chó" as "Chó" | "Mèo",
    time:     apt?.time     ?? "09:00",
    service:  apt?.service  ?? serviceOptions[0] ?? "",
    staff:    apt?.staff    ?? staffOptions[0] ?? "",
    amount:   apt?.amount   ?? "",
    status:   apt?.status   ?? "scheduled" as Status,
    notes:    apt?.notes    ?? "",
  });
  const isNew = !apt;

  function set<K extends keyof typeof form>(k: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  function handleSave() {
    onSave(form);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-[560px] bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <h3 className="text-base font-bold text-foreground">{isNew ? "Tạo lịch hẹn mới" : `Chỉnh sửa ${apt.id}`}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Customer & Pet */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Khách hàng</label>
              <input value={form.customer} onChange={set("customer")} placeholder="Tên khách hàng" className="mt-1.5 w-full h-10 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all" />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Thú cưng</label>
              <input value={form.pet} onChange={set("pet")} placeholder="Tên thú cưng" className="mt-1.5 w-full h-10 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all" />
            </div>
          </div>

          {/* Species & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Loài</label>
              <div className="relative mt-1.5">
                <select value={form.species} onChange={set("species")} className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 appearance-none transition-all">
                  <option>Chó</option>
                  <option>Mèo</option>
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Giờ hẹn</label>
              <input type="time" value={form.time} onChange={set("time")} className="mt-1.5 w-full h-10 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all" />
            </div>
          </div>

          {/* Service */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Dịch vụ</label>
            <div className="relative mt-1.5">
              <select value={form.service} onChange={set("service")} className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 appearance-none transition-all">
                {serviceOptions.map((s) => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Staff */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Nhân viên phụ trách</label>
            <div className="relative mt-1.5">
              <select value={form.staff} onChange={set("staff")} className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 appearance-none transition-all">
                {staffOptions.map((d) => <option key={d}>{d}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Amount & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Phí dịch vụ (₫)</label>
              <input value={form.amount} onChange={set("amount")} placeholder="250.000" className="mt-1.5 w-full h-10 px-3 rounded-xl border border-border bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all" />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Trạng thái</label>
              <div className="relative mt-1.5">
                <select value={form.status} onChange={set("status")} className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 appearance-none transition-all">
                  <option value="scheduled">Chờ khám</option>
                  <option value="in_progress">Đang khám</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Đã huỷ</option>
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Ghi chú</label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              rows={3}
              placeholder="Dị ứng thuốc, yêu cầu đặc biệt..."
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-border bg-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center gap-3 flex-shrink-0 bg-muted/20">
          <button onClick={onClose} className="flex-1 h-10 border border-border bg-white rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors">Huỷ bỏ</button>
          <button onClick={handleSave} className="flex-1 h-10 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-sm">
            {isNew ? "Tạo lịch hẹn" : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AppointmentsPage({
  onNewAppt,
  onOpenExam,
}: {
  onNewAppt: () => void;
  onOpenExam?: () => void;
}) {
  const [apts, setApts] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");
  const [drawerApt, setDrawerApt] = useState<Appointment | null>(null);
  const [editApt, setEditApt] = useState<Appointment | null | "new">(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;

    adminService
      .listAppointments()
      .then((data) => {
        if (!mounted) return;
        setApts(data.appointments as Appointment[]);
        setLoadError("");
      })
      .catch((error) => {
        if (!mounted) return;
        setLoadError(error instanceof Error ? error.message : "Không thể tải dữ liệu lịch hẹn.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = apts.filter((a) => {
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || a.customer.toLowerCase().includes(q) || a.pet.toLowerCase().includes(q) || a.service.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const serviceOptions = Array.from(new Set(apts.map((apt) => apt.service).filter(Boolean))).sort();
  const staffOptions = Array.from(new Set(apts.map((apt) => apt.staff).filter(Boolean))).sort();

  const tabs: [Status | "all", string][] = [
    ["all", "Tất cả"], ["scheduled", "Chờ khám"], ["in_progress", "Đang khám"],
    ["completed", "Hoàn thành"], ["cancelled", "Đã huỷ"],
  ];

  function handleStatusChange(id: string, status: Status) {
    setApts((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    if (drawerApt?.id === id) setDrawerApt((a) => a ? { ...a, status } : a);
  }

  function handleSave(data: Partial<Appointment>) {
    if (editApt === "new") {
      const newId = `APT-${String(apts.length + 1).padStart(3, "0")}`;
      setApts((prev) => [...prev, { id: newId, ...data } as Appointment]);
    } else if (editApt) {
      setApts((prev) => prev.map((a) => a.id === editApt.id ? { ...a, ...data } : a));
      if (drawerApt?.id === editApt.id) setDrawerApt((a) => a ? { ...a, ...data } : a);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Lịch hẹn</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Quản lý toàn bộ lịch hẹn của trung tâm</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 h-9 px-4 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">
            <Download size={14} /> Xuất Excel
          </button>
          <button
            onClick={() => { setEditApt("new"); }}
            className="flex items-center gap-1.5 h-9 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus size={14} /> Lịch hẹn mới
          </button>
        </div>
      </div>

      {/* Filters */}
      {loadError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          {loadError}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-card border border-border p-1 rounded-lg">
          {tabs.map(([val, label]) => {
            const cnt = val === "all" ? apts.length : apts.filter((a) => a.status === val).length;
            return (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${statusFilter === val ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              >
                {label}
                <span className={`text-[11px] font-mono ${statusFilter === val ? "text-white/80" : "text-muted-foreground"}`}>{cnt}</span>
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, thú cưng, dịch vụ..."
            className="w-72 h-9 pl-8 pr-4 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      {loading && (
        <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          Đang tải dữ liệu lịch hẹn...
        </div>
      )}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {["Mã · Giờ", "Khách hàng", "Thú cưng", "Dịch vụ", "Nhân viên", "Trạng thái", "Phí"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground ${i === 0 ? "pl-6 text-left" : i === 6 ? "text-right pr-6" : "text-left"}`}>{h}</th>
                ))}
                <th className="w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-16 text-center text-muted-foreground text-sm">Không có lịch hẹn phù hợp</td></tr>
              )}
              {filtered.map((apt) => (
                <tr
                  key={apt.id}
                  className="hover:bg-muted/25 group transition-colors cursor-pointer"
                  onClick={() => setDrawerApt(apt)}
                >
                  <td className="pl-6 pr-4 py-3.5">
                    <div className="font-mono text-[11px] text-muted-foreground">{apt.id}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock size={11} className="text-muted-foreground/60" />
                      <span className="text-sm font-bold text-foreground font-mono">{apt.time}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Avatar name={apt.customer} />
                      <span className="text-[13px] font-medium text-foreground">{apt.customer}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold text-foreground">{apt.pet}</span>
                      <span className="text-[11px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">{apt.species}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-foreground">{apt.service}</td>
                  <td className="px-4 py-3.5 text-[13px] text-muted-foreground">{apt.staff}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={apt.status} /></td>
                  <td className="px-4 py-3.5 pr-6 text-right font-mono text-[13px] font-bold text-foreground">{apt.amount}₫</td>
                  <td className="pr-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setDrawerApt(apt)}
                        className="p-1.5 hover:bg-muted rounded-md transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye size={13} className="text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => setEditApt(apt)}
                        className="p-1.5 hover:bg-muted rounded-md transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit size={13} className="text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary footer */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-muted/20">
          <span className="text-xs text-muted-foreground">Hiển thị {filtered.length} / {apts.length} lịch hẹn</span>
          <span className="text-xs font-semibold text-foreground">
            Tổng: {filtered.reduce((s, a) => s + parseInt(a.amount.replace(/\./g, ""), 10), 0).toLocaleString("vi-VN")}₫
          </span>
        </div>
      </div>

      {/* Drawer */}
      {drawerApt && (
        <AptDrawer
          apt={drawerApt}
          onClose={() => setDrawerApt(null)}
          onEdit={() => { setEditApt(drawerApt); setDrawerApt(null); }}
          onOpenExam={() => { setDrawerApt(null); onOpenExam?.(); }}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Edit Modal */}
      {editApt !== null && (
        <AptModal
          apt={editApt === "new" ? null : editApt}
          onClose={() => setEditApt(null)}
          onSave={handleSave}
          serviceOptions={serviceOptions}
          staffOptions={staffOptions}
        />
      )}
    </div>
  );
}
