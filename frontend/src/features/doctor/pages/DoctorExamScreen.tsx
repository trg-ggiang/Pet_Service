import { useEffect, useState } from "react";
import {
  doctorAppointmentsService,
  type DoctorExamDetail,
  type DoctorExamRecord,
} from "../services/doctorAppointments";
import { ExamTopBar } from "../../../components/doctor/ExamTopBar";
import { PetSummaryPanel } from "../../../components/doctor/PetSummaryPanel";
import { SymptomForm } from "../../../components/doctor/SymptomForm";
import { ClinicalExamForm } from "../../../components/doctor/ClinicalExamForm";
import { LoadingState, ErrorState } from "../../../components/doctor/ExamState";

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
  const [detail, setDetail] = useState<DoctorExamDetail | null>(null);
  const [record, setRecord] = useState<DoctorExamRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [urgentAlertOpen, setUrgentAlertOpen] = useState(false);
  const [urgentAlertMessage, setUrgentAlertMessage] = useState("");
  const [urgentAlertSending, setUrgentAlertSending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadExamDetail() {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const nextDetail = await doctorAppointmentsService.fetchExamDetail(appointmentId);

        if (ignore) return;

        setDetail(nextDetail);
        setRecord(nextDetail.record);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Không thể tải phiếu khám");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadExamDetail();

    return () => {
      ignore = true;
    };
  }, [appointmentId]);

  async function handleSaveDraft() {
    if (!record) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");
      const resultMessage = await doctorAppointmentsService.saveExamDraft(appointmentId, record);
      setMessage(resultMessage || "Đã lưu nháp phiếu khám");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu nháp");
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete() {
    if (!record) return;

    const followUpError = validateFollowUpSlot(record);
    if (followUpError) {
      setError(followUpError);
      setMessage("");
      return;
    }

    try {
      setCompleting(true);
      setError("");
      setMessage("");
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
    if (!content) {
      setError("Vui lòng nhập nội dung thông báo khẩn");
      setMessage("");
      return;
    }

    try {
      setUrgentAlertSending(true);
      setError("");
      setMessage("");
      const resultMessage = await doctorAppointmentsService.sendUrgentAlert(appointmentId, content);
      setMessage(resultMessage || "Đã gửi thông báo khẩn đến chủ thú cưng");
      setUrgentAlertOpen(false);
      setUrgentAlertMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi thông báo khẩn");
    } finally {
      setUrgentAlertSending(false);
    }
  }

  if (loading) {
    return <LoadingState text="Đang tải dữ liệu phiếu khám từ hệ thống..." />;
  }

  if (!detail || !record) {
    return <ErrorState message={error || "Không có dữ liệu phiếu khám"} onBack={onBack} />;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-0">
      <ExamTopBar
        appointment={detail.appointment}
        saving={saving}
        completing={completing}
        error={error}
        message={message}
        onBack={onBack}
        onSaveDraft={handleSaveDraft}
        onUrgentAlert={() => setUrgentAlertOpen(true)}
        onComplete={handleComplete}
      />

      <div className="flex-1 overflow-hidden grid grid-cols-[300px_1fr_1fr] gap-0 min-h-0">
        <PetSummaryPanel
          patientCard={detail.patientCard}
          petInfoItems={detail.petInfoItems}
          owner={detail.owner}
          riskAlerts={detail.riskAlerts}
          vaccinations={detail.vaccinations}
          history={detail.history}
        />

        <SymptomForm
          schema={detail.formSchema}
          record={record}
          onChange={setRecord}
        />

        <ClinicalExamForm
          schema={detail.formSchema}
          record={record}
          onChange={setRecord}
        />
      </div>

      {urgentAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onClick={() => !urgentAlertSending && setUrgentAlertOpen(false)}>
          <div className="w-full max-w-[460px] rounded-2xl border border-red-100 bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
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
              onChange={(event) => setUrgentAlertMessage(event.target.value)}
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
