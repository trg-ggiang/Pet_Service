import { BedDouble, Scissors, Stethoscope, Syringe } from "lucide-react";
import type { Category, PriceVariant, Service } from "../types/services.types";

export const INITIAL_SERVICES: Service[] = [
  {
    id: "SV-C01",
    category: "clinic",
    name: "Khám tổng quát",
    description:
      "Kiểm tra sức khoẻ toàn diện, đo các chỉ số sinh tồn, tư vấn dinh dưỡng và phòng bệnh.",
    duration: 45,
    durationUnit: "phút",
    pricingType: "fixed",
    basePrice: 250000,
    bookingsMonth: 38,
    revenueMonth: 9500000,
    status: "active",
  },
  {
    id: "SV-C02",
    category: "clinic",
    name: "Khám da liễu",
    description:
      "Chẩn đoán và điều trị các bệnh về da, lông, móng; kiểm tra ký sinh trùng ngoài.",
    duration: 60,
    durationUnit: "phút",
    pricingType: "fixed",
    basePrice: 320000,
    bookingsMonth: 24,
    revenueMonth: 7680000,
    status: "active",
    tag: "Phổ biến",
  },
  {
    id: "SV-C03",
    category: "clinic",
    name: "Khám ngoại khoa",
    description:
      "Phẫu thuật nhỏ, xử lý vết thương, khâu vết mổ, chăm sóc hậu phẫu.",
    duration: 60,
    durationUnit: "phút",
    pricingType: "fixed",
    basePrice: 380000,
    bookingsMonth: 11,
    revenueMonth: 4180000,
    status: "active",
  },
  {
    id: "SV-C04",
    category: "clinic",
    name: "Khám nội khoa chuyên sâu",
    description:
      "Đánh giá chuyên sâu hệ tiêu hoá, hô hấp, tim mạch; kết hợp xét nghiệm cận lâm sàng.",
    duration: 90,
    durationUnit: "phút",
    pricingType: "fixed",
    basePrice: 450000,
    bookingsMonth: 9,
    revenueMonth: 4050000,
    status: "active",
  },
  {
    id: "SV-C05",
    category: "clinic",
    name: "Siêu âm bụng",
    description:
      "Chẩn đoán hình ảnh bằng siêu âm các cơ quan nội tạng vùng bụng.",
    duration: 30,
    durationUnit: "phút",
    pricingType: "fixed",
    basePrice: 280000,
    bookingsMonth: 14,
    revenueMonth: 3920000,
    status: "active",
  },
  {
    id: "SV-C06",
    category: "clinic",
    name: "Xét nghiệm máu tổng quát",
    description:
      "Công thức máu toàn phần (CBC), sinh hoá máu cơ bản, phân tích tế bào.",
    duration: 30,
    durationUnit: "phút",
    pricingType: "fixed",
    basePrice: 350000,
    bookingsMonth: 19,
    revenueMonth: 6650000,
    status: "active",
  },
  {
    id: "SV-C07",
    category: "clinic",
    name: "Phẫu thuật triệt sản",
    description:
      "Phẫu thuật cắt bỏ buồng trứng/tinh hoàn theo phương pháp nội soi an toàn.",
    duration: 120,
    durationUnit: "phút",
    pricingType: "fixed",
    basePrice: 1500000,
    bookingsMonth: 4,
    revenueMonth: 6000000,
    status: "active",
  },
  {
    id: "SV-V01",
    category: "vaccination",
    name: "Tiêm phòng dại",
    description:
      "Vaccine ngừa bệnh dại bắt buộc hàng năm, cấp giấy chứng nhận tiêm phòng.",
    duration: 15,
    durationUnit: "phút",
    pricingType: "fixed",
    basePrice: 180000,
    bookingsMonth: 32,
    revenueMonth: 5760000,
    status: "active",
    tag: "Phổ biến",
  },
  {
    id: "SV-V02",
    category: "vaccination",
    name: "Combo 5 bệnh (chó)",
    description:
      "Phòng Distemper, Adenovirus, Parvovirus, Leptospira, Parainfluenza — nhắc lại hàng năm.",
    duration: 20,
    durationUnit: "phút",
    pricingType: "fixed",
    basePrice: 320000,
    bookingsMonth: 21,
    revenueMonth: 6720000,
    status: "active",
  },
  {
    id: "SV-V03",
    category: "vaccination",
    name: "Combo 4 bệnh (mèo)",
    description:
      "Phòng Herpesvirus, Calicivirus, Panleukopenia, Chlamydia — nhắc lại hàng năm.",
    duration: 20,
    durationUnit: "phút",
    pricingType: "fixed",
    basePrice: 280000,
    bookingsMonth: 17,
    revenueMonth: 4760000,
    status: "active",
  },
  {
    id: "SV-V04",
    category: "vaccination",
    name: "FeLV (bạch cầu mèo)",
    description:
      "Vaccine phòng bệnh bạch cầu ở mèo — khuyến nghị cho mèo đi ra ngoài.",
    duration: 20,
    durationUnit: "phút",
    pricingType: "fixed",
    basePrice: 250000,
    bookingsMonth: 8,
    revenueMonth: 2000000,
    status: "active",
  },
  {
    id: "SV-V05",
    category: "vaccination",
    name: "Tiêm nhắc lại",
    description:
      "Mũi nhắc lại cho các loại vaccine đã tiêm — áp dụng theo lịch hẹn của bác sĩ.",
    duration: 15,
    durationUnit: "phút",
    pricingType: "fixed",
    basePrice: 150000,
    bookingsMonth: 28,
    revenueMonth: 4200000,
    status: "active",
  },
  {
    id: "SV-V06",
    category: "vaccination",
    name: "Tiêm phòng Bordetella",
    description:
      "Phòng bệnh ho cũi (kennel cough) — bắt buộc trước khi gửi lưu trú.",
    duration: 15,
    durationUnit: "phút",
    pricingType: "fixed",
    basePrice: 200000,
    bookingsMonth: 6,
    revenueMonth: 1200000,
    status: "inactive",
  },
  {
    id: "SV-G01",
    category: "grooming",
    name: "Tắm & sấy tiêu chuẩn",
    description:
      "Tắm xà phòng chuyên dụng, sấy khô, chải lông, vệ sinh tai cơ bản.",
    duration: 60,
    durationUnit: "phút",
    pricingType: "variants",
    basePrice: 150000,
    variants: [
      { label: "Nhỏ (<5 kg)", price: 150000 },
      { label: "Vừa (5–15 kg)", price: 220000 },
      { label: "Lớn (>15 kg)", price: 320000 },
    ],
    bookingsMonth: 44,
    revenueMonth: 9900000,
    status: "active",
    tag: "Phổ biến",
  },
  {
    id: "SV-G02",
    category: "grooming",
    name: "Tắm & sấy cao cấp",
    description:
      "Shampoo dưỡng chất cao cấp, sấy tạo kiểu, xịt thơm, massage nhẹ.",
    duration: 90,
    durationUnit: "phút",
    pricingType: "variants",
    basePrice: 220000,
    variants: [
      { label: "Nhỏ (<5 kg)", price: 220000 },
      { label: "Vừa (5–15 kg)", price: 320000 },
      { label: "Lớn (>15 kg)", price: 450000 },
    ],
    bookingsMonth: 29,
    revenueMonth: 9280000,
    status: "active",
  },
  {
    id: "SV-G03",
    category: "grooming",
    name: "Cắt tỉa lông",
    description:
      "Cắt tỉa tạo kiểu theo yêu cầu, tỉa móng, vệ sinh vùng mắt và mũi.",
    duration: 90,
    durationUnit: "phút",
    pricingType: "variants",
    basePrice: 250000,
    variants: [
      { label: "Nhỏ (<5 kg)", price: 250000 },
      { label: "Vừa (5–15 kg)", price: 380000 },
      { label: "Lớn (>15 kg)", price: 550000 },
    ],
    bookingsMonth: 22,
    revenueMonth: 8360000,
    status: "active",
  },
  {
    id: "SV-G04",
    category: "grooming",
    name: "Grooming đầy đủ",
    description:
      "Trọn gói: tắm cao cấp + cắt tỉa + vệ sinh tai + cắt móng + xịt thơm.",
    duration: 180,
    durationUnit: "phút",
    pricingType: "variants",
    basePrice: 350000,
    variants: [
      { label: "Nhỏ (<5 kg)", price: 350000 },
      { label: "Vừa (5–15 kg)", price: 520000 },
      { label: "Lớn (>15 kg)", price: 750000 },
    ],
    bookingsMonth: 18,
    revenueMonth: 10440000,
    status: "active",
    tag: "Được yêu thích",
  },
  {
    id: "SV-G05",
    category: "grooming",
    name: "Vệ sinh tai",
    description: "Làm sạch ống tai, loại bỏ lông tai, nhỏ thuốc tai nếu cần.",
    duration: 20,
    durationUnit: "phút",
    pricingType: "fixed",
    basePrice: 80000,
    bookingsMonth: 31,
    revenueMonth: 2480000,
    status: "active",
  },
  {
    id: "SV-G06",
    category: "grooming",
    name: "Cắt móng",
    description: "Cắt và giũa móng an toàn, bôi kem dưỡng móng.",
    duration: 15,
    durationUnit: "phút",
    pricingType: "fixed",
    basePrice: 50000,
    bookingsMonth: 38,
    revenueMonth: 1900000,
    status: "active",
  },
  {
    id: "SV-G07",
    category: "grooming",
    name: "Trị liệu lông chuyên sâu",
    description:
      "Ủ dưỡng lông bằng keratin/protein, phục hồi lông khô xơ, tăng độ bóng mượt.",
    duration: 120,
    durationUnit: "phút",
    pricingType: "variants",
    basePrice: 300000,
    variants: [
      { label: "Nhỏ (<5 kg)", price: 300000 },
      { label: "Vừa (5–15 kg)", price: 420000 },
      { label: "Lớn (>15 kg)", price: 580000 },
    ],
    bookingsMonth: 8,
    revenueMonth: 3360000,
    status: "inactive",
  },
  {
    id: "SV-B01",
    category: "boarding",
    name: "Phòng tiêu chuẩn",
    description:
      "Phòng riêng thoáng mát, ăn đúng giờ, dạo chơi 2 lần/ngày, báo cáo hàng ngày.",
    duration: 1,
    durationUnit: "đêm",
    pricingType: "fixed",
    basePrice: 150000,
    bookingsMonth: 28,
    revenueMonth: 12600000,
    status: "active",
    tag: "Phổ biến",
  },
  {
    id: "SV-B02",
    category: "boarding",
    name: "Phòng VIP",
    description:
      "Phòng cao cấp rộng rãi, giường nệm êm, điều hoà riêng, webcam xem trực tiếp.",
    duration: 1,
    durationUnit: "đêm",
    pricingType: "fixed",
    basePrice: 250000,
    bookingsMonth: 14,
    revenueMonth: 10500000,
    status: "active",
  },
  {
    id: "SV-B03",
    category: "boarding",
    name: "Phòng gia đình",
    description:
      "Phòng lớn cho 2 thú cưng cùng gia đình, không gian vui chơi riêng.",
    duration: 1,
    durationUnit: "đêm",
    pricingType: "fixed",
    basePrice: 350000,
    bookingsMonth: 6,
    revenueMonth: 6300000,
    status: "active",
  },
  {
    id: "SV-B04",
    category: "boarding",
    name: "Chăm sóc ban ngày",
    description:
      "Gửi ban ngày từ 8:00–18:00, có bữa trưa, vui chơi, tắm nhẹ nếu cần.",
    duration: 1,
    durationUnit: "ngày",
    pricingType: "fixed",
    basePrice: 120000,
    bookingsMonth: 19,
    revenueMonth: 6840000,
    status: "active",
  },
  {
    id: "SV-B05",
    category: "boarding",
    name: "Chăm sóc đặc biệt",
    description:
      "Dành cho thú cưng bệnh hoặc cao tuổi: theo dõi sức khoẻ 24/7, thuốc theo toa.",
    duration: 1,
    durationUnit: "đêm",
    pricingType: "fixed",
    basePrice: 400000,
    bookingsMonth: 3,
    revenueMonth: 3600000,
    status: "active",
  },
];

export const CATEGORY_CONFIG: Record<
  Category,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    dot: string;
  }
> = {
  clinic: {
    label: "Khám bệnh",
    icon: Stethoscope,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    dot: "bg-cyan-500",
  },
  vaccination: {
    label: "Tiêm chủng",
    icon: Syringe,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    dot: "bg-violet-500",
  },
  grooming: {
    label: "Grooming",
    icon: Scissors,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  boarding: {
    label: "Lưu trú",
    icon: BedDouble,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
};

export const CATEGORIES: Category[] = [
  "clinic",
  "vaccination",
  "grooming",
  "boarding",
];

export const EMPTY_SERVICE: Omit<
  Service,
  "id" | "bookingsMonth" | "revenueMonth"
> = {
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

export function formatPrice(n: number) {
  return n.toLocaleString("vi-VN");
}

export function priceDisplay(svc: Service) {
  if (svc.pricingType === "fixed") return `${formatPrice(svc.basePrice)}₫`;
  const prices = svc.variants!.map((v) => v.price);
  return `${formatPrice(Math.min(...prices))} – ${formatPrice(Math.max(...prices))}₫`;
}

export function revenueDisplay(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M₫`;
  return `${formatPrice(n)}₫`;
}
