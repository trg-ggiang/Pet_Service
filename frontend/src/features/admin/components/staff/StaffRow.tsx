import { Clock, Edit, Eye, Lock, Star, Unlock } from "lucide-react";
import type { StaffMember } from "../../types/staff.types";
import { AVATAR_COLORS, DEPT_CONFIG } from "../../constants/staff.constants";
import { AvatarBubble } from "../common/AvatarBubble";
import { DeptBadge } from "./DeptBadge";
import { PerfBar } from "./PerfBar";
import { StatusPill } from "./StatusPill";

export function StaffRow({
  member,
  selected,
  onSelect,
  onEdit,
  onToggleLock,
}: {
  member: StaffMember;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onToggleLock: () => void;
}) {
  return (
    <tr
      onClick={onSelect}
      className={`group transition-colors cursor-pointer ${selected ? "bg-cyan-50/50" : "hover:bg-muted/25"}`}
    >
      <td className="pl-5 pr-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <AvatarBubble
              initials={member.avatar}
              name={member.name}
              colors={AVATAR_COLORS}
              size="sm"
            />
            {member.locked && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                <Lock size={7} className="text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-foreground truncate">
              {member.name}
            </div>
            <div className="text-[11.5px] text-muted-foreground truncate">
              {member.position}
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <DeptBadge dept={member.department} />
      </td>

      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-[12.5px] text-foreground font-medium">
          <Clock size={11} className="text-muted-foreground flex-shrink-0" />
          {member.shift}
        </div>
      </td>

      <td className="px-4 py-3.5">
        <div className="text-[12.5px] font-medium text-foreground">
          {member.completedTasks}/{member.todayTasks}
          <span className="text-muted-foreground font-normal text-[11.5px] ml-1">
            nhiệm vụ
          </span>
        </div>
        <div className="mt-1.5 w-28">
          <PerfBar value={member.monthlyPerf} />
        </div>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1">
          <Star
            size={12}
            className="text-amber-400 fill-amber-400 flex-shrink-0"
          />
          <span className="font-mono font-bold text-[13px] text-foreground">
            {member.rating.toFixed(1)}
          </span>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <StatusPill status={member.workStatus} />
      </td>

      <td className="pr-4 py-3.5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onSelect}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
          >
            <Eye size={13} className="text-muted-foreground" />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
          >
            <Edit size={13} className="text-muted-foreground" />
          </button>
          <button
            onClick={onToggleLock}
            className={`p-1.5 rounded-md transition-colors ${member.locked ? "hover:bg-emerald-50 text-emerald-500" : "hover:bg-red-50 text-muted-foreground hover:text-red-500"}`}
          >
            {member.locked ? <Unlock size={13} /> : <Lock size={13} />}
          </button>
        </div>
      </td>
    </tr>
  );
}
