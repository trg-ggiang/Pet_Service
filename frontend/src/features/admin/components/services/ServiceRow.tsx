import { BarChart3, Clock, Edit, Trash2 } from "lucide-react";
import {
  CATEGORY_CONFIG,
  priceDisplay,
  revenueDisplay,
} from "../../constants/services.constants";
import type { Service } from "../../types/services.types";

export function ServiceRow({
  service,
  selected,
  onSelect,
  onEdit,
  onToggleStatus,
}: {
  service: Service;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}) {
  const cfg = CATEGORY_CONFIG[service.category];

  return (
    <tr
      onClick={onSelect}
      className={`group transition-colors cursor-pointer ${selected ? "bg-cyan-50/60" : "hover:bg-muted/25"}`}
    >
      <td className="pl-5 pr-4 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg ${cfg.bg} ${cfg.border} border flex items-center justify-center flex-shrink-0`}
          >
            <cfg.icon size={14} className={cfg.color} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold text-foreground truncate">
                {service.name}
              </span>
              {service.tag && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 flex-shrink-0 hidden group-hover:inline">
                  {service.tag}
                </span>
              )}
            </div>
            <div className="text-[11.5px] text-muted-foreground font-mono">
              {service.id}
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground font-mono">
          <Clock size={11} className="flex-shrink-0" />
          {service.duration} {service.durationUnit}
        </div>
      </td>

      <td className="px-4 py-3.5">
        <div className="text-[13.5px] font-bold font-mono text-foreground">
          {priceDisplay(service)}
        </div>
        {service.pricingType === "variants" && (
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {service.variants!.length} mức giá
          </div>
        )}
      </td>

      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <BarChart3 size={11} className="text-muted-foreground" />
          <span className="font-mono font-bold text-[13px] text-foreground">
            {service.bookingsMonth}
          </span>
          <span className="text-[11px] text-muted-foreground">lượt/tháng</span>
        </div>
        <div
          className={`text-[12px] font-mono font-semibold mt-0.5 ${cfg.color}`}
        >
          {revenueDisplay(service.revenueMonth)}
        </div>
      </td>

      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onToggleStatus}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${service.status === "active" ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-200"}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${service.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`}
          />
          {service.status === "active" ? "Hoạt động" : "Tạm ngưng"}
        </button>
      </td>

      <td className="pr-4 py-3.5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
          >
            <Edit size={13} className="text-muted-foreground" />
          </button>
          <button className="p-1.5 hover:bg-red-50 rounded-md transition-colors">
            <Trash2
              size={13}
              className="text-muted-foreground hover:text-red-500"
            />
          </button>
        </div>
      </td>
    </tr>
  );
}
