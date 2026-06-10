import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Scissors, Search } from "lucide-react";
import type { GroomingTask } from "../../features/staff/services/staffAppointments";
import { EmptyState, LoadingState, Pagination } from "./StaffCommon";

const PAGE_SIZE = 8;

export function GroomingTab({
  tasks,
  loading,
  error,
  onUpdateStatus,
}: {
  tasks: GroomingTask[];
  loading: boolean;
  error: string | null;
  onUpdateStatus: (task: GroomingTask) => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (t) =>
        t.petName.toLowerCase().includes(q) ||
        t.owner.toLowerCase().includes(q) ||
        t.service.toLowerCase().includes(q),
    );
  }, [tasks, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageData = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const done = filtered.filter((t) => t.status === "completed").length;
  const total = filtered.length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Tổng ca", value: total, icon: Scissors, color: "#7C3AED", bg: "#F5F3FF" },
          { label: "Hoàn thành", value: done, icon: CheckCircle2, color: "#059669", bg: "#ECFDF5" },
          { label: "Còn lại", value: total - done, icon: Clock, color: "#D97706", bg: "#FFFBEB" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <Icon size={20} style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500 font-medium">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">Danh sách ca Grooming</h3>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm thú cưng, chủ nhân..."
              className="h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all w-52"
            />
          </div>
        </div>

        {loading ? (
          <LoadingState label="Đang tải danh sách grooming..." />
        ) : error ? (
          <EmptyState icon={Scissors} label={error} />
        ) : pageData.length === 0 ? (
          <EmptyState icon={Scissors} label={filtered.length === 0 ? "Không có ca grooming nào" : "Không tìm thấy kết quả"} />
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {pageData.map((task) => {
                const isDone = task.status === "completed";
                const isActive = task.status === "in_progress";
                return (
                  <div key={task.id} className={`flex items-center gap-4 px-6 py-4 transition-colors ${isActive ? "bg-amber-50/40" : isDone ? "bg-slate-50/40" : "hover:bg-slate-50"}`}>
                    <div className="w-16 text-center flex-shrink-0">
                      <div className={`text-sm font-bold font-mono ${isDone ? "text-slate-400 line-through" : "text-slate-900"}`}>{task.time || "--:--"}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDone ? "bg-slate-100" : "bg-violet-50"}`}>
                        <Scissors size={16} className={isDone ? "text-slate-400" : "text-violet-600"} />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-sm font-bold ${isDone ? "text-slate-500" : "text-slate-900"}`}>
                          {task.petName}
                          <span className="ml-2 text-xs font-normal text-slate-500">{task.breed}</span>
                        </div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">{task.owner} · {task.service}</div>
                        {task.notes && <div className="text-xs text-slate-400 italic truncate mt-1">{task.notes}</div>}
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-lg flex-shrink-0 ${
                      isDone ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      isActive ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}>
                      {isDone ? "Hoàn thành" : isActive ? "Đang làm" : "Chờ"}
                    </span>
                    {!isDone && (
                      <button
                        onClick={() => onUpdateStatus(task)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-sm font-bold text-white transition-colors flex-shrink-0 hover:bg-emerald-600"
                      >
                        <><CheckCircle2 size={14} /> Ho�n th�nh</>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <Pagination page={safePage} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
