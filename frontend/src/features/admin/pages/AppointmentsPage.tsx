import { AdminAppointmentsView } from "../../../components/admin/AdminAppointmentsView";

export function AppointmentsPage({
  onNewAppt,
  onOpenExam,
}: {
  onNewAppt: () => void;
  onOpenExam?: () => void;
}) {
  return <AdminAppointmentsView onNewAppt={onNewAppt} onOpenExam={onOpenExam} />;
}
