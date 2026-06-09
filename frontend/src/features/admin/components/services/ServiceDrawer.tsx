import { Copy, Edit, Star, X, Clock } from "lucide-react";
import {
  CATEGORY_CONFIG,
  formatPrice,
  revenueDisplay,
} from "../../constants/services.constants";
import type { Service } from "../../types/services.types";

export function ServiceDrawer({
  service,
  onClose,
  onEdit,
}: {
  service: Service;
  onClose: () => void;
  onEdit: () => void;
}) {
  const cfg = CATEGORY_CONFIG[service.category];
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="w-[420px] bg-white h-full shadow-2xl flex flex-col border-l border-border">
        <div className="px-6 py-5 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.border} border flex items-center justify-center flex-shrink-0`}
              >
                <Icon size={18} className={cfg.color} />
              </div>
              <div>
                <div className="text-[17px] font-bold text-foreground leading-tight">
                  {service.name}
                </div>
                <div
                  className={`text-[12px] font-semibold mt-0.5 ${cfg.color}`}
                >
                  {cfg.label}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            >
              <X size={15} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${service.status === "active" ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200" : "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200"}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${service.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`}
              />
              {service.status === "active" ? "Đang hoạt động" : "Tạm ngưng"}
            </span>
            {service.tag && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
                <Star size={10} className="fill-amber-500 text-amber-500" />{" "}
                {service.tag}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground font-mono ml-auto">
              {service.id}
            </span>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Mô tả dịch vụ
            </div>
            <p className="text-[13.5px] text-foreground leading-relaxed">
              {service.description}
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border border-border">
            <Clock size={16} className="text-muted-foreground flex-shrink-0" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Thời gian
              </div>
              <div className="text-[15px] font-bold font-mono text-foreground mt-0.5">
                {service.duration} {service.durationUnit}
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Bảng giá
            </div>
            {service.pricingType === "fixed" ? (
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-white">
                <span className="text-[13px] font-medium text-muted-foreground">
                  Giá cố định
                </span>
                <span className="font-mono font-bold text-[20px] text-foreground">
                  {formatPrice(service.basePrice)}₫
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {service.variants!.map((v) => (
                  <div
                    key={v.label}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-white hover:bg-muted/20 transition-colors"
                  >
                    <span className="text-[13px] font-medium text-foreground">
                      {v.label}
                    </span>
                    <span className="font-mono font-bold text-[15px] text-foreground">
                      {formatPrice(v.price)}₫
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Thống kê tháng này
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/40 rounded-xl p-4 border border-border text-center">
                <div className="font-mono font-bold text-[24px] text-foreground leading-none">
                  {service.bookingsMonth}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1.5">
                  Lượt đặt lịch
                </div>
              </div>
              <div className="bg-muted/40 rounded-xl p-4 border border-border text-center">
                <div
                  className={`font-mono font-bold text-[20px] leading-none ${cfg.color}`}
                >
                  {revenueDisplay(service.revenueMonth)}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1.5">
                  Doanh thu
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center gap-3 flex-shrink-0">
          <button className="flex items-center gap-2 h-10 px-4 border border-border bg-white rounded-xl text-[13px] font-medium text-muted-foreground hover:bg-muted transition-colors">
            <Copy size={13} /> Nhân bản
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
