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
    </div>
  );
}
