import { APPOINTMENT_STATUS_CFG } from "../../constants/appointments.constants";
import { Status } from "../../types/appointments.types";

export function StatusBadge({ status }: { status: Status }) {
  const { label, cls, dot } = APPOINTMENT_STATUS_CFG[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {label}
    </span>
  );
}
