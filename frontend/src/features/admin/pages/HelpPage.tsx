import { useState } from "react";
import {
  Search, ChevronDown, ChevronRight, Mail, Phone, MessageCircle,
  BookOpen, Video, FileText, Calendar, Users, Stethoscope,
  Settings, BarChart3, Star, ExternalLink,
} from "lucide-react";

interface FAQ {
  q: string;
  a: string;
}

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  faqs: FAQ[];
}

const SECTIONS: Section[] = [
  {
    id: "appointments", title: "Lịch hẹn", icon: Calendar,
    color: "text-cyan-600", bg: "bg-cyan-50",
    faqs: [
      { q: "Làm sao để tạo lịch hẹn mới?", a: "Vào mục Lịch hẹn → nhấn nút 'Lịch hẹn mới' (góc trên phải). Điền thông tin khách hàng, thú cưng, chọn dịch vụ và bác sĩ phụ trách, sau đó xác nhận." },
      { q: "Làm sao để thay đổi trạng thái lịch hẹn?", a: "Nhấn vào biểu tượng mắt (👁) trên hàng lịch hẹn để mở drawer chi tiết. Trong đó có các nút để cập nhật trạng thái: Xác nhận, Bắt đầu khám, Hoàn thành hoặc Huỷ." },
      { q: "Lịch hẹn bị huỷ sẽ được xử lý như thế nào?", a: "Lịch hẹn bị huỷ vẫn được lưu trong hệ thống với trạng thái 'Đã huỷ'. Bạn có thể xem lại trong bộ lọc trạng thái. Doanh thu từ lịch hẹn bị huỷ không được tính vào báo cáo." },
      { q: "Có thể đặt lịch tái khám ngay khi đang khám không?", a: "Có. Trong màn hình khám bệnh (bước 5 - Tái khám), bạn có thể chọn ngày và thời gian cho lần khám tiếp theo. Hệ thống sẽ tự động tạo lịch hẹn mới với thông tin bệnh nhân được điền sẵn." },
    ],
  },
  {
    id: "users", title: "Khách hàng", icon: Users,
    color: "text-indigo-600", bg: "bg-indigo-50",
    faqs: [
      { q: "Làm sao để tìm kiếm khách hàng?", a: "Trong mục Khách hàng, sử dụng ô tìm kiếm ở góc trên phải. Có thể tìm theo tên, email hoặc số điện thoại. Kết quả được lọc theo thời gian thực." },
      { q: "Tôi có thể xem lịch sử dịch vụ của một khách hàng không?", a: "Nhấn vào biểu tượng mắt hoặc tên khách hàng để mở drawer chi tiết. Trong đó có đầy đủ lịch sử lịch hẹn, thú cưng đã đăng ký và tổng chi tiêu." },
      { q: "Làm sao để khoá tài khoản khách hàng?", a: "Trong drawer chi tiết khách hàng, cuộn xuống và nhấn nút 'Khoá tài khoản'. Tài khoản bị khoá sẽ không thể đăng nhập nhưng dữ liệu vẫn được giữ nguyên." },
    ],
  },
  {
    id: "medical", title: "Khám bệnh", icon: Stethoscope,
    color: "text-emerald-600", bg: "bg-emerald-50",
    faqs: [
      { q: "Quy trình khám bệnh gồm mấy bước?", a: "Hệ thống khám bệnh có 5 bước: (1) Triệu chứng — ghi nhận lý do khám và các dấu hiệu ban đầu; (2) Lâm sàng — đo chỉ số sinh tồn và khám theo hệ thống cơ thể; (3) Chẩn đoán — nhập chẩn đoán chính và phụ, chỉ định xét nghiệm; (4) Kê đơn — chọn thuốc, liều lượng và hướng dẫn sử dụng; (5) Tái khám — đặt lịch hẹn tiếp theo." },
      { q: "Làm sao để bắt đầu khám bệnh từ màn hình lịch hẹn?", a: "Trong trang Lịch hẹn, nhấn biểu tượng mắt trên hàng lịch hẹn 'Đang khám' → trong drawer chọn 'Bắt đầu khám'. Hoặc từ trang Tổng quan, nhấn nút Khám ở panel Doctor Status." },
      { q: "Dữ liệu khám bệnh được lưu như thế nào?", a: "Mỗi buổi khám tạo ra một hồ sơ bệnh án riêng, liên kết với thú cưng và khách hàng tương ứng. Hồ sơ bao gồm triệu chứng, chỉ số sinh tồn, chẩn đoán, đơn thuốc và ngày tái khám." },
    ],
  },
  {
    id: "services", title: "Dịch vụ", icon: FileText,
    color: "text-violet-600", bg: "bg-violet-50",
    faqs: [
      { q: "Làm sao để thêm dịch vụ mới?", a: "Vào mục Dịch vụ → nhấn nút '+' hoặc 'Thêm dịch vụ'. Điền tên, mô tả, danh mục, thời lượng và giá. Với giá theo biến thể (theo cân nặng), chọn loại giá 'Biến thể' và thêm các mức giá tương ứng." },
      { q: "Tôi có thể tạm ngưng một dịch vụ không?", a: "Có. Nhấn vào tên dịch vụ để mở drawer, sau đó nhấn 'Chỉnh sửa'. Chuyển trạng thái từ 'Đang hoạt động' sang 'Tạm ngưng'. Dịch vụ tạm ngưng không hiển thị khi đặt lịch hẹn mới." },
    ],
  },
  {
    id: "reports", title: "Báo cáo", icon: BarChart3,
    color: "text-amber-600", bg: "bg-amber-50",
    faqs: [
      { q: "Dữ liệu báo cáo được cập nhật theo tần suất nào?", a: "Các biểu đồ và KPI trên trang Báo cáo cập nhật theo thời gian thực. Bạn có thể chọn lọc theo Tuần / Tháng / Quý / Năm để xem xu hướng tổng thể." },
      { q: "Làm sao để xuất báo cáo ra Excel hay PDF?", a: "Trên trang Báo cáo, nhấn nút 'Xuất báo cáo' ở góc trên phải. Hệ thống sẽ tạo file với dữ liệu theo kỳ đang chọn. Bạn có thể chọn định dạng Excel (.xlsx) hoặc PDF." },
    ],
  },
  {
    id: "settings", title: "Cài đặt hệ thống", icon: Settings,
    color: "text-slate-600", bg: "bg-slate-100",
    faqs: [
      { q: "Làm sao để thêm tài khoản cho nhân viên mới?", a: "Tài khoản nhân viên và bác sĩ được tạo trong mục Nhân viên → Thêm nhân viên → điền thông tin và chọn phòng ban. Sau khi tạo, hệ thống gửi email kích hoạt tài khoản tự động." },
      { q: "Tôi có thể phân quyền khác nhau cho từng nhân viên không?", a: "Có. Mỗi tài khoản có một role: Admin (toàn quyền), Bác sĩ (khám bệnh, xem lịch hẹn), Nhân viên (grooming, boarding). Bạn có thể chỉnh role trong phần quản lý nhân viên." },
    ],
  },
];

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border-b border-border/60 last:border-0 transition-colors ${open ? "bg-muted/10" : ""}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-foreground">{faq.q}</span>
        {open ? <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" /> : <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
        </div>
      )}
    </div>
  );
}

export function HelpPage() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const filtered = SECTIONS.map((s) => ({
    ...s,
    faqs: s.faqs.filter(
      (f) => !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((s) => !search || s.faqs.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Hướng dẫn & Hỗ trợ</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tài liệu hướng dẫn sử dụng hệ thống PetCare Center</p>
      </div>

      {/* Hero search */}
      <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}>
        <h2 className="text-xl font-bold text-white">Chúng tôi có thể giúp gì cho bạn?</h2>
        <p className="text-sm text-white/70 mt-1.5 mb-5">Tìm kiếm trong tài liệu hướng dẫn hoặc liên hệ hỗ trợ</p>
        <div className="relative max-w-md mx-auto">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm câu hỏi, tính năng..."
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/30 transition-all shadow-lg"
          />
        </div>
      </div>

      {/* Quick guides */}
      {!search && (
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">Hướng dẫn nhanh</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Calendar,   title: "Tạo lịch hẹn",    desc: "Hướng dẫn đặt và quản lý lịch hẹn", color: "text-cyan-600", bg: "bg-cyan-50" },
              { icon: Stethoscope, title: "Quy trình khám",  desc: "5 bước lập hồ sơ bệnh án điện tử",  color: "text-emerald-600", bg: "bg-emerald-50" },
              { icon: BarChart3,  title: "Xem báo cáo",      desc: "Phân tích doanh thu và hiệu suất",   color: "text-violet-600", bg: "bg-violet-50" },
              { icon: Users,      title: "Quản lý khách hàng", desc: "Thêm, chỉnh sửa, theo dõi khách", color: "text-indigo-600", bg: "bg-indigo-50" },
              { icon: BookOpen,   title: "Quản lý dịch vụ",  desc: "Thêm, định giá và phân loại dịch vụ", color: "text-amber-600", bg: "bg-amber-50" },
              { icon: Settings,   title: "Cài đặt hệ thống", desc: "Phân quyền và cấu hình phòng khám", color: "text-slate-600", bg: "bg-slate-100" },
            ].map((g) => {
              const Icon = g.icon;
              return (
                <button key={g.title} className="bg-white border border-border rounded-2xl p-4 text-left hover:shadow-md transition-all active:scale-[0.98] group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${g.bg}`}>
                    <Icon size={17} className={g.color} />
                  </div>
                  <div className="text-sm font-semibold text-foreground group-hover:text-cyan-600 transition-colors">{g.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{g.desc}</div>
                  <ChevronRight size={13} className="text-muted-foreground mt-2 group-hover:text-cyan-600 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* FAQ sections */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">
          {search ? `Kết quả tìm kiếm cho "${search}"` : "Câu hỏi thường gặp"}
        </h3>
        <div className="space-y-3">
          {filtered.map((section) => {
            const Icon = section.icon;
            const isOpen = !search && activeSection === section.id;
            return (
              <div key={section.id} className="bg-white border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => !search && setActiveSection(isOpen ? null : section.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${section.bg}`}>
                    <Icon size={16} className={section.color} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-foreground">{section.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{section.faqs.length} câu hỏi</div>
                  </div>
                  {!search && (
                    <ChevronDown
                      size={16}
                      className={`text-muted-foreground transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
                    />
                  )}
                </button>
                {(search || isOpen) && (
                  <div className="border-t border-border">
                    {section.faqs.map((faq, i) => (
                      <FAQItem key={i} faq={faq} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact support */}
      <div className="bg-white border border-border rounded-2xl p-6">
        <h3 className="text-sm font-bold text-foreground mb-1">Vẫn cần hỗ trợ?</h3>
        <p className="text-xs text-muted-foreground mb-4">Đội ngũ hỗ trợ của chúng tôi sẵn sàng giúp bạn trong giờ làm việc</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: MessageCircle, label: "Live Chat", desc: "Phản hồi trong vòng 5 phút",    color: "text-cyan-600", bg: "bg-cyan-50" },
            { icon: Mail,         label: "Email",     desc: "support@petcare.vn",              color: "text-indigo-600", bg: "bg-indigo-50" },
            { icon: Phone,        label: "Hotline",   desc: "028 3456 7890 (7:30 – 20:00)",   color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <button key={c.label} className="flex items-center gap-3 p-4 rounded-xl border border-border hover:shadow-sm transition-all text-left">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg}`}>
                  <Icon size={16} className={c.color} />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">{c.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{c.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
