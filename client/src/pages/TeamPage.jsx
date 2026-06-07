import { useState } from "react";
import { Users, Clock, CheckCircle, XCircle, Search, RefreshCw, MessageSquare, Eye, Loader2, AlertCircle } from "lucide-react";
import { useGetAllAttendanceQuery } from "../app/api/baseApi";
import {
  AttendanceRecordDrawer,
  ValidationIcon,
  statusOf,
  avatarColor,
  getInitials,
  fmtTime,
  fmtHours
} from "../components/AttendanceRecordDrawer";

// ─── Main component ───────────────────────────────────────────────────────────

export default function TeamPage() {
  const today = new Date().toISOString().split("T")[0];
  const { data, isLoading, error, refetch, isFetching } = useGetAllAttendanceQuery({ date: today, limit: 200 });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null); // record shown in drawer

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  const records = data?.records ?? [];

  const enriched = records.map(r => ({
    ...r,
    name: r.userId?.name ?? r.userName ?? "Unknown",
    department: r.userId?.department ?? r.department ?? ""
  }));

  const total     = enriched.length;
  const present   = enriched.filter(r => r.punchIn && !r.punchOut).length;
  const completed = enriched.filter(r => r.punchIn && r.punchOut).length;
  const absent    = enriched.filter(r => !r.punchIn).length;
  const pending   = enriched.filter(r => r.validationStatus === "pending").length;

  const filtered = enriched.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === "present")   return r.punchIn && !r.punchOut;
    if (filter === "completed") return r.punchIn && r.punchOut;
    if (filter === "absent")    return !r.punchIn;
    if (filter === "pending")   return r.validationStatus === "pending";
    return true;
  });

  const statusOf = (r) => {
    if (!r.punchIn) return { label: "Absent", cls: "bg-red-100 text-red-600" };
    if (!r.punchOut) return { label: "Checked In", cls: "bg-emerald-100 text-emerald-700" };
    if (r.status === "incomplete" && r.validationStatus === "valid")
      return { label: "Half Day", cls: "bg-purple-100 text-purple-700" };
    if (r.status === "incomplete")
      return { label: "Incomplete", cls: "bg-amber-100 text-amber-700" };
    return { label: "Completed", cls: "bg-slate-100 text-slate-600" };
  };

  const ValidationIcon = ({ vs }) => {
    if (vs === "valid")   return <CheckCircle size={14} className="text-emerald-500 shrink-0" />;
    if (vs === "invalid") return <XCircle     size={14} className="text-red-500 shrink-0" />;
    return null; // pending — no icon, just show nothing
  };

  return (
    <div className="space-y-6">
      {selected && <AttendanceRecordDrawer rec={selected} onClose={() => setSelected(null)} />}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total",     value: total,     icon: Users,        bg: "bg-indigo-50",  ic: "text-indigo-600",  vc: "text-indigo-700" },
          { label: "Checked In",value: present,   icon: Clock,        bg: "bg-emerald-50", ic: "text-emerald-600", vc: "text-emerald-700" },
          { label: "Completed", value: completed, icon: CheckCircle,  bg: "bg-blue-50",    ic: "text-blue-600",    vc: "text-blue-700" },
          { label: "Absent",    value: absent,    icon: XCircle,      bg: "bg-red-50",     ic: "text-red-500",     vc: "text-red-600" },
          { label: "Pending",   value: pending,   icon: AlertCircle,  bg: "bg-amber-50",   ic: "text-amber-500",   vc: "text-amber-600" }
        ].map(({ label, value, icon: Icon, bg, ic, vc }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={18} className={ic} />
            </div>
            <div>
              <p className={`text-xl font-bold ${vc}`}>{value}</p>
              <p className="text-xs text-[#64748b]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-[#f1f5f9]">
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">Team Attendance</h3>
            <p className="text-xs text-[#64748b] mt-0.5">{todayLabel}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-[#f1f5f9] rounded-xl p-1 gap-0.5">
              {[
                { key: "all",       label: "All" },
                { key: "present",   label: "In" },
                { key: "completed", label: "Done" },
                { key: "absent",    label: "Absent" },
                { key: "pending",   label: "Pending" }
              ].map(({ key, label }) => (
                <button key={key} type="button" onClick={() => setFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer transition-all ${
                    filter === key ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b] bg-transparent hover:text-[#0f172a]"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text" placeholder="Search…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-[#e2e8f0] rounded-xl bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] w-36"
              />
            </div>
            <button type="button" onClick={refetch}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748b] border border-[#e2e8f0] rounded-xl bg-white cursor-pointer hover:bg-[#f8fafc] transition-colors">
              <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[#4f46e5]" />
          </div>
        )}
        {error && (
          <div className="m-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error?.data?.message || "Failed to load team attendance."}
          </div>
        )}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <Users size={32} className="text-[#cbd5e1] mx-auto mb-3" />
            <p className="text-sm text-[#64748b]">
              {search || filter !== "all" ? "No members match your filter." : "No attendance records yet today."}
            </p>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3 bg-[#f8fafc] border-b border-[#e2e8f0]">
              {["Employee", "Punch In", "Punch Out", "Hours", "Status", ""].map(h => (
                <p key={h} className="text-xs font-semibold text-[#64748b] uppercase tracking-wider whitespace-nowrap">{h}</p>
              ))}
            </div>

            {filtered.map((rec, idx) => {
              const { label, cls } = statusOf(rec);
              return (
                <div
                  key={rec._id ?? idx}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-6 py-4 border-b border-[#f1f5f9] last:border-0 hover:bg-[#fafafa] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full ${avatarColor(rec.name)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                      {getInitials(rec.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-[#0f172a] truncate">{rec.name}</p>
                        <ValidationIcon vs={rec.validationStatus} adminLocked={rec.adminLocked} />
                      </div>
                      {rec.department && <p className="text-xs text-[#94a3b8] truncate">{rec.department}</p>}
                      {rec.earlyExitReason && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium mt-0.5">
                          <MessageSquare size={10} /> Has reason
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-mono text-[#0f172a] whitespace-nowrap">{fmtTime(rec.punchIn?.time)}</p>
                  <p className="text-sm font-mono text-[#64748b] whitespace-nowrap">{fmtTime(rec.punchOut?.time)}</p>
                  <p className="text-sm text-[#64748b] whitespace-nowrap font-mono">
                    {fmtHours(rec.workingHours)}
                  </p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${cls}`}>{label}</span>
                  <button
                    type="button"
                    onClick={() => setSelected(rec)}
                    className="flex items-center gap-1 text-xs text-[#4f46e5] font-medium cursor-pointer border-0 bg-transparent hover:underline whitespace-nowrap"
                  >
                    <Eye size={13} /> Review
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
