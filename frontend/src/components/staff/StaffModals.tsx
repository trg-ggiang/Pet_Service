import { useState } from "react";
import { Activity, BedDouble, CheckCircle2, Coffee, Stethoscope, Star, X } from "lucide-react";
import type {
  BoardingDailyStatus,
  BoardingGuest,
  PaymentItem,
  PaymentMethod,
  StaffAppointment,
} from "../../features/staff/services/staffAppointments";
import { APT_STATUS_CONFIG, SERVICE_ICONS } from "./staffPortalConfig";

export function AppointmentDetailModal({ apt, onClose, onConfirm, onCheckIn, onApproveRequest, approving }: {
  apt: StaffAppointment;
  onClose: () => void;
  onConfirm: () => void;
  onCheckIn: () => void;
  onApproveRequest: () => void;
  approving?: boolean;
}) {
  const statusCfg = APT_STATUS_CONFIG[apt.status];
  const svcIcon = SERVICE_ICONS[apt.serviceType] || SERVICE_ICONS.exam;
  const Icon = svcIcon.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg" onClick={(event) => event.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: svcIcon.bg }}>
              <Icon size={20} style={{ color: svcIcon.color }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{apt.service}</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Mã: {apt.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg inline-block" style={{ color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}>
            {statusCfg.label}
          </span>
          {[
            { label: "Thú cưng", value: `${apt.petName} (${apt.species}${apt.breed ? ` · ${apt.breed}` : ""})` },
            { label: "Chủ nuôi", value: apt.owner },
            { label: "Số điện thoại", value: apt.phone },
            { label: "Ngày khám", value: apt.date || "--" },
            { label: "Giờ khám", value: apt.time || "--" },
            { label: "Phòng/Số thứ tự", value: apt.queue || "--" },
            { label: "Loại dịch vụ", value: apt.service },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500 font-medium">{item.label}</span>
              <span className="text-sm font-bold text-slate-900">{item.value}</span>
            </div>
          ))}
          {apt.note && (
            <div className="py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500 font-medium">Ghi ch?</span>
              <p className="text-sm font-medium text-slate-700 mt-1">{apt.note}</p>
            </div>
          )}
          {apt.pendingRequest && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              <div>{apt.pendingRequest.type === "RESCHEDULE" ? "Yêu cầu đổi lịch" : "Yêu cầu hủy lịch"}</div>
              {apt.pendingRequest.type === "RESCHEDULE" && (
                <div className="mt-1 text-amber-700">Lịch mới: {apt.pendingRequest.date || "--"} {String(apt.pendingRequest.time || "").slice(0, 5)}</div>
              )}
              {apt.pendingRequest.reason && <div className="mt-1 text-amber-700">Lý do: {apt.pendingRequest.reason}</div>}
            </div>
          )}
        </div>
        {(apt.status === "scheduled" || apt.status === "confirmed") && (
          <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
            {apt.status === "scheduled" && apt.pendingRequest ? (
              <button onClick={onApproveRequest} disabled={approving} className="w-full h-11 rounded-xl bg-emerald-500 text-sm font-bold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2">
                <CheckCircle2 size={16} /> {approving ? "Đang duyệt..." : "Duyệt yêu cầu"}
              </button>
            ) : apt.status === "scheduled" ? (
              <button onClick={onConfirm} className="w-full h-11 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}>
                <CheckCircle2 size={16} /> Xác nhận lịch hẹn
              </button>
            ) : apt.status === "confirmed" ? (
              <button onClick={onCheckIn} className="w-full h-11 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg,#7C3AED,#8B5CF6)" }}>
                <CheckCircle2 size={16} /> Check-in · Bắt đầu khám
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export function BoardingDetailModal({ guest, onClose, onToggleStatus }: {
  guest: BoardingGuest;
  onClose: () => void;
  onToggleStatus: (field: keyof BoardingDailyStatus) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(event) => event.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <BedDouble size={20} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{guest.petName} · Phòng {guest.room}</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{guest.species} · {guest.breed}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Thông tin chủ nuôi</h4>
            {[
              { label: "Họ tên", value: guest.owner },
              { label: "Số điện thoại", value: guest.phone },
              { label: "Check-in", value: guest.checkIn || "--" },
              { label: "Check-out", value: guest.checkOut || "--" },
              { label: "Số đêm", value: `${guest.nights} đêm` },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-xs py-1">
                <span className="text-slate-500 font-medium">{item.label}:</span>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Chế độ ăn uống</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Loại thức ăn:</span>
                <span className="font-bold text-slate-900">{guest.foodType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Số bữa/ngày:</span>
                <span className="font-bold text-slate-900">{guest.mealsPerDay} bữa</span>
              </div>
              {guest.specialNotes && <div className="pt-2 border-t border-slate-200 text-slate-700">{guest.specialNotes}</div>}
            </div>
          </div>
          <div className="bg-cyan-50 rounded-2xl p-4 border border-cyan-100">
            <h4 className="text-sm font-bold text-cyan-900 mb-3">Cập nhật trạng thái hôm nay</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Bữa sáng", field: "breakfast" as const, icon: Coffee },
                { label: "Bữa trưa", field: "lunch" as const, icon: Coffee },
                { label: "Bữa tối", field: "dinner" as const, icon: Coffee },
                { label: "Vệ sinh phòng", field: "cleaned" as const, icon: Star },
                { label: "Vận động", field: "exercised" as const, icon: Activity },
                { label: "Kiểm tra sức khỏe", field: "healthCheck" as const, icon: Stethoscope },
              ].map((item) => {
                const Icon = item.icon;
                const done = guest.todayStatus[item.field];
                return (
                  <button key={item.field} onClick={() => onToggleStatus(item.field)} className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                    done ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}>
                    {done ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                    <span className="text-xs font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex-shrink-0">
          <button onClick={onClose} className="w-full h-11 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-white transition-colors">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export function PaymentProcessModal({ payment, onClose, onComplete }: {
  payment: PaymentItem;
  onClose: () => void;
  onComplete: (method: PaymentMethod) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("cash");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md" onClick={(event) => event.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Xác nhận thanh toán</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Mã: {payment.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { label: "Thú cưng", value: payment.petName },
            { label: "Chủ nuôi", value: payment.owner },
            { label: "Dịch vụ", value: payment.service },
            { label: "Ngày", value: payment.date },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500 font-medium">{item.label}</span>
              <span className="text-sm font-bold text-slate-900">{item.value}</span>
            </div>
          ))}
          <div className="bg-cyan-50 rounded-2xl p-4 border border-cyan-100">
            <div className="text-sm text-slate-500 font-medium mb-1">Tổng tiền</div>
            <div className="text-3xl font-bold text-cyan-700">{payment.amount.toLocaleString()} VND</div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Phương thức thanh toán</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "cash" as const, label: "Tiền mặt" },
                { id: "transfer" as const, label: "Chuyển khoản" },
                { id: "card" as const, label: "Thẻ" },
              ].map((item) => (
                <button key={item.id} onClick={() => setMethod(item.id)} className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  method === item.id ? "bg-cyan-50 border-cyan-500 text-cyan-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex gap-3">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-white transition-colors">
            Hủy
          </button>
          <button onClick={() => onComplete(method)} className="flex-1 h-11 rounded-xl text-sm font-bold text-white transition-colors" style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}>
            Xác nhận thanh toán
          </button>
        </div>
      </div>
    </div>
  );
}
