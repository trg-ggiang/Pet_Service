import { useEffect, useState } from "react";
import {
  Plus, Search, Edit, X, Check, ChevronDown, ToggleLeft, ToggleRight,
  Stethoscope, Syringe, Scissors, BedDouble, Clock, TrendingUp,
  Star, BarChart3, Trash2, AlertTriangle, Copy, Filter,
} from "lucide-react";
import { adminService } from "../services/admin";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "clinic" | "vaccination" | "grooming" | "boarding";

interface PriceVariant {
  label: string;
  price: number;
}

interface Service {
  id: string;
  category: Category;
  name: string;
  description: string;
  duration: number;
  durationUnit: "phút" | "đêm" | "ngày";
  pricingType: "fixed" | "variants";
  basePrice: number;
  variants?: PriceVariant[];
  status: "active" | "inactive";
  bookingsMonth: number;
  revenueMonth: number;
  tag?: string;
}

// ─── Sample data ──────────────────────────────────────────────────────────────

const INITIAL_SERVICES: Service[] = [
  // ── Khám bệnh
  { id: "SV-C01", category: "clinic",      name: "Khám tổng quát",              description: "Kiểm tra sức khoẻ toàn diện, đo các chỉ số sinh tồn, tư vấn dinh dưỡng và phòng bệnh.", duration: 45,  durationUnit: "phút", pricingType: "fixed",    basePrice: 250000, bookingsMonth: 38, revenueMonth: 9500000, status: "active" },
  { id: "SV-C02", category: "clinic",      name: "Khám da liễu",                description: "Chẩn đoán và điều trị các bệnh về da, lông, móng; kiểm tra ký sinh trùng ngoài.",         duration: 60,  durationUnit: "phút", pricingType: "fixed",    basePrice: 320000, bookingsMonth: 24, revenueMonth: 7680000, status: "active", tag: "Phổ biến" },
  { id: "SV-C03", category: "clinic",      name: "Khám ngoại khoa",             description: "Phẫu thuật nhỏ, xử lý vết thương, khâu vết mổ, chăm sóc hậu phẫu.",                     duration: 60,  durationUnit: "phút", pricingType: "fixed",    basePrice: 380000, bookingsMonth: 11, revenueMonth: 4180000, status: "active" },
  { id: "SV-C04", category: "clinic",      name: "Khám nội khoa chuyên sâu",    description: "Đánh giá chuyên sâu hệ tiêu hoá, hô hấp, tim mạch; kết hợp xét nghiệm cận lâm sàng.",  duration: 90,  durationUnit: "phút", pricingType: "fixed",    basePrice: 450000, bookingsMonth: 9,  revenueMonth: 4050000, status: "active" },
  { id: "SV-C05", category: "clinic",      name: "Siêu âm bụng",                description: "Chẩn đoán hình ảnh bằng siêu âm các cơ quan nội tạng vùng bụng.",                      duration: 30,  durationUnit: "phút", pricingType: "fixed",    basePrice: 280000, bookingsMonth: 14, revenueMonth: 3920000, status: "active" },
  { id: "SV-C06", category: "clinic",      name: "Xét nghiệm máu tổng quát",    description: "Công thức máu toàn phần (CBC), sinh hoá máu cơ bản, phân tích tế bào.",               duration: 30,  durationUnit: "phút", pricingType: "fixed",    basePrice: 350000, bookingsMonth: 19, revenueMonth: 6650000, status: "active" },
  { id: "SV-C07", category: "clinic",      name: "Phẫu thuật triệt sản",        description: "Phẫu thuật cắt bỏ buồng trứng/tinh hoàn theo phương pháp nội soi an toàn.",            duration: 120, durationUnit: "phút", pricingType: "fixed",    basePrice: 1500000, bookingsMonth: 4, revenueMonth: 6000000, status: "active" },

  // ── Tiêm chủng
  { id: "SV-V01", category: "vaccination", name: "Tiêm phòng dại",              description: "Vaccine ngừa bệnh dại bắt buộc hàng năm, cấp giấy chứng nhận tiêm phòng.",             duration: 15,  durationUnit: "phút", pricingType: "fixed",    basePrice: 180000, bookingsMonth: 32, revenueMonth: 5760000, status: "active", tag: "Phổ biến" },
  { id: "SV-V02", category: "vaccination", name: "Combo 5 bệnh (chó)",          description: "Phòng Distemper, Adenovirus, Parvovirus, Leptospira, Parainfluenza — nhắc lại hàng năm.", duration: 20, durationUnit: "phút", pricingType: "fixed",    basePrice: 320000, bookingsMonth: 21, revenueMonth: 6720000, status: "active" },
  { id: "SV-V03", category: "vaccination", name: "Combo 4 bệnh (mèo)",          description: "Phòng Herpesvirus, Calicivirus, Panleukopenia, Chlamydia — nhắc lại hàng năm.",        duration: 20,  durationUnit: "phút", pricingType: "fixed",    basePrice: 280000, bookingsMonth: 17, revenueMonth: 4760000, status: "active" },
  { id: "SV-V04", category: "vaccination", name: "FeLV (bạch cầu mèo)",         description: "Vaccine phòng bệnh bạch cầu ở mèo — khuyến nghị cho mèo đi ra ngoài.",               duration: 20,  durationUnit: "phút", pricingType: "fixed",    basePrice: 250000, bookingsMonth: 8,  revenueMonth: 2000000, status: "active" },
  { id: "SV-V05", category: "vaccination", name: "Tiêm nhắc lại",               description: "Mũi nhắc lại cho các loại vaccine đã tiêm — áp dụng theo lịch hẹn của bác sĩ.",        duration: 15,  durationUnit: "phút", pricingType: "fixed",    basePrice: 150000, bookingsMonth: 28, revenueMonth: 4200000, status: "active" },
  { id: "SV-V06", category: "vaccination", name: "Tiêm phòng Bordetella",        description: "Phòng bệnh ho cũi (kennel cough) — bắt buộc trước khi gửi lưu trú.",                  duration: 15,  durationUnit: "phút", pricingType: "fixed",    basePrice: 200000, bookingsMonth: 6,  revenueMonth: 1200000, status: "inactive" },

  // ── Grooming
  { id: "SV-G01", category: "grooming",   name: "Tắm & sấy tiêu chuẩn",        description: "Tắm xà phòng chuyên dụng, sấy khô, chải lông, vệ sinh tai cơ bản.",                   duration: 60,  durationUnit: "phút", pricingType: "variants", basePrice: 150000, variants: [{ label: "Nhỏ (<5 kg)",   price: 150000 }, { label: "Vừa (5–15 kg)", price: 220000 }, { label: "Lớn (>15 kg)", price: 320000 }], bookingsMonth: 44, revenueMonth: 9900000, status: "active", tag: "Phổ biến" },
  { id: "SV-G02", category: "grooming",   name: "Tắm & sấy cao cấp",            description: "Shampoo dưỡng chất cao cấp, sấy tạo kiểu, xịt thơm, massage nhẹ.",                    duration: 90,  durationUnit: "phút", pricingType: "variants", basePrice: 220000, variants: [{ label: "Nhỏ (<5 kg)",   price: 220000 }, { label: "Vừa (5–15 kg)", price: 320000 }, { label: "Lớn (>15 kg)", price: 450000 }], bookingsMonth: 29, revenueMonth: 9280000, status: "active" },
  { id: "SV-G03", category: "grooming",   name: "Cắt tỉa lông",                 description: "Cắt tỉa tạo kiểu theo yêu cầu, tỉa móng, vệ sinh vùng mắt và mũi.",                   duration: 90,  durationUnit: "phút", pricingType: "variants", basePrice: 250000, variants: [{ label: "Nhỏ (<5 kg)",   price: 250000 }, { label: "Vừa (5–15 kg)", price: 380000 }, { label: "Lớn (>15 kg)", price: 550000 }], bookingsMonth: 22, revenueMonth: 8360000, status: "active" },
  { id: "SV-G04", category: "grooming",   name: "Grooming đầy đủ",              description: "Trọn gói: tắm cao cấp + cắt tỉa + vệ sinh tai + cắt móng + xịt thơm.",               duration: 180, durationUnit: "phút", pricingType: "variants", basePrice: 350000, variants: [{ label: "Nhỏ (<5 kg)",   price: 350000 }, { label: "Vừa (5–15 kg)", price: 520000 }, { label: "Lớn (>15 kg)", price: 750000 }], bookingsMonth: 18, revenueMonth: 10440000, status: "active", tag: "Được yêu thích" },
  { id: "SV-G05", category: "grooming",   name: "Vệ sinh tai",                  description: "Làm sạch ống tai, loại bỏ lông tai, nhỏ thuốc tai nếu cần.",                          duration: 20,  durationUnit: "phút", pricingType: "fixed",    basePrice: 80000,  bookingsMonth: 31, revenueMonth: 2480000, status: "active" },
  { id: "SV-G06", category: "grooming",   name: "Cắt móng",                     description: "Cắt và giũa móng an toàn, bôi kem dưỡng móng.",                                       duration: 15,  durationUnit: "phút", pricingType: "fixed",    basePrice: 50000,  bookingsMonth: 38, revenueMonth: 1900000, status: "active" },
  { id: "SV-G07", category: "grooming",   name: "Trị liệu lông chuyên sâu",    description: "Ủ dưỡng lông bằng keratin/protein, phục hồi lông khô xơ, tăng độ bóng mượt.",         duration: 120, durationUnit: "phút", pricingType: "variants", basePrice: 300000, variants: [{ label: "Nhỏ (<5 kg)",   price: 300000 }, { label: "Vừa (5–15 kg)", price: 420000 }, { label: "Lớn (>15 kg)", price: 580000 }], bookingsMonth: 8,  revenueMonth: 3360000, status: "inactive" },

  // ── Lưu trú
  { id: "SV-B01", category: "boarding",   name: "Phòng tiêu chuẩn",             description: "Phòng riêng thoáng mát, ăn đúng giờ, dạo chơi 2 lần/ngày, báo cáo hàng ngày.",      duration: 1,   durationUnit: "đêm",  pricingType: "fixed",    basePrice: 150000, bookingsMonth: 28, revenueMonth: 12600000, status: "active", tag: "Phổ biến" },
  { id: "SV-B02", category: "boarding",   name: "Phòng VIP",                    description: "Phòng cao cấp rộng rãi, giường nệm êm, điều hoà riêng, webcam xem trực tiếp.",         duration: 1,   durationUnit: "đêm",  pricingType: "fixed",    basePrice: 250000, bookingsMonth: 14, revenueMonth: 10500000, status: "active" },
  { id: "SV-B03", category: "boarding",   name: "Phòng gia đình",               description: "Phòng lớn cho 2 thú cưng cùng gia đình, không gian vui chơi riêng.",                  duration: 1,   durationUnit: "đêm",  pricingType: "fixed",    basePrice: 350000, bookingsMonth: 6,  revenueMonth: 6300000, status: "active" },
  { id: "SV-B04", category: "boarding",   name: "Chăm sóc ban ngày",            description: "Gửi ban ngày từ 8:00–18:00, có bữa trưa, vui chơi, tắm nhẹ nếu cần.",                duration: 1,   durationUnit: "ngày", pricingType: "fixed",    basePrice: 120000, bookingsMonth: 19, revenueMonth: 6840000, status: "active" },
  { id: "SV-B05", category: "boarding",   name: "Chăm sóc đặc biệt",           description: "Dành cho thú cưng bệnh hoặc cao tuổi: theo dõi sức khoẻ 24/7, thuốc theo toa.",       duration: 1,   durationUnit: "đêm",  pricingType: "fixed",    basePrice: 400000, bookingsMonth: 3,  revenueMonth: 3600000, status: "active" },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<Category, {
  label: string; icon: React.ElementType;
  color: string; bg: string; border: string; dot: string;
}> = {
  clinic:      { label: "Khám bệnh",  icon: Stethoscope, color: "text-cyan-600",    bg: "bg-cyan-50",    border: "border-cyan-200",   dot: "bg-cyan-500" },
  vaccination: { label: "Tiêm chủng", icon: Syringe,     color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-200", dot: "bg-violet-500" },
  grooming:    { label: "Grooming",   icon: Scissors,    color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200",dot: "bg-emerald-500" },
  boarding:    { label: "Lưu trú",    icon: BedDouble,   color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",  dot: "bg-amber-500" },
};

const CATEGORIES: Category[] = ["clinic", "vaccination", "grooming", "boarding"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(n: number) {
  return n.toLocaleString("vi-VN");
}

function priceDisplay(svc: Service) {
  if (svc.pricingType === "fixed") return `${fmtPrice(svc.basePrice)}₫`;
  const prices = svc.variants!.map((v) => v.price);
  return `${fmtPrice(Math.min(...prices))} – ${fmtPrice(Math.max(...prices))}₫`;
}

function revenueDisplay(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M₫`;
  return `${fmtPrice(n)}₫`;
}

// ─── Category Tab ─────────────────────────────────────────────────────────────

function CategoryTab({
  cat, active, count, onClick,
}: { cat: Category; active: boolean; count: number; onClick: () => void }) {
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
      <span className={`text-[11px] font-mono ${active ? cfg.color + "/70" : "text-muted-foreground"}`}>
        {count}
      </span>
    </button>
  );
}

// ─── Service Detail Drawer ────────────────────────────────────────────────────

function ServiceDrawer({
  service, onClose, onEdit,
}: { service: Service; onClose: () => void; onEdit: () => void }) {
  const cfg = CATEGORY_CONFIG[service.category];
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="w-[420px] bg-white h-full shadow-2xl flex flex-col border-l border-border">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.border} border flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={cfg.color} />
              </div>
              <div>
                <div className="text-[17px] font-bold text-foreground leading-tight">{service.name}</div>
                <div className={`text-[12px] font-semibold mt-0.5 ${cfg.color}`}>{cfg.label}</div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
              <X size={15} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Status + tag */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${service.status === "active" ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200" : "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${service.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
              {service.status === "active" ? "Đang hoạt động" : "Tạm ngưng"}
            </span>
            {service.tag && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
                <Star size={10} className="fill-amber-500 text-amber-500" /> {service.tag}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground font-mono ml-auto">{service.id}</span>
          </div>

          {/* Description */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Mô tả dịch vụ</div>
            <p className="text-[13.5px] text-foreground leading-relaxed">{service.description}</p>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border border-border">
            <Clock size={16} className="text-muted-foreground flex-shrink-0" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Thời gian</div>
              <div className="text-[15px] font-bold font-mono text-foreground mt-0.5">
                {service.duration} {service.durationUnit}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Bảng giá</div>
            {service.pricingType === "fixed" ? (
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-white">
                <span className="text-[13px] font-medium text-muted-foreground">Giá cố định</span>
                <span className="font-mono font-bold text-[20px] text-foreground">{fmtPrice(service.basePrice)}₫</span>
              </div>
            ) : (
              <div className="space-y-2">
                {service.variants!.map((v) => (
                  <div key={v.label} className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-white hover:bg-muted/20 transition-colors">
                    <span className="text-[13px] font-medium text-foreground">{v.label}</span>
                    <span className="font-mono font-bold text-[15px] text-foreground">{fmtPrice(v.price)}₫</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Thống kê tháng này</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/40 rounded-xl p-4 border border-border text-center">
                <div className="font-mono font-bold text-[24px] text-foreground leading-none">{service.bookingsMonth}</div>
                <div className="text-[11px] text-muted-foreground mt-1.5">Lượt đặt lịch</div>
              </div>
              <div className="bg-muted/40 rounded-xl p-4 border border-border text-center">
                <div className={`font-mono font-bold text-[20px] leading-none ${cfg.color}`}>{revenueDisplay(service.revenueMonth)}</div>
                <div className="text-[11px] text-muted-foreground mt-1.5">Doanh thu</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border flex items-center gap-3 flex-shrink-0">
          <button className="flex items-center gap-2 h-10 px-4 border border-border bg-white rounded-xl text-[13px] font-medium text-muted-foreground hover:bg-muted transition-colors">
            <Copy size={13} /> Nhân bản
          </button>
          <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground rounded-xl text-[13px] font-semibold hover:opacity-90 transition-opacity">
            <Edit size={13} /> Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

const EMPTY_SERVICE: Omit<Service, "id" | "bookingsMonth" | "revenueMonth"> = {
  category: "clinic",
  name: "",
  description: "",
  duration: 30,
  durationUnit: "phút",
  pricingType: "fixed",
  basePrice: 0,
  variants: [
    { label: "Nhỏ (<5 kg)", price: 0 },
    { label: "Vừa (5–15 kg)", price: 0 },
    { label: "Lớn (>15 kg)", price: 0 },
  ],
  status: "active",
};

function ServiceModal({
  editing,
  onClose,
  onSave,
}: {
  editing: Service | null;
  onClose: () => void;
  onSave: (svc: Service) => void;
}) {
  const isEdit = !!editing;
  const [form, setForm] = useState<Omit<Service, "id" | "bookingsMonth" | "revenueMonth">>(
    editing
      ? { category: editing.category, name: editing.name, description: editing.description, duration: editing.duration, durationUnit: editing.durationUnit, pricingType: editing.pricingType, basePrice: editing.basePrice, variants: editing.variants ?? EMPTY_SERVICE.variants, status: editing.status, tag: editing.tag }
      : { ...EMPTY_SERVICE }
  );

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const setVariant = (i: number, field: keyof PriceVariant, val: string | number) =>
    setForm((f) => {
      const vs = [...(f.variants ?? [])];
      vs[i] = { ...vs[i], [field]: val };
      return { ...f, variants: vs };
    });

  const addVariant = () =>
    setForm((f) => ({ ...f, variants: [...(f.variants ?? []), { label: "", price: 0 }] }));

  const removeVariant = (i: number) =>
    setForm((f) => ({ ...f, variants: (f.variants ?? []).filter((_, j) => j !== i) }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      ...form,
      id: editing?.id ?? `SV-${Date.now()}`,
      bookingsMonth: editing?.bookingsMonth ?? 0,
      revenueMonth: editing?.revenueMonth ?? 0,
    });
  };

  const catOptions: { v: Category; label: string; icon: React.ElementType }[] = [
    { v: "clinic",      label: "Khám bệnh",  icon: Stethoscope },
    { v: "vaccination", label: "Tiêm chủng", icon: Syringe },
    { v: "grooming",    label: "Grooming",   icon: Scissors },
    { v: "boarding",    label: "Lưu trú",    icon: BedDouble },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="w-[520px] bg-white h-full shadow-2xl flex flex-col border-l border-border">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-foreground tracking-tight">
              {isEdit ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEdit ? `Đang sửa: ${editing!.name}` : "Điền thông tin để tạo dịch vụ mới"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors mt-0.5">
            <X size={15} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Category */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">Danh mục dịch vụ</label>
            <div className="grid grid-cols-2 gap-2">
              {catOptions.map(({ v, label, icon: Icon }) => {
                const cfg = CATEGORY_CONFIG[v];
                return (
                  <button
                    key={v}
                    onClick={() => !isEdit && set("category", v)}
                    disabled={isEdit}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-[13px] font-medium transition-all text-left ${form.category === v ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "border-border bg-muted/30 text-muted-foreground"} disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    <Icon size={15} className={form.category === v ? cfg.color : "text-muted-foreground"} />
                    {label}
                    {form.category === v && <Check size={13} className={`${cfg.color} ml-auto flex-shrink-0`} />}
                  </button>
                );
              })}
            </div>
            {isEdit && <p className="text-[11px] text-muted-foreground mt-1.5 italic">Không thể đổi danh mục sau khi tạo.</p>}
          </div>

          {/* Name */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">Tên dịch vụ</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="VD: Khám tổng quát, Tắm & sấy tiêu chuẩn..."
              className="w-full h-10 px-4 border border-border rounded-xl text-[14px] font-semibold text-foreground placeholder:font-normal placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="Mô tả chi tiết dịch vụ, bao gồm những gì..."
              className="w-full px-4 py-3 border border-border rounded-xl text-[13.5px] leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white resize-none"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">Thời gian thực hiện</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={form.duration}
                onChange={(e) => set("duration", Number(e.target.value))}
                className="w-24 h-10 px-3 border border-border rounded-xl text-[14px] font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white"
              />
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                {(["phút", "đêm", "ngày"] as const).map((u) => (
                  <button key={u} onClick={() => set("durationUnit", u)}
                    className={`px-3 py-1.5 rounded-md text-[12.5px] font-semibold transition-colors ${form.durationUnit === u ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing type */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">Kiểu định giá</label>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => set("pricingType", "fixed")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-semibold transition-all ${form.pricingType === "fixed" ? "bg-cyan-50 border-cyan-300 text-cyan-700" : "border-border bg-white text-muted-foreground hover:bg-muted"}`}>
                {form.pricingType === "fixed" && <Check size={13} className="text-cyan-600" />}
                Giá cố định
              </button>
              <button onClick={() => set("pricingType", "variants")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-semibold transition-all ${form.pricingType === "variants" ? "bg-cyan-50 border-cyan-300 text-cyan-700" : "border-border bg-white text-muted-foreground hover:bg-muted"}`}>
                {form.pricingType === "variants" && <Check size={13} className="text-cyan-600" />}
                Theo kích thước / biến thể
              </button>
            </div>

            {form.pricingType === "fixed" ? (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">₫</span>
                <input
                  type="number"
                  value={form.basePrice || ""}
                  onChange={(e) => set("basePrice", Number(e.target.value))}
                  placeholder="0"
                  className="w-full h-10 pl-8 pr-4 border border-border rounded-xl text-[14px] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white"
                />
              </div>
            ) : (
              <div className="space-y-2">
                {(form.variants ?? []).map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={v.label}
                      onChange={(e) => setVariant(i, "label", e.target.value)}
                      placeholder="Tên biến thể"
                      className="flex-1 h-9 px-3 border border-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white"
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">₫</span>
                      <input
                        type="number"
                        value={v.price || ""}
                        onChange={(e) => setVariant(i, "price", Number(e.target.value))}
                        placeholder="0"
                        className="w-32 h-9 pl-7 pr-3 border border-border rounded-lg text-[13px] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white"
                      />
                    </div>
                    <button onClick={() => removeVariant(i)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors">
                      <X size={13} className="text-muted-foreground hover:text-red-500" />
                    </button>
                  </div>
                ))}
                <button onClick={addVariant}
                  className="w-full flex items-center justify-center gap-2 h-9 border border-dashed border-border rounded-lg text-[12.5px] font-medium text-muted-foreground hover:text-foreground hover:border-slate-400 hover:bg-muted/30 transition-all">
                  <Plus size={13} /> Thêm biến thể
                </button>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
            <div>
              <div className="text-[13px] font-semibold text-foreground">Trạng thái dịch vụ</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">
                {form.status === "active" ? "Dịch vụ đang hiển thị và nhận đặt lịch" : "Dịch vụ tạm ngưng, không nhận đặt lịch mới"}
              </div>
            </div>
            <button onClick={() => set("status", form.status === "active" ? "inactive" : "active")}>
              {form.status === "active"
                ? <ToggleRight size={36} className="text-primary" />
                : <ToggleLeft size={36} className="text-muted-foreground" />
              }
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center gap-3 flex-shrink-0 bg-muted/20">
          <button onClick={onClose} className="flex-1 h-10 border border-border bg-white rounded-xl text-[13px] font-semibold text-foreground hover:bg-muted transition-colors">Huỷ bỏ</button>
          <button onClick={handleSave} disabled={!form.name.trim()}
            className="flex-1 h-10 bg-primary text-primary-foreground rounded-xl text-[13px] font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-cyan-500/20">
            {isEdit ? "Lưu thay đổi" : "Tạo dịch vụ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Service Row ──────────────────────────────────────────────────────────────

function ServiceRow({
  service, selected, onSelect, onEdit, onToggleStatus,
}: {
  service: Service; selected: boolean;
  onSelect: () => void; onEdit: () => void; onToggleStatus: () => void;
}) {
  const cfg = CATEGORY_CONFIG[service.category];

  return (
    <tr
      onClick={onSelect}
      className={`group transition-colors cursor-pointer ${selected ? "bg-cyan-50/60" : "hover:bg-muted/25"}`}
    >
      <td className="pl-5 pr-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${cfg.bg} ${cfg.border} border flex items-center justify-center flex-shrink-0`}>
            <cfg.icon size={14} className={cfg.color} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold text-foreground truncate">{service.name}</span>
              {service.tag && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 flex-shrink-0 hidden group-hover:inline">
                  {service.tag}
                </span>
              )}
            </div>
            <div className="text-[11.5px] text-muted-foreground font-mono">{service.id}</div>
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
        <div className="text-[13.5px] font-bold font-mono text-foreground">{priceDisplay(service)}</div>
        {service.pricingType === "variants" && (
          <div className="text-[11px] text-muted-foreground mt-0.5">{service.variants!.length} mức giá</div>
        )}
      </td>

      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <BarChart3 size={11} className="text-muted-foreground" />
          <span className="font-mono font-bold text-[13px] text-foreground">{service.bookingsMonth}</span>
          <span className="text-[11px] text-muted-foreground">lượt/tháng</span>
        </div>
        <div className={`text-[12px] font-mono font-semibold mt-0.5 ${cfg.color}`}>{revenueDisplay(service.revenueMonth)}</div>
      </td>

      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onToggleStatus}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${service.status === "active" ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-200"}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${service.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
          {service.status === "active" ? "Hoạt động" : "Tạm ngưng"}
        </button>
      </td>

      <td className="pr-4 py-3.5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 hover:bg-muted rounded-md transition-colors">
            <Edit size={13} className="text-muted-foreground" />
          </button>
          <button className="p-1.5 hover:bg-red-50 rounded-md transition-colors">
            <Trash2 size={13} className="text-muted-foreground hover:text-red-500" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Services Page ────────────────────────────────────────────────────────────

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [activeCat, setActiveCat] = useState<Category>("clinic");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;

    adminService
      .listServices()
      .then((data) => {
        if (!mounted) return;
        setServices(data.services as Service[]);
        setLoadError("");
      })
      .catch((error) => {
        if (!mounted) return;
        setLoadError(error instanceof Error ? error.message : "Không thể tải dữ liệu dịch vụ.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const catServices = services.filter((s) => s.category === activeCat);
  const filtered = catServices.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const selectedService = services.find((s) => s.id === selectedId) ?? null;

  const openEdit = (svc: Service) => {
    setEditingService(svc);
    setShowModal(true);
  };

  const openAdd = () => {
    setEditingService(null);
    setShowModal(true);
  };

  const handleSave = (svc: Service) => {
    setServices((ss) => {
      const idx = ss.findIndex((s) => s.id === svc.id);
      if (idx >= 0) {
        const next = [...ss];
        next[idx] = svc;
        return next;
      }
      return [...ss, svc];
    });
    setShowModal(false);
    setEditingService(null);
  };

  const toggleStatus = (id: string) => {
    setServices((ss) => ss.map((s) => s.id === id ? { ...s, status: s.status === "active" ? "inactive" : "active" } : s));
  };

  // Summary stats across all services
  const totalActive   = services.filter((s) => s.status === "active").length;
  const totalRevMonth = services.reduce((acc, s) => acc + s.revenueMonth, 0);
  const topService    = [...services].sort((a, b) => b.bookingsMonth - a.bookingsMonth)[0];
  const totalBookings = services.reduce((acc, s) => acc + s.bookingsMonth, 0);

  const cfg = CATEGORY_CONFIG[activeCat];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Quản lý dịch vụ</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Danh mục dịch vụ và bảng giá của trung tâm</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-1.5 h-9 px-4 border border-border bg-white text-[13px] font-medium text-foreground rounded-lg hover:bg-muted transition-colors">
            <Filter size={13} /> Lọc
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 h-9 px-4 bg-primary text-primary-foreground text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity">
            <Plus size={14} /> Thêm dịch vụ
          </button>
        </div>
      </div>

      {/* KPI strip */}
      {loadError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Tổng dịch vụ",       value: services.length.toString(),   sub: `${totalActive} đang hoạt động`,       icon: BarChart3,  iconBg: "bg-cyan-50",    iconColor: "text-cyan-600" },
          { label: "Lượt đặt tháng này", value: totalBookings.toString(),     sub: "Tất cả danh mục",                     icon: TrendingUp, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
          { label: "Doanh thu tháng",    value: revenueDisplay(totalRevMonth), sub: "Từ tất cả dịch vụ",                  icon: BarChart3,  iconBg: "bg-violet-50",  iconColor: "text-violet-600" },
          { label: "Phổ biến nhất",      value: topService?.bookingsMonth.toString() ?? "—", sub: topService?.name ?? "—", icon: Star,       iconBg: "bg-amber-50",   iconColor: "text-amber-600" },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${k.iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={17} className={k.iconColor} />
              </div>
              <div className="min-w-0">
                <div className="font-mono font-bold text-[20px] text-foreground leading-none truncate">{k.value}</div>
                <div className="text-[12px] font-semibold text-foreground mt-1 truncate">{k.label}</div>
                <div className="text-[11px] text-muted-foreground truncate">{k.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-card border border-border p-1 rounded-xl">
          {CATEGORIES.map((cat) => (
            <CategoryTab
              key={cat} cat={cat} active={activeCat === cat}
              count={services.filter((s) => s.category === cat).length}
              onClick={() => { setActiveCat(cat); setSelectedId(null); setSearch(""); setStatusFilter("all"); }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            {(["all", "active", "inactive"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${statusFilter === s ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {s === "all" ? "Tất cả" : s === "active" ? "Hoạt động" : "Tạm ngưng"}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm dịch vụ..."
              className="w-52 h-9 pl-8 pr-4 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Category header */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${cfg.bg} ${cfg.border} border`}>
        <cfg.icon size={16} className={cfg.color} />
        <span className={`text-[13.5px] font-bold ${cfg.color}`}>{cfg.label}</span>
        <span className={`text-[12px] font-mono ${cfg.color}/70`}>{filtered.length} dịch vụ</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className={`text-[12px] ${cfg.color}/70`}>
            Tổng doanh thu tháng:
          </span>
          <span className={`font-mono font-bold text-[13px] ${cfg.color}`}>
            {revenueDisplay(catServices.reduce((a, s) => a + s.revenueMonth, 0))}
          </span>
        </div>
      </div>

      {/* Service table */}
      {loading && (
        <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          Đang tải dữ liệu dịch vụ...
        </div>
      )}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px]">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {["Dịch vụ", "Thời gian", "Bảng giá", "Lượt đặt / Doanh thu", "Trạng thái", ""].map((h, i) => (
                  <th key={h + i} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground ${i === 0 ? "pl-5 text-left" : i === 5 ? "w-20" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertTriangle size={20} className="text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">Không tìm thấy dịch vụ phù hợp</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((svc) => (
                <ServiceRow
                  key={svc.id}
                  service={svc}
                  selected={svc.id === selectedId}
                  onSelect={() => setSelectedId(selectedId === svc.id ? null : svc.id)}
                  onEdit={() => openEdit(svc)}
                  onToggleStatus={() => toggleStatus(svc.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{filtered.length}/{catServices.length} dịch vụ · {catServices.filter(s => s.status === "active").length} đang hoạt động</span>
          <button onClick={openAdd} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-2">
            <Plus size={11} /> Thêm dịch vụ {cfg.label.toLowerCase()}
          </button>
        </div>
      </div>

      {/* Modals / Drawers */}
      {selectedService && (
        <ServiceDrawer
          service={selectedService}
          onClose={() => setSelectedId(null)}
          onEdit={() => { openEdit(selectedService); setSelectedId(null); }}
        />
      )}
      {showModal && (
        <ServiceModal
          editing={editingService}
          onClose={() => { setShowModal(false); setEditingService(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
