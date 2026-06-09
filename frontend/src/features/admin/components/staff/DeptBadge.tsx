import type { Department } from "../../types/staff.types";
import { DEPT_CONFIG } from "../../constants/staff.constants";

export function DeptBadge({ dept }: { dept: Exclude<Department, "all"> }) {
  const cfg = DEPT_CONFIG[dept];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}
