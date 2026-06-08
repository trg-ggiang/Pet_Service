import { useState } from "react";
import { Pill, Plus, Trash2, ChevronDown, ChevronUp, Save } from "lucide-react";
import type { PrescriptionEntry } from "../../services/doctorAppointments";

interface PrescriptionFormProps {
  prescriptions: PrescriptionEntry[];
  onChange: (prescriptions: PrescriptionEntry[]) => void;
}

const ROUTE_OPTIONS = [
  { value: "Uống", label: "Uống" },
  { value: "Tiêm bắp", label: "Tiêm bắp" },
  { value: "Tiêm tĩnh mạch", label: "Tiêm tĩnh mạch" },
  { value: "Tiêm dưới da", label: "Tiêm dưới da" },
  { value: "Nhỏ mắt", label: "Nhỏ mắt" },
  { value: "Nhỏ mũi", label: "Nhỏ mũi" },
  { value: "Bôi ngoài da", label: "Bôi ngoài da" },
  { value: "Đặt hậu môn", label: "Đặt hậu môn" },
  { value: "Ngậm", label: "Ngậm" },
];

const FREQUENCY_OPTIONS = [
  { value: "1 lần/ngày", label: "1 lần/ngày" },
  { value: "2 lần/ngày", label: "2 lần/ngày" },
  { value: "3 lần/ngày", label: "3 lần/ngày" },
  { value: "4 lần/ngày", label: "4 lần/ngày" },
  { value: "Mỗi 6 giờ", label: "Mỗi 6 giờ" },
  { value: "Mỗi 8 giờ", label: "Mỗi 8 giờ" },
  { value: "Mỗi 12 giờ", label: "Mỗi 12 giờ" },
  { value: "Khi cần", label: "Khi cần" },
];

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function createEmptyPrescription(): PrescriptionEntry {
  return {
    id: generateId(),
    medicineName: "",
    dosage: "",
    frequency: "2 lần/ngày",
    route: "Uống",
    durationDays: null,
    instructions: "",
  };
}

function PrescriptionRow({
  prescription,
  index,
  onChange,
  onRemove,
  isExpanded,
  onToggle,
}: {
  prescription: PrescriptionEntry;
  index: number;
  onChange: (updated: PrescriptionEntry) => void;
  onRemove: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  function update(field: keyof PrescriptionEntry, value: string | number | null) {
    onChange({ ...prescription, [field]: value });
  }

  const isValid = prescription.medicineName.trim() !== "";

  return (
    <div className={`rounded-xl border transition-all ${isValid ? "border-cyan-200 bg-white" : "border-amber-200 bg-amber-50/30"}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-bold ${isValid ? "bg-cyan-100 text-cyan-700" : "bg-amber-100 text-amber-700"}`}>
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          {isExpanded ? (
            <input
              type="text"
              value={prescription.medicineName}
              onChange={(e) => update("medicineName", e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Tên thuốc (bắt buộc)"
              className="w-full px-2 py-1 text-[13px] font-semibold border-b border-cyan-300 bg-transparent focus:outline-none focus:border-cyan-500"
            />
          ) : (
            <p className={`text-[13px] font-semibold truncate ${isValid ? "text-foreground" : "text-amber-600"}`}>
              {prescription.medicineName || "Chưa nhập tên thuốc"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!isExpanded && isValid && (
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              {prescription.dosage} · {prescription.route}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp size={14} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Liều dùng <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                value={prescription.dosage}
                onChange={(e) => update("dosage", e.target.value)}
                placeholder="VD: 1 viên, 5ml, 2g..."
                className="h-9 px-3 bg-white border border-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Đường dùng
              </label>
              <select
                value={prescription.route}
                onChange={(e) => update("route", e.target.value)}
                className="h-9 px-3 bg-white border border-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
              >
                {ROUTE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Tần suất
              </label>
              <select
                value={prescription.frequency}
                onChange={(e) => update("frequency", e.target.value)}
                className="h-9 px-3 bg-white border border-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
              >
                {FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Số ngày
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={prescription.durationDays ?? ""}
                  onChange={(e) => update("durationDays", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="VD: 7"
                  className="flex-1 h-9 px-3 bg-white border border-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
                />
                <span className="text-[11px] text-muted-foreground">ngày</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Hướng dẫn sử dụng
            </label>
            <textarea
              rows={2}
              value={prescription.instructions}
              onChange={(e) => update("instructions", e.target.value)}
              placeholder="VD: Uống sau ăn, tránh nắng, theo dõi phản ứng..."
              className="px-3 py-2 bg-white border border-border rounded-lg text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={12} />
              Xóa thuốc
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PrescriptionForm({ prescriptions, onChange }: PrescriptionFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  function addPrescription() {
    const newRx = createEmptyPrescription();
    const updated = [...prescriptions, newRx];
    onChange(updated);
    setExpandedRows((prev) => new Set([...prev, newRx.id]));
    setIsExpanded(true);
  }

  function updatePrescription(updated: PrescriptionEntry) {
    onChange(prescriptions.map((p) => (p.id === updated.id ? updated : p)));
  }

  function removePrescription(id: string) {
    onChange(prescriptions.filter((p) => p.id !== id));
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const validCount = prescriptions.filter((p) => p.medicineName.trim() !== "").length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill size={14} className="text-cyan-500" />
          <h3 className="text-sm font-bold text-foreground">Đơn thuốc</h3>
          {validCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-[11px] font-bold">
              {validCount} thuốc
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={addPrescription}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-cyan-600 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors"
        >
          <Plus size={13} />
          Thêm thuốc
        </button>
      </div>

      {prescriptions.length === 0 ? (
        <div className="py-6 flex flex-col items-center gap-2 text-center border border-dashed border-cyan-200 rounded-xl bg-cyan-50/20">
          <Pill size={20} className="text-cyan-300" />
          <p className="text-[12px] text-muted-foreground">Chưa có thuốc nào trong đơn</p>
          <button
            type="button"
            onClick={addPrescription}
            className="text-[12px] font-semibold text-cyan-600 hover:text-cyan-700"
          >
            + Thêm thuốc đầu tiên
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {prescriptions.map((rx, index) => (
            <PrescriptionRow
              key={rx.id}
              prescription={rx}
              index={index}
              onChange={updatePrescription}
              onRemove={() => removePrescription(rx.id)}
              isExpanded={expandedRows.has(rx.id)}
              onToggle={() => toggleRow(rx.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
