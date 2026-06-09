import {
  Activity,
  Award,
  Briefcase,
  Calendar,
  Clock,
  Edit,
  Lock,
  Mail,
  Phone,
  ShieldAlert,
  Star,
  Unlock,
  X,
} from "lucide-react";
import type { StaffMember } from "../../types/staff.types";
import { AVATAR_COLORS, DEPT_CONFIG } from "../../constants/staff.constants";
import { AvatarBubble } from "../common/AvatarBubble";
import { DeptBadge } from "./DeptBadge";
import { PerfBar } from "./PerfBar";
import { StatusPill } from "./StatusPill";

export function StaffDrawer({
  staff,
  onClose,
  onEdit,
  onToggleLock,
}: {
  staff: StaffMember;
  onClose: () => void;
  onEdit: () => void;
  onToggleLock: () => void;
}) {
  const dept = DEPT_CONFIG[staff.department];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="w-[440px] bg-white h-full shadow-2xl flex flex-col border-l border-border">
        <div className="px-6 py-5 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <AvatarBubble
                initials={staff.avatar}
                name={staff.name}
                colors={AVATAR_COLORS}
                size="lg"
              />
              <div>
                <div className="text-[18px] font-bold text-foreground leading-tight">
                  {staff.name}
                </div>
                <div className="text-[13px] text-muted-foreground mt-0.5">
                  {staff.position}
                </div>
                <div className="mt-1.5">
                  <DeptBadge dept={staff.department} />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            >
              <X size={15} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusPill status={staff.workStatus} />
            {staff.locked && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-600 ring-1 ring-inset ring-red-200">
                <ShieldAlert size={11} /> Đã khoá
              </span>
            )}
            {staff.specialty && (
              <span className="text-[11px] text-muted-foreground font-medium px-2.5 py-1 rounded-full bg-muted border border-border">
                {staff.specialty}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground font-mono ml-auto">
              {staff.id}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Hôm nay",
                value: `${staff.completedTasks}/${staff.todayTasks}`,
                unit: "nhiệm vụ",
              },
              {
                label: "Hiệu suất",
                value: `${staff.monthlyPerf}%`,
                unit: "tháng này",
              },
              {
                label: "Đánh giá",
                value: staff.rating.toFixed(1),
                unit: "/ 5.0",
                highlight: true,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-muted/40 rounded-xl p-3 text-center border border-border"
              >
                <div
                  className={`font-mono font-bold text-[20px] leading-none ${s.highlight ? "text-amber-500" : "text-foreground"}`}
                >
                  {s.value}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1.5 font-medium">
                  {s.unit}
                </div>
                <div className="text-[10px] text-muted-foreground/70">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Hiệu suất tháng này
            </div>
            <PerfBar value={staff.monthlyPerf} />
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Thông tin công việc
            </div>
            <div className="space-y-2.5">
              {[
                { icon: Briefcase, value: `${staff.position} · ${dept.label}` },
                { icon: Clock, value: `Ca làm: ${staff.shift}` },
                { icon: Calendar, value: `Ngày vào làm: ${staff.joinDate}` },
                ...(staff.room
                  ? [{ icon: Activity, value: `Phòng khám: ${staff.room}` }]
                  : []),
                ...(staff.licenseNo
                  ? [{ icon: Award, value: `CMHV: ${staff.licenseNo}` }]
                  : []),
              ].map(({ icon: Icon, value }) => (
                <div
                  key={value}
                  className="flex items-center gap-3 text-[12.5px]"
                >
                  <Icon
                    size={13}
                    className="text-muted-foreground flex-shrink-0"
                  />
                  <span className="text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Đánh giá từ khách hàng
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={16}
                  className={
                    i <= Math.round(staff.rating)
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-200 fill-slate-200"
                  }
                />
              ))}
              <span className="font-mono font-bold text-[14px] text-foreground ml-1">
                {staff.rating.toFixed(1)}
              </span>
              <span className="text-[12px] text-muted-foreground">/ 5.0</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Liên hệ
            </div>
            <div className="space-y-2.5">
              {[
                { icon: Phone, value: staff.phone },
                { icon: Mail, value: staff.email },
              ].map(({ icon: Icon, value }) => (
                <div
                  key={value}
                  className="flex items-center gap-3 text-[12.5px]"
                >
                  <Icon
                    size={13}
                    className="text-muted-foreground flex-shrink-0"
                  />
                  <span className="text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {staff.notes && (
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Ghi chú
              </div>
              <p className="text-[12.5px] text-foreground leading-relaxed">
                {staff.notes}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onToggleLock}
            className={`flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-semibold border transition-colors ${
              staff.locked
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            }`}
          >
            {staff.locked ? (
              <>
                <Unlock size={13} /> Mở khoá
              </>
            ) : (
              <>
                <Lock size={13} /> Khoá TK
              </>
            )}
          </button>
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground rounded-xl text-[13px] font-semibold hover:opacity-90 transition-opacity"
          >
            <Edit size={13} /> Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  );
}
