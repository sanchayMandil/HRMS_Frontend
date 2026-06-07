import { useState } from "react";
import { useSelector } from "react-redux";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  CheckCircle, Clock, XCircle, AlertTriangle,
  Users, CalendarDays, TrendingUp, Loader2, MapPin, Download
} from "lucide-react";
import { useGetReportsQuery, useGetAllAttendanceQuery } from "../app/api/baseApi";
import { fmtTime, fmtHours, avatarColor, getInitials, statusOf, SelfieModal } from "../components/AttendanceRecordDrawer";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Palette ──────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  completed:  "#4f46e5",
  ongoing:    "#10b981",
  incomplete: "#f59e0b",
  half_day:   "#8b5cf6",
  absent:     "#ef4444"
};

const STATUS_LABELS = {
  completed:  "Completed",
  ongoing:    "Checked In",
  incomplete: "Incomplete",
  half_day:   "Half Day",
  absent:     "Absent"
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-[#0f172a]">{payload[0].name}</p>
      <p style={{ color: payload[0].payload.fill ?? payload[0].color }}>
        {payload[0].value} employee{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, iconBg, valueColor }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 flex flex-col gap-4">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className={`text-3xl font-bold leading-none ${valueColor}`}>{value ?? 0}</p>
        <p className="text-sm text-[#64748b] mt-1.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Records table ────────────────────────────────────────────────────────────

function RecordsTable({ records }) {
  const [selfieModal, setSelfieModal] = useState(null);

  if (!records?.length) return (
    <div className="text-center py-10">
      <CalendarDays size={28} className="text-[#cbd5e1] mx-auto mb-2" />
      <p className="text-sm text-[#94a3b8]">No records for this date.</p>
    </div>
  );

  return (
    <>
      {selfieModal && (
        <SelfieModal url={selfieModal.url} label={selfieModal.label} onClose={() => setSelfieModal(null)} />
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
              {["Employee", "Selfie", "Punch In", "Punch Out", "Location", "Hours", "Status"].map(h => (
                <th key={h} className="text-xs font-semibold text-[#64748b] uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((rec, idx) => {
              const name      = rec.employee?.name ?? rec.userId?.name ?? "Unknown";
              const dept      = rec.employee?.department ?? rec.userId?.department ?? "";
              const pIn       = rec.punchIn?.time  ?? rec.punchInTime;
              const pOut      = rec.punchOut?.time ?? rec.punchOutTime;
              const hours     = rec.workingHours;
              const selfieUrl = rec.punchIn?.selfie;
              const lat       = rec.punchIn?.location?.latitude;
              const lng       = rec.punchIn?.location?.longitude;
              const { label, cls } = statusOf({
                ...rec,
                punchIn:  rec.punchIn  ?? (pIn  ? { time: pIn  } : null),
                punchOut: rec.punchOut ?? (pOut ? { time: pOut } : null)
              });

              return (
                <tr key={rec._id ?? idx} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#fafafa] transition-colors">
                  {/* Employee */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full ${avatarColor(name)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                        {getInitials(name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0f172a] truncate">{name}</p>
                        {dept && <p className="text-xs text-[#94a3b8]">{dept}</p>}
                      </div>
                    </div>
                  </td>

                  {/* Selfie */}
                  <td className="px-4 py-3.5">
                    {selfieUrl ? (
                      <button
                        type="button"
                        onClick={() => setSelfieModal({ url: selfieUrl, label: `${name} — Punch-In Selfie` })}
                        className="cursor-pointer border-0 bg-transparent p-0"
                        title="View selfie"
                      >
                        <img
                          src={selfieUrl}
                          alt="selfie"
                          className="w-9 h-9 rounded-full object-cover border-2 border-white shadow ring-1 ring-[#e2e8f0] hover:ring-[#4f46e5] transition-all"
                        />
                      </button>
                    ) : (
                      <span className="text-xs text-[#94a3b8]">—</span>
                    )}
                  </td>

                  {/* Punch In */}
                  <td className="px-4 py-3.5 text-sm font-mono text-[#0f172a] whitespace-nowrap">{fmtTime(pIn)}</td>

                  {/* Punch Out */}
                  <td className="px-4 py-3.5 text-sm font-mono text-[#64748b] whitespace-nowrap">{fmtTime(pOut)}</td>

                  {/* Location */}
                  <td className="px-4 py-3.5">
                    {lat != null ? (
                      <div className="flex items-center gap-1">
                        <MapPin size={11} className="text-[#94a3b8] shrink-0" />
                        <span className="text-xs font-mono text-[#64748b]">
                          {lat.toFixed(4)}, {lng?.toFixed(4)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#94a3b8]">—</span>
                    )}
                  </td>

                  {/* Hours */}
                  <td className="px-4 py-3.5 text-sm font-mono text-[#64748b] whitespace-nowrap">{fmtHours(hours)}</td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${cls}`}>{label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const role  = useSelector(state => state.auth.user?.role || "employee");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: report, isLoading } = useGetReportsQuery(date ? `date=${date}` : "");
  const { data: teamData } = useGetAllAttendanceQuery({ date }, { skip: role === "employee" });

  const handleExport = (format) => {
    window.location.href = `${API_URL}/reports/export?date=${date}&format=${format}`;
  };

  const summary  = report?.summary ?? {};
  const allRecords = report?.records ?? teamData?.records ?? [];
  const records  = allRecords.filter(r => {
    const role = r.userId?.role ?? r.employee?.role;
    return !role || role === "employee" || role === "manager";
  });
  const total    = report?.total   ?? records.length;

  // Pie chart data
  const pieData = Object.entries(summary)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name:  STATUS_LABELS[key] ?? key,
      value,
      fill:  STATUS_COLORS[key] ?? "#94a3b8"
    }));

  // Dept bar chart
  const deptMap = {};
  records.forEach(rec => {
    const dept = rec.employee?.department ?? rec.userId?.department ?? "Unknown";
    if (!deptMap[dept]) deptMap[dept] = { dept, present: 0, absent: 0 };
    const isPresent = !!(rec.punchIn?.time ?? rec.punchInTime);
    if (isPresent) deptMap[dept].present++;
    else           deptMap[dept].absent++;
  });
  const barData = Object.values(deptMap);

  return (
    <div className="space-y-6">

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] px-5 py-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#f1f5f9] flex items-center justify-center shrink-0">
            <CalendarDays size={15} className="text-[#64748b]" />
          </div>
          <div>
            <p className="text-[11px] text-[#94a3b8] font-medium uppercase tracking-wide">Report for</p>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="text-sm font-semibold text-[#0f172a] bg-transparent border-0 outline-none cursor-pointer p-0 mt-0.5"
            />
          </div>
          {isLoading && <Loader2 size={15} className="animate-spin text-[#4f46e5] ml-1" />}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleExport("csv")}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold border border-[#e2e8f0] bg-[#f8fafc] text-[#374151] rounded-xl px-3 py-2 cursor-pointer hover:bg-[#f1f5f9] disabled:opacity-40 transition-colors"
          >
            <Download size={13} />
            CSV
          </button>
          <button
            type="button"
            onClick={() => handleExport("excel")}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold bg-[#4f46e5] text-white rounded-xl px-3 py-2 border-0 cursor-pointer hover:bg-[#4338ca] disabled:opacity-40 transition-colors"
          >
            <Download size={13} />
            Excel
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total"      value={total}              icon={Users}         iconBg="bg-indigo-500"  valueColor="text-indigo-700" />
        <StatCard label="Completed"  value={summary.completed}  icon={CheckCircle}   iconBg="bg-blue-500"    valueColor="text-blue-700" />
        <StatCard label="Checked In" value={summary.ongoing}    icon={Clock}         iconBg="bg-emerald-500" valueColor="text-emerald-700" />
        <StatCard label="Incomplete" value={summary.incomplete} icon={AlertTriangle} iconBg="bg-amber-500"   valueColor="text-amber-600" />
        <StatCard label="Absent"     value={summary.absent}     icon={XCircle}       iconBg="bg-red-500"     valueColor="text-red-600" />
      </div>

      {/* Charts row */}
      {pieData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Donut — status breakdown */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={16} className="text-[#4f46e5]" />
              <h3 className="text-base font-bold text-[#0f172a]">Attendance Breakdown</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={9}
                  formatter={v => <span className="text-xs text-[#475569]">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar — department breakdown */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Users size={16} className="text-[#4f46e5]" />
              <h3 className="text-base font-bold text-[#0f172a]">Department Overview</h3>
            </div>
            {barData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-sm text-[#94a3b8]">
                No department data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} barSize={20} barGap={4}>
                  <XAxis
                    dataKey="dept"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#f1f5f9" }}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={9}
                    formatter={v => <span className="text-xs text-[#475569]">{v}</span>}
                  />
                  <Bar dataKey="present" name="Present" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent"  name="Absent"  fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Records table */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
        <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">Employee Records</h3>
            <p className="text-xs text-[#64748b] mt-0.5">{total} record{total !== 1 ? "s" : ""} · {date}</p>
          </div>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[#4f46e5]" />
          </div>
        ) : (
          <RecordsTable records={records} />
        )}
      </div>
    </div>
  );
}
