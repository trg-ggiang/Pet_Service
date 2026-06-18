import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import {
  doctorAppointmentsService,
  type DoctorExamDetail,
  type DoctorExamRecord,
} from "../services/doctorAppointments";
import { ExamTopBar }       from "../../../components/doctor/ExamTopBar";
import { PetSummaryPanel }  from "../../../components/doctor/PetSummaryPanel";
import { SymptomForm }      from "../../../components/doctor/SymptomForm";
import { ClinicalExamForm } from "../../../components/doctor/ClinicalExamForm";
import { ServiceOrderPanel } from "../../../components/doctor/ServiceOrderPanel";
import { LoadingState, ErrorState } from "../../../components/doctor/ExamState";

type ExamTab = "symptoms" | "clinical" | "orders";

const FOLLOW_UP_TIME_OPTIONS = Array.from({ length: 22 }, (_, i) => {
  const total = 8 * 60 + i * 30;
  return String(Math.floor(total / 60)).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
});

function getTodayValue() {
  const n = new Date();
  return [n.getFullYear(), String(n.getMonth() + 1).padStart(2, "0"), String(n.getDate()).padStart(2, "0")].join("-");
}

function getCurrentTimeValue() {
  const n = new Date();
  return String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0");
}

function validateFollowUpSlot(record: DoctorExamRecord) {
  if (!record.nextVisitDate) return "";
  if (!record.nextVisitTime) return "Vui lòng chọn giờ tái khám";
  const slot = new Date(record.nextVisitDate + "T" + record.nextVisitTime + ":00");
  if (Number.isNaN(slot.getTime()) || slot.getTime() <= Date.now()) {
    return "Lịch tái khám phải nằm trong tương lai";
  }
  return "";
}

export function DoctorExamScreen({
  appointmentId,
  onBack,
  onFinish,
}: {
  appointmentId: number;
  onBack: () => void;
  onFinish: () => void;
}) {
  const [activeTab,          setActiveTab]          = useState<ExamTab>("symptoms");
  const [detail,             setDetail]             = useState<DoctorExamDetail | null>(null);
  const [record,             setRecord]             = useState<DoctorExamRecord | null>(null);
  const [loading,            setLoading]            = useState(true);
  const [saving,             setSaving]             = useState(false);
  const [completing,         setCompleting]         = useState(false);
  const [urgentAlertOpen,    setUrgentAlertOpen]    = useState(false);
  const [urgentAlertMessage, setUrgentAlertMessage] = useState("");
  const [urgentAlertSending, setUrgentAlertSending] = useState(false);
  const [error,              setError]              = useState("");
  const [message,            setMessage]            = useState("");
  const [elapsedMinutes,     setElapsedMinutes]     = useState(0);
  const [pendingServicesWarning, setPendingServicesWarning] = useState<string[]>([]);
  const examStartedAt = useRef(Date.now());

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        setMessage("");
        const d = await doctorAppointmentsService.fetchExamDetail(appointmentId);
        if (ignore) return;
        setDetail(d);
        setRecord(d.record);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "Không thể tải phiếu khám");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void load();
    return () => { ignore = true; };
  }, [appointmentId]);

  // Elapsed timer — tick every 30 s
  useEffect(() => {
    examStartedAt.current = Date.now();
    setElapsedMinutes(0);
    const id = setInterval(() => {
      setElapsedMinutes(Math.floor((Date.now() - examStartedAt.current) / 60_000));
    }, 30_000);
    return () => clearInterval(id);
  }, [appointmentId]);

  async function handleSaveDraft() {
    if (!record) return;
    try {
      setSaving(true); setError(""); setMessage("");
      const msg = await doctorAppointmentsService.saveExamDraft(appointmentId, record);
      setMessage(msg || "Đã lưu nháp phiếu khám");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu nháp");
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete() {
    if (!record) return;
    const followUpErr = validateFollowUpSlot(record);
    if (followUpErr) { setError(followUpErr); setMessage(""); return; }

    // Check for unfinished specialist services
    try {
      const orders = await doctorAppointmentsService.listServiceOrders(appointmentId);
      const unfinished = orders.filter((o) => o.status === "PENDING" || o.status === "IN_PROGRESS");
      if (unfinished.length > 0) {
        setPendingServicesWarning(unfinished.map((o) => o.services?.name ?? `#${o.id}`));
        return;
      }
    } catch {
      // Non-blocking — proceed if the check fails
    }

    await doComplete();
  }

  async function doComplete() {
    if (!record) return;
    try {
      setCompleting(true); setError(""); setMessage("");
      setPendingServicesWarning([]);
      await doctorAppointmentsService.completeExamWithRecord(appointmentId, record);
      onFinish();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể kết thúc khám");
    } finally {
      setCompleting(false);
    }
  }

  async function handleSendUrgentAlert() {
    const content = urgentAlertMessage.trim();
    if (!content) { setError("Vui lòng nhập nội dung thông báo khẩn"); setMessage(""); return; }
    try {
      setUrgentAlertSending(true); setError(""); setMessage("");
      const msg = await doctorAppointmentsService.sendUrgentAlert(appointmentId, content);
      setMessage(msg || "Đã gửi thông báo khẩn đến chủ thú cưng");
      setUrgentAlertOpen(false);
      setUrgentAlertMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi thông báo khẩn");
    } finally {
      setUrgentAlertSending(false);
    }
  }

  if (loading) return <LoadingState text="Đang tải dữ liệu phiếu khám từ hệ thống..." />;
  if (!detail || !record) return <ErrorState message={error || "Không có dữ liệu phiếu khám"} onBack={onBack} />;

  function parseTimeMinutes(t: string | undefined): number | null {
    if (!t || !t.includes(":")) return null;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const scheduledEndMinutes = parseTimeMinutes(detail.appointment.endTime);
  const isOverSchedule = scheduledEndMinutes !== null && scheduledEndMinutes > 0 && nowMinutes > scheduledEndMinutes;
  const isLongExam = elapsedMinutes >= 60;
  const showTimeWarning = isOverSchedule || isLongExam;
  const timeWarningMsg = isOverSchedule
    ? `Đã qua giờ kết thúc lịch hẹn (${detail.appointment.endTime}). Vui lòng hoàn thành ca khám sớm.`
    : `Ca khám đã kéo dài ${elapsedMinutes} phút. Hãy kiểm tra và kết thúc sớm nếu đã hoàn tất.`;

  const today    = getTodayValue();
  const minTime  = record.nextVisitDate === today ? getCurrentTimeValue() : "";
  const timeOpts = FOLLOW_UP_TIME_OPTIONS.filter((t) => !minTime || t > minTime);

  const symptomCount  = record.selectedSymptoms.length;
  const abnormalCount = Object.values(record.systems).filter((s) => s.status === "abnormal").length;

  const TABS: { id: ExamTab; label: string; badge?: number }[] = [
    { id: "symptoms", label: "Triệu chứng",       badge: symptomCount  || undefined },
    { id: "clinical", label: "Khám lâm sàng",     badge: abnormalCount || undefined },
    { id: "orders",   label: "Chỉ định & Tái khám" },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-0">
      <ExamTopBar
        appointment={detail.appointment}
        saving={saving}
        completing={completing}
        error={error}
        message={message}
        elapsedMinutes={elapsedMinutes}
        onBack={onBack}
        onSaveDraft={handleSaveDraft}
        onUrgentAlert={() => setUrgentAlertOpen(true)}
        onComplete={handleComplete}
      />

      {showTimeWarning && (
        <div className={`flex-shrink-0 flex items-center gap-2 px-5 py-2 border-b ${
          isOverSchedule
            ? "bg-red-50 border-red-200 text-red-700"
            : "bg-amber-50 border-amber-200 text-amber-700"
        }`}>
          <Clock size={13} className="flex-shrink-0" />
          <span className="text-[12px] font-semibold">{timeWarningMsg}</span>
        </div>
      )}

      <div className="flex-1 overflow-hidden flex min-h-0">
        {/* ── Left: Patient sidebar ── */}
        <aside className="w-[260px] flex-shrink-0">
          <PetSummaryPanel
            patientCard={detail.patientCard}
            petInfoItems={detail.petInfoItems}
            owner={detail.owner}
            riskAlerts={detail.riskAlerts}
            history={detail.history}
          />
        </aside>

        {/* ── Right: Tabbed content ── */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Tab bar */}
          <div className="flex-shrink-0 flex items-end gap-0 border-b border-border bg-white px-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-4 py-3.5 text-[13px] font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "text-cyan-600"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
                {tab.badge !== undefined && (
                  <span className={`min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 ${
                    activeTab === tab.id
                      ? "bg-cyan-100 text-cyan-700"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {tab.badge}
                  </span>
                )}
                {/* Active underline */}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-cyan-500 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto bg-slate-50">
            {activeTab === "symptoms" && (
              <SymptomForm
                schema={detail.formSchema}
                record={record}
                onChange={setRecord}
              />
            )}

            {activeTab === "clinical" && (
              <ClinicalExamForm
                schema={detail.formSchema}
                record={record}
                onChange={setRecord}
              />
            )}

            {activeTab === "orders" && (
              <div className="p-5 flex flex-col gap-6 max-w-2xl">
                <ServiceOrderPanel appointmentId={appointmentId} />

                <div className="border-t border-border pt-5">
                  <h3 className="text-sm font-bold text-foreground mb-0.5">Lịch tái khám</h3>
                  <p className="text-[12px] text-muted-foreground mb-4">
                    Đặt lịch hẹn tái khám cho bệnh nhân sau khi hoàn tất điều trị.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                        Ngày tái khám dự kiến
                      </label>
                      <input
                        type="date"
                        min={today}
                        value={record.nextVisitDate ?? ""}
                        onChange={(e) => setRecord({ ...record, nextVisitDate: e.target.value || null, nextVisitTime: "" })}
                        className="h-10 px-3 bg-white border border-border rounded-xl text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                        Giờ tái khám dự kiến
                      </label>
                      <select
                        disabled={!record.nextVisitDate || timeOpts.length === 0}
                        value={record.nextVisitTime ?? ""}
                        onChange={(e) => setRecord({ ...record, nextVisitTime: e.target.value })}
                        className="h-10 px-3 bg-white border border-border rounded-xl text-[13px] text-foreground disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
                      >
                        <option value="">Chọn giờ</option>
                        {timeOpts.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Pending services warning modal ── */}
      {pendingServicesWarning.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <Clock size={18} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Còn dịch vụ chuyên sâu chưa hoàn thành</h3>
                <p className="mt-1 text-sm text-slate-500">Các dịch vụ sau chưa có kết quả và sẽ không được tính vào hóa đơn nếu kết thúc ngay:</p>
              </div>
            </div>
            <ul className="mb-5 space-y-1.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
              {pendingServicesWarning.map((name, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  {name}
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingServicesWarning([])}
                className="h-10 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Quay lại tiếp tục khám
              </button>
              <button
                onClick={() => void doComplete()}
                disabled={completing}
                className="h-10 flex-1 rounded-xl bg-amber-500 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {completing ? "Đang kết thúc..." : "Kết thúc dù vậy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Urgent alert modal ── */}
      {urgentAlertOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onClick={() => !urgentAlertSending && setUrgentAlertOpen(false)}
        >
          <div
            className="w-full max-w-[460px] rounded-2xl border border-red-100 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-red-500">Thông báo khẩn</div>
                <h3 className="mt-1 text-lg font-bold text-slate-950">Gửi cảnh báo đến chủ thú cưng</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  Nội dung này sẽ xuất hiện trong chuông thông báo và bật popup khi khách hàng đang truy cập cổng khách hàng.
                </p>
              </div>
              <button
                type="button"
                disabled={urgentAlertSending}
                onClick={() => setUrgentAlertOpen(false)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <label className="mt-5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Nội dung gửi cho chủ thú cưng
            </label>
            <textarea
              value={urgentAlertMessage}
              onChange={(e) => setUrgentAlertMessage(e.target.value)}
              rows={5}
              maxLength={1000}
              disabled={urgentAlertSending}
              placeholder="Ví dụ: Bé có dấu hiệu thở khó và sốt cao trong quá trình khám. Chủ nuôi vui lòng theo dõi sát và liên hệ ngay nếu tình trạng nặng hơn."
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/10 disabled:opacity-60"
            />
            <div className="mt-2 text-right text-[11px] font-semibold text-slate-400">
              {urgentAlertMessage.length}/1000
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                disabled={urgentAlertSending}
                onClick={() => setUrgentAlertOpen(false)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={urgentAlertSending || !urgentAlertMessage.trim()}
                onClick={() => void handleSendUrgentAlert()}
                className="h-10 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {urgentAlertSending ? "Đang gửi..." : "Gửi thông báo khẩn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
