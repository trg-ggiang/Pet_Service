import { AlertTriangle, Clock, Syringe, User } from "lucide-react";
import type { DoctorExamDetail } from "../../services/doctorAppointments";
import { pickIcon } from "./utils";

export function PetSummaryPanel({
  patientCard,
  petInfoItems,
  owner,
  riskAlerts,
  vaccinations,
  history,
}: {
  patientCard: DoctorExamDetail["patientCard"];
  petInfoItems: DoctorExamDetail["petInfoItems"];
  owner: DoctorExamDetail["owner"];
  riskAlerts: DoctorExamDetail["riskAlerts"];
  vaccinations: DoctorExamDetail["vaccinations"];
  history: DoctorExamDetail["history"];
}) {
  return (
    <div className="border-r border-border bg-white overflow-y-auto flex flex-col">
      <div className="relative flex-shrink-0 h-52 bg-slate-100">
        {patientCard.imageUrl ? (
          <img src={patientCard.imageUrl} alt={patientCard.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <span className="text-4xl font-bold text-slate-400">{patientCard.initials}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3.5">
          <h2 className="text-xl font-bold text-white tracking-tight">{patientCard.name}</h2>
          <span className="text-[11px] font-semibold text-white/70">{patientCard.subtitle}</span>
          <span className="inline-flex mt-2 px-2 py-0.5 rounded-full bg-amber-400/90 text-amber-900 text-[10px] font-bold">
            {patientCard.serviceBadge}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4 flex-1">
        <div className="grid grid-cols-2 gap-2">
          {petInfoItems.map((item) => {
            const Icon = pickIcon(item.icon);
            return (
              <div key={item.key} className="flex flex-col gap-1 bg-slate-50 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon size={11} className="text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </span>
                </div>
                <span className="text-[13px] font-semibold text-foreground truncate">{item.value}</span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-0.5">
            Chủ nhân
          </p>
          <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center flex-shrink-0">
              <User size={13} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-foreground truncate">{owner.fullName}</div>
              <div className="text-[11px] text-muted-foreground">{owner.phone}</div>
            </div>
          </div>
        </div>

        {riskAlerts.length > 0 && (
          <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              {riskAlerts.map((alert) => (
                <p key={alert.key} className="text-[12px] text-red-600">
                  <b>{alert.label}:</b> {alert.value}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-0.5">
            Tiêm phòng
          </p>

          {vaccinations.length > 0 ? (
            vaccinations.map((vaccine) => (
              <div key={vaccine.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Syringe size={12} className={vaccine.isDue ? "text-red-400" : "text-emerald-500"} />
                  <span className="text-[12px] font-semibold text-foreground">{vaccine.name}</span>
                </div>
                <div className="text-right">
                  <div className={`text-[10px] font-bold ${vaccine.isDue ? "text-red-500" : "text-emerald-600"}`}>
                    {vaccine.isDue ? "Cần nhắc" : "Còn hạn"}
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    {vaccine.dateGivenLabel || "?"} → {vaccine.nextDueDateLabel || "?"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground bg-slate-50 rounded-xl p-3">
              Chưa có dữ liệu tiêm phòng.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-0.5">
            Lịch sử khám
          </p>

          {history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="flex items-start gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                <Clock size={11} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-foreground">{item.service}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {item.date} · {item.doctorName}
                  </div>
                  {item.diagnosisNote && (
                    <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">{item.diagnosisNote}</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground bg-slate-50 rounded-xl p-3">
              Chưa có lịch sử khám trước đó.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
