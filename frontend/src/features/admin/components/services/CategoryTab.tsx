import { CATEGORY_CONFIG } from "../../constants/services.constants";
import type { Category } from "../../types/services.types";

export function CategoryTab({
  cat,
  active,
  count,
  onClick,
}: {
  cat: Category;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  const cfg = CATEGORY_CONFIG[cat];
  const Icon = cfg.icon;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
        active
          ? `${cfg.bg} ${cfg.color} ${cfg.border} border`
          : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
      }`}
    >
      <Icon size={14} />
      {cfg.label}
      <span
        className={`text-[11px] font-mono ${active ? cfg.color + "/70" : "text-muted-foreground"}`}
      >
        {count}
      </span>
    </button>
  );
}
