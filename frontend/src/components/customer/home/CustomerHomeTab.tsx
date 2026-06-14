import { useState, useRef, useEffect } from "react";
import { BedDouble, Bell, ChevronRight, Clock, Heart, Plus, X, CalendarDays } from "lucide-react";
import type { Apt, CustomerPortalNotification, Pet } from "../../../types/customer/portal";
import { getNotifConfig, getPetColorById, getStatusConfig } from "../../../utils/customer/portalConfig";

const CHAIN_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=320&h=200&fit=crop",
    caption: "Đội ngũ bác sĩ chuyên nghiệp",
    tag: "Phòng khám",
    rotate: "rotate-1",
  },
  {
    src: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=320&h=200&fit=crop",
    caption: "Môi trường sống an toàn",
    tag: "Cơ sở vật chất",
    rotate: "-rotate-2",
  },
  {
    src: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=320&h=200&fit=crop",
    caption: "Chăm sóc tận tình 24/7",
    tag: "Dịch vụ",
    rotate: "rotate-2",
  },
  {
    src: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=320&h=200&fit=crop",
    caption: "Bé cưng được yêu thương",
    tag: "Thú cưng",
    rotate: "-rotate-1",
  },
];

const CLINIC = {
  name: "Pet Care & Clinic",
  tagline: "Chăm sóc tận tâm — Yêu thương chân thành",
  since: 2018,
  description:
    "Được thành lập từ năm 2018, chúng tôi tự hào là trung tâm chăm sóc thú cưng uy tín hàng đầu. Đội ngũ bác sĩ thú y được đào tạo bài bản, trang thiết bị y tế hiện đại và không gian thân thiện mang đến sự chăm sóc tốt nhất cho người bạn lông xù của bạn.",
  stats: [
    { value: "5,000+", label: "Thú cưng" },
    { value: "15", label: "Bác sĩ" },
    { value: "24/7", label: "Hỗ trợ" },
    { value: "4.9★", label: "Đánh giá" },
  ],
};

const CLINIC_GALLERY = [
  { src: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&h=300&fit=crop", caption: "Đội ngũ bác sĩ" },
  { src: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&h=300&fit=crop", caption: "Phòng khám" },
  { src: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop", caption: "Thú cưng" },
];

const PET_FLAT: Record<string, { bg: string; text: string }> = {
  amber:   { bg: "bg-amber-100/60",   text: "text-amber-800"   },
  slate:   { bg: "bg-slate-100/60",   text: "text-slate-600"   },
  cyan:    { bg: "bg-cyan-100/60",    text: "text-cyan-800"    },
  rose:    { bg: "bg-rose-100/60",    text: "text-rose-700"    },
  violet:  { bg: "bg-violet-100/60",  text: "text-violet-700"  },
  emerald: { bg: "bg-emerald-100/60", text: "text-emerald-700" },
};

const PET_RADII = [
  "65% 35% 45% 55% / 55% 45% 65% 35%",
  "35% 65% 55% 45% / 45% 55% 35% 65%",
  "55% 45% 35% 65% / 65% 35% 55% 45%",
];

const WAVE_FILL = "#f1f5f9"; 

// Điều chỉnh tăng biên độ nhấp nhô uốn lượn nhiều hơn hẳn cho dải sóng SVG tràn viền 100%
function FullWidthContinuousWave() {
  return (
    <div className="w-full h-24 overflow-hidden leading-[0] select-none pointer-events-none relative -my-1">
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-full transform scale-y-110 origin-center">
        {/* Lớp sóng phủ trên (Màu trắng tinh khôi của vùng appointments) */}
        <path
          d="M0,60 C240,0 480,120 720,60 C960,0 1200,120 1440,60 L1440,0 L0,0 Z"
          fill="white"
        />
        {/* Lớp sóng phủ dưới (Màu xám mịn của vùng dịch vụ) */}
        <path
          d="M0,60 C240,0 480,120 720,60 C960,0 1200,120 1440,60 L1440,120 L0,120 Z"
          fill={WAVE_FILL}
        />
      </svg>
    </div>
  );
}

function VerticalPhotoRope() {
  const photoRotates = [
    "rotate-[1deg]",
    "-rotate-[1.4deg]",
    "rotate-[0.8deg]",
    "-rotate-[0.8deg]",
  ];

  return (
    <div className="relative w-full min-h-[900px] overflow-visible">
      {/* MAIN ROPE */}
        <div className="absolute inset-0 flex justify-center pointer-events-none">
          <svg
            className="h-full w-[140px] overflow-visible"
            viewBox="0 0 140 900"
            fill="none"
          >
            {/* soft shadow rope */}
            <path
              d="
                M70 0
                C64 120, 80 220, 74 340
                C68 460, 84 580, 76 720
                C72 800, 80 860, 78 900
              "
              stroke="rgba(0,0,0,0.05)"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* main rope */}
            <path
              d="
                M70 0
                C64 120, 80 220, 74 340
                C68 460, 84 580, 76 720
                C72 800, 80 860, 78 900
              "
              stroke="#c4a484"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="2 3"
            />
          </svg>
        </div>

      {/* PHOTO STACK */}
      <div className="relative z-10 flex flex-col gap-24 pt-8">
        {CHAIN_IMAGES.map((img, i) => {
          const isRight = i % 2 === 0;

          return (
            <div
              key={i}
              className={`
                relative flex w-full
                ${isRight
                  ? "justify-start pl-36"
                  : "justify-end pr-36"}
              `}
            >
              {/* hanging string */}
              <div
                className={`
                  absolute top-[-38px]
                  ${isRight
                    ? "left-[145px]"
                    : "right-[145px]"}
                `}
              >
                <svg width="36" height="42" fill="none">
                  <path
                    d={
                      isRight
                        ? "M18 0 Q18 12 22 40"
                        : "M18 0 Q18 12 14 40"
                    }
                    stroke="#bfa080"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                    opacity="0.6"
                  />
                </svg>
              </div>

              <div className="relative flex flex-col items-center">
                {/* wooden clip */}
                <div className="relative z-20 w-6 h-2 rounded-full bg-[#9d7550] shadow-sm -mb-1" />

                {/* photo */}
                <div
                  className={`
                    w-52
                    bg-[#fffdfa]
                    p-2.5
                    pb-4
                    border border-stone-200
                    shadow-[0_12px_28px_rgba(0,0,0,0.08)]
                    transition-all duration-300
                    hover:rotate-0
                    hover:-translate-y-1
                    ${photoRotates[i % photoRotates.length]}
                  `}
                >
                  <div className="overflow-hidden aspect-[4/3] bg-stone-100">
                    <img
                      src={img.src}
                      alt={img.caption}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="pt-2 text-center">
                    <span className="block text-[9px] uppercase tracking-[0.2em] text-stone-400 mb-1">
                      {img.tag}
                    </span>

                    <p className="text-sm italic text-stone-700 line-clamp-1">
                      {img.caption}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type UrgentMed = { petName: string; medicineName: string; daysRemaining: number };

export function CustomerHomeTab({
  userName,
  apts,
  pets,
  notifications,
  notificationsLoading,
  notificationsError,
  unreadCount,
  onBookAppointment,
  onBookBoarding,
  onOpenAppointments,
  onOpenPets,
  onOpenHistory,
  onOpenNotifications,
  onNotificationClick,
}: {
  userName: string;
  apts: Apt[];
  pets: Pet[];
  notifications: CustomerPortalNotification[];
  notificationsLoading: boolean;
  notificationsError: string;
  unreadCount: number;
  onBookAppointment: () => void;
  onBookBoarding?: () => void;
  onOpenAppointments: () => void;
  onOpenPets: () => void;
  onOpenHistory: () => void;
  onOpenNotifications: () => void;
  onNotificationClick: (notification: CustomerPortalNotification) => void;
  urgentMedications?: UrgentMed[];
}) {
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showNotif) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotif]);

  const dateLabel = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" });
  const unreadNotifs = notifications.filter((n) => !n.read);
  const now = new Date();
  const todayFormats = [now.toLocaleDateString("vi-VN"), `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`];
  const todayApts = apts.filter((a) => todayFormats.some((f) => a.date === f) || a.date.toLowerCase().includes("hôm nay"));

  return (
    <div className="min-h-full bg-white text-slate-800 flex flex-col relative overflow-x-hidden">

      {/* SECTION 1: HEADER & CỤM CTA (Nền trắng cố định phẳng phiu phía trên) */}
      <div className="px-8 pt-12 bg-white relative z-30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">{dateLabel}</p>
            <h1 className="mt-2 text-5xl font-black tracking-tight text-slate-900 leading-tight">Xin chào, {userName} 🐾</h1>
          </div>

          {/* Notification bell */}
          <div className="relative flex-shrink-0 pt-2" ref={notifRef}>
            <button onClick={() => setShowNotif((v) => !v)} className="relative flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white hover:border-cyan-200 transition-colors">
              <Bell size={20} className="text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[22px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">{unreadCount}</span>
              )}
            </button>
            {showNotif && (
              <div className="absolute right-0 z-50 w-80 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl top-14">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
                  <h3 className="text-base font-bold text-slate-900">Thông báo</h3>
                  <button onClick={() => setShowNotif(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notificationsLoading && <div className="px-4 py-8 text-center text-sm text-slate-400">Đang tải...</div>}
                  {!notificationsLoading && notificationsError && <div className="px-4 py-8 text-center text-sm text-red-500">{notificationsError}</div>}
                  {!notificationsLoading && !notificationsError && unreadCount === 0 && (
                    <div className="flex flex-col items-center gap-2 px-4 py-10"><Bell size={28} className="text-slate-200" /><p className="text-sm text-slate-400">Không có thông báo mới</p></div>
                  )}
                  {unreadNotifs.slice(0, 5).map((n) => {
                    const cfg = getNotifConfig(n.type);
                    return (
                      <div key={n.id} onClick={() => { onNotificationClick(n); setShowNotif(false); }} className="flex cursor-pointer gap-3 border-b border-slate-50 px-4 py-3.5 hover:bg-slate-50">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: cfg.bg }}><cfg.icon size={16} style={{ color: cfg.color }} /></div>
                        <div className="min-w-0 flex-1"><p className="line-clamp-1 text-sm font-bold text-slate-800">{n.title}</p><p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.desc}</p></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cụm nút bấm hành động */}
        <div className="mt-8 flex items-center gap-4">
          <button onClick={onBookAppointment} className="flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-base font-bold text-white transition-all hover:bg-cyan-700 shadow-md">
            <CalendarDays size={18} /> Đặt lịch hẹn mới
          </button>
          <button onClick={() => onBookBoarding?.()} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-base font-bold text-slate-700 transition-all hover:bg-slate-50 shadow-2xs">
            <BedDouble size={18} className="text-slate-500" /> Đặt phòng nội trú
          </button>
        </div>
      </div>

      {/* BỐ CỤC PHÂN TẦNG TUYỆT ĐỐI KHÔNG CHIA CỘT NGANG Ở LỚP NỀN ĐÁY */}
      <div className="w-full flex flex-col mt-6 relative">
        
        {/* TẦNG THẤP NHẤT (Z-0): Lớp thảm màu phẳng kề nhau và đường sóng uốn khúc sâu tràn 1440px */}
        <div className="absolute inset-0 z-0 flex flex-col pointer-events-none select-none">
          {/* Nền 1: Thảm Trắng phẳng bao trọn vùng Lịch hẹn cá nhân */}
          <div className="w-full h-[320px] bg-white" />
          
          {/* SÓNG LIÊN TỤC TRÀN VIỀN: Sóng uốn lượn sâu chạy dọc luồn phía sau cột ảnh */}
          <FullWidthContinuousWave />
          
          {/* Nền 2: Thảm xám phẳng cho hệ thống dịch vụ */}
          <div className="w-full flex-1" style={{ backgroundColor: WAVE_FILL }} />
        </div>

        {/* TẦNG CAO NHẤT (Z-10): Luồng nội dung Flexbox 2 cột (items-stretch để cột ảnh kéo dài full vách) */}
        <div className="relative z-10 w-full flex items-stretch gap-8 px-8">
          
          {/* CỘT TRÁI (65%): Chứa Text Lịch hẹn và Dịch vụ */}
          <div className="min-w-0 flex flex-col justify-between" style={{ flex: "0 0 65%" }}>
            
            {/* KHỐI NỘI DUNG LỊCH HẸN HÔM NAY (Chiếm trọn phần trống thừa hắt lên) */}
            <div className="pt-4 h-[300px] flex flex-col justify-start">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-cyan-600">Hoạt động trong ngày</p>
                  <h2 className="mt-0.5 text-3xl font-black text-slate-900">Lịch hẹn hôm nay</h2>
                </div>
                <button onClick={onOpenAppointments} className="text-sm font-bold text-cyan-700 hover:underline">
                  Tất cả ({apts.length}) →
                </button>
              </div>

              <div className="min-h-[200px] max-h-[200px] overflow-y-auto pr-1 flex flex-col justify-start gap-3.5">
                {todayApts.length === 0 ? (
                  <div className="h-full flex items-center justify-start text-base text-slate-500 italic bg-white rounded-xl px-5 py-6 border border-cyan-100/40 shadow-sm">
                    Hôm nay bạn không có lịch hẹn nào tại trung tâm. Thú cưng của bạn đang rảnh!
                  </div>
                ) : (
                  todayApts.slice(0, 3).map((apt) => {
                    const statusCfg = getStatusConfig(apt.status);
                    return (
                      <div key={apt.id} className="flex items-center justify-between p-4 border border-cyan-100/40 border-l-4 rounded-r-xl bg-white shadow-sm" style={{ borderLeftColor: apt.iconColor }}>
                        <div>
                          <p className="text-lg font-bold text-slate-900">{apt.service}</p>
                          <p className="text-sm text-slate-500 mt-1">Bé cưng: <span className="font-semibold text-slate-700">{apt.pet}</span> {apt.doctor && `· Bs. ${apt.doctor}`}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-slate-900">{apt.time}</p>
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${statusCfg.badgeCls}`}>{statusCfg.label}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Khoảng đệm tự nhiên luồn qua lớp sóng dưới nền bảo vệ văn bản */}
            <div className="h-16" />

            {/* KHỐI NỘI DUNG HỆ THỐNG DỊCH VỤ ĐÁ CUỘI (Chỉ để chữ "Dịch vụ" và giới hạn chiều dài mô tả) */}
            <div className="pt-6 pb-12">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Hệ sinh thái</p>
                <h2 className="mt-0.5 text-3xl font-black text-slate-900">Dịch vụ</h2> {/* ĐÃ SỬA: Thu gọn tiêu đề chỉ để Dịch vụ */}
              </div>

              <div className="space-y-6">
                {/* Khám bệnh */}
                <div className="flex items-center gap-6">
                  <button onClick={onBookAppointment} className="flex flex-shrink-0 flex-col items-center justify-center gap-1.5 bg-cyan-100 text-cyan-600 transition-transform duration-300 hover:scale-105 shadow-2xs" style={{ width: 115, height: 100, borderRadius: "65% 35% 45% 55% / 55% 45% 65% 35%" }}>
                    <Plus size={26} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Khám bệnh</span>
                  </button>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-900">Đặt lịch khám sức khỏe chuyên sâu</h3>
                    {/* ĐÃ SỬA: Ép bọc giới hạn chiều dài max-w-md và tự động xuống dòng */}
                    <p className="mt-1 text-sm text-slate-500 leading-relaxed max-w-md w-full whitespace-normal break-words">
                      Chủ động hẹn giờ tiêm chủng định kỳ, kiểm tra lâm sàng tổng quát nhanh chóng và chính xác.
                    </p>
                  </div>
                </div>

                {/* Lịch sử */}
                <div className="flex flex-row-reverse items-center gap-6">
                  <button onClick={onOpenHistory} className="flex flex-shrink-0 flex-col items-center justify-center gap-1.5 bg-violet-100 text-violet-600 transition-transform duration-300 hover:scale-105 shadow-2xs" style={{ width: 110, height: 110, borderRadius: "35% 65% 55% 45% / 45% 55% 35% 65%" }}>
                    <Clock size={26} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Lịch sử</span>
                  </button>
                  <div className="min-w-0 text-right">
                    <h3 className="text-lg font-bold text-slate-900">Hồ sơ bệnh án điện tử</h3>
                    {/* ĐÃ SỬA: Ép bọc giới hạn chiều dài max-w-md và tự động xuống dòng */}
                    <p className="mt-1 text-sm text-slate-500 leading-relaxed max-w-md w-full whitespace-normal break-words ml-auto">
                      Tra cứu phác đồ điều trị chuyên khoa, kết quả xét nghiệm lâm sàng và đơn thuốc cũ thuận tiện.
                    </p>
                  </div>
                </div>

                {/* Lưu trú */}
                <div className="flex items-center gap-6">
                  <button onClick={() => onBookBoarding?.()} className="flex flex-shrink-0 flex-col items-center justify-center gap-1.5 bg-amber-100 text-amber-600 transition-transform duration-300 hover:scale-105 shadow-2xs" style={{ width: 110, height: 105, borderRadius: "55% 45% 35% 65% / 65% 35% 55% 45%" }}>
                    <BedDouble size={26} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Lưu trú</span>
                  </button>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-900">Khách sạn thú cưng 5 sao</h3>
                    {/* ĐÃ SỬA: Ép bọc giới hạn chiều dài max-w-md và tự động xuống dòng */}
                    <p className="mt-1 text-sm text-slate-500 leading-relaxed max-w-md w-full whitespace-normal break-words">
                      Nơi gửi gắm an tâm tuyệt đối với không gian nội trú sạch thoáng, trang bị hệ thống camera giám sát liên tục 24/7.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* CỘT PHẢI (35%): SỢI DÂY Treo ẢNH ĐỨNG NẰM Ở LỚP TRÊN CÙNG (Z-INDEX 30 CAO NHẤT) */}
          <div className="min-w-0 relative z-30 flex-1" style={{ flex: "0 0 35%" }}>
            <VerticalPhotoRope />
          </div>

        </div>
      </div>

      {/* =========================================================================
          SECTION 4: FOOTER CHÂN TRANG (Tách biệt hoàn toàn, nền màu nhạt)
          ========================================================================= */}
      <div className="bg-cyan-50/15 px-8 py-12 flex gap-10 border-t border-slate-100 relative z-30">
        
        {/* TRÁI: Về chúng tôi */}
        <div className="min-w-0 flex-[2]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-600">Đơn vị chủ quản</p>
          <h2 className="mt-0.5 text-3xl font-black text-slate-900">{CLINIC.name}</h2>
          <p className="text-sm italic text-slate-400 font-medium">{CLINIC.tagline} — Since {CLINIC.since}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{CLINIC.description}</p>

          <div className="mt-4 grid grid-cols-4 gap-4 border-t border-b border-slate-200/40 py-4">
            {CLINIC.stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-black text-cyan-600">{stat.value}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {CLINIC_GALLERY.map((img, index) => (
              <div key={index} className="group relative overflow-hidden rounded-lg aspect-[4/3]">
                <img src={img.src} alt={img.caption} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <span className="absolute bottom-2 left-2 text-xs font-bold text-white drop-shadow">{img.caption}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PHẢI: Album thú cưng đá cuội */}
        <div className="w-72 flex-shrink-0 border-l border-slate-200/40 pl-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-rose-400">Gia đình lông xù</p>
              <h3 className="text-xl font-black text-slate-900">Album thú cưng</h3>
            </div>
            <button onClick={onOpenPets} className="text-xs font-bold text-rose-500 hover:underline">Tất cả →</button>
          </div>

          {pets.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-white/40">
              <Heart size={16} className="mx-auto text-slate-300 mb-1" />
              <p className="text-xs text-slate-400">Chưa có bé cưng</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 justify-start">
              {pets.slice(0, 3).map((pet, i) => {
                const clr = getPetColorById(pet.colorId);
                const flat = PET_FLAT[pet.colorId] ?? { bg: "bg-slate-100", text: "text-slate-600" };
                const radius = PET_RADII[i % PET_RADII.length];
                return (
                  <button key={pet.id} onClick={onOpenPets} className="group flex flex-col items-center gap-0.5">
                    <div
                      className="relative overflow-hidden transition-transform duration-300 group-hover:scale-105 shadow-sm"
                      style={{
                        width: 76,
                        height: 76,
                        borderRadius: radius,
                        background: `linear-gradient(135deg, ${clr.from}25, ${clr.to}40)`,
                        border: `1.5px solid ${clr.ring}44`,
                      }}
                    >
                      {pet.image ? (
                        <img src={pet.image} alt={pet.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className={`flex h-full w-full items-center justify-center text-sm font-black ${flat.text}`}>{pet.initials}</div>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-700 mt-1 line-clamp-1 w-16 text-center">{pet.name}</p>
                  </button>
                );
              })}

              {/* Thêm mới nhanh hình đá cuội */}
              <button onClick={onOpenPets} className="group flex flex-col items-center gap-0.5">
                <div
                  className="flex items-center justify-center border border-dashed border-slate-300 text-slate-400 bg-white/50 transition-all duration-300 group-hover:border-cyan-400 group-hover:text-cyan-500 shadow-sm"
                  style={{ width: 76, height: 76, borderRadius: PET_RADII[pets.length % PET_RADII.length] }}
                >
                  <Plus size={18} />
                </div>
                <p className="text-[11px] font-semibold text-slate-400 group-hover:text-cyan-600 mt-1">Thêm mới</p>
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}