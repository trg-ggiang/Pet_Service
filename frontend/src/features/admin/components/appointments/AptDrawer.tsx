import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Mail,
  Phone,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import { APPOINTMENT_STATUS_CFG } from "../../constants/appointments.constants";
import { Appointment, Status } from "../../types/appointments.types";
import { AvatarInitials } from "../common/AvatarInitials";
import { StatusBadge } from "./StatusBadge";

export function AptDrawer({
  apt,
  onClose,
  onEdit,
  onOpenExam,
  onStatusChange,
}: {
  apt: Appointment;
  onClose: () => void;
  onEdit: () => void;
  onOpenExam: () => void;
  onStatusChange: (id: string, status: Status) => void;
}) {
  const NEXT_STATUS: Partial<
    Record<Status, { to: Status; label: string; cls: string }>
  > = {
    scheduled: {
      to: "in_progress",
      label: "Bắt đầu khám",
      cls: "bg-amber-500 hover:bg-amber-600 text-white",
    },
    in_progress: {
      to: "completed",
      label: "Hoàn thành",
      cls: "bg-emerald-500 hover:bg-emerald-600 text-white",
    },
  };
  const nextAction = NEXT_STATUS[apt.status];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="w-[460px] bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {apt.id}
              </span>
              <StatusBadge status={apt.status} />
            </div>
            <h3 className="text-base font-bold text-foreground mt-0.5">
              {apt.service}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Edit size={15} />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 border-b border-border/60">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-muted-foreground" />
                <span className="font-semibold text-foreground">
                  21/05/2026
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-muted-foreground" />
                <span className="font-semibold text-foreground">
                  {apt.time}
                </span>
              </div>
              <span className="font-bold text-foreground ml-auto">
                {apt.amount}₫
              </span>
            </div>
          </div>

          <div className="px-6 py-5 border-b border-border/60">
            <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground mb-3">
              Khách hàng
            </p>
            <div className="flex items-start gap-3">
              <AvatarInitials name={apt.customer} />
              <div>
                <div className="font-semibold text-foreground text-sm">
                  {apt.customer}
                </div>
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

          <div className="px-6 py-5 border-b border-border/60">
            <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground mb-3">
              Thú cưng
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg">
                {apt.species === "Chó" ? "🐶" : "🐱"}
              </div>
              <div>
                <div className="font-semibold text-foreground">{apt.pet}</div>
                <div className="text-xs text-muted-foreground">
                  {apt.species}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 border-b border-border/60 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
              Dịch vụ & Nhân viên
            </p>
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

          {apt.notes && (
            <div className="px-6 py-5 border-b border-border/60">
              <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground mb-2">
                Ghi chú
              </p>
              <div
                className={`px-3 py-2.5 rounded-xl text-sm leading-relaxed ${apt.notes.includes("Dị ứng") ? "bg-red-50 text-red-700 border border-red-200" : "bg-muted/60 text-foreground"}`}
              >
                {apt.notes.includes("Dị ứng") && (
                  <AlertTriangle size={13} className="inline mr-1.5 -mt-0.5" />
                )}
                {apt.notes}
              </div>
            </div>
          )}

          {apt.status !== "cancelled" && apt.status !== "completed" && (
            <div className="px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground mb-3">
                Thay đổi trạng thái
              </p>
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
