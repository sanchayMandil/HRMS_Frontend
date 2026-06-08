import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Users, Clock, Timer, FileBarChart, CheckSquare, ArrowRight,
  CheckCircle, XCircle, AlertCircle, Loader2, ChevronRight,
  CalendarCheck, CalendarX, UserCheck, UserX, TrendingUp, AlertTriangle,
  Sparkles
} from "lucide-react";
import {
  useGetDashboardQuery,
  useGetAllOvertimeQuery,
  useReviewOvertimeMutation,
  useGetMissedPunchQuery
} from "../app/api/baseApi";
import { avatarColor, getInitials, fmtTime, statusOf } from "../components/AttendanceRecordDrawer";
import { toast } from "../components/Toast";

// ─── Quick actions config ─────────────────────────────────────────────────────

const actionsByRole = {
  employee: [
    { title: "Punch In / Out",    desc: "Record attendance with selfie + GPS",       to: "/attendance", icon: Clock,        iconBg: "bg-blue-500" },
    { title: "Request Overtime",  desc: "Submit an overtime request for approval",   to: "/overtime",   icon: Timer,        iconBg: "bg-amber-500" },
    { title: "View Reports",      desc: "Check your personal attendance history",    to: "/reports",    icon: FileBarChart, iconBg: "bg-violet-500" }
  ],
  manager: [
    { title: "Team Attendance",    desc: "Monitor your team's punch-in/out status", to: "/team",       icon: Clock,        iconBg: "bg-blue-500" },
    { title: "Overtime Approvals", desc: "Review and approve pending OT requests",  to: "/approvals",  icon: CheckSquare,  iconBg: "bg-emerald-500" },
    { title: "Reports",            desc: "View team-wide attendance reports",        to: "/reports",    icon: FileBarChart, iconBg: "bg-violet-500" }
  ],
  admin: [
    { title: "User Management",   desc: "Create, update, and manage accounts",      to: "/users",      icon: Users,        iconBg: "bg-blue-500" },
    { title: "All Attendance",    desc: "View and validate system-wide records",    to: "/attendance", icon: Clock,        iconBg: "bg-emerald-500" },
    { title: "OT Approvals",      desc: "Manage overtime across departments",       to: "/approvals",  icon: CheckSquare,  iconBg: "bg-amber-500" },
    { title: "Daily Reports",     desc: "Generate and export reports",              to: "/reports",    icon: FileBarChart, iconBg: "bg-violet-500" }
  ]
};

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, iconBg, valueColor = "text-[#0f172a]", trend }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon size={18} className="text-white" />
        </div>
        {trend != null && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <div>
        <p className={`text-3xl font-bold leading-none ${valueColor}`}>{value ?? "—"}</p>
        <p className="text-sm text-[#64748b] mt-1.5 leading-snug">{label}</p>
      </div>
    </div>
  );
}

// ─── Employee dashboard stats ─────────────────────────────────────────────────

function EmployeeStats({ data }) {
  const today   = data?.today      ?? null;
  const monthly = data?.monthStats ?? {};
  const ot      = data?.overtime   ?? {};

  const todayStatus = (() => {
    if (!today || !today.punchIn) return { label: "Not punched in yet", cls: "text-[#94a3b8]", dot: "bg-slate-300" };
    if (!today.punchOut) return { label: `Checked in at ${fmtTime(today.punchIn?.time)}`, cls: "text-emerald-600", dot: "bg-emerald-400" };
    return { label: `Completed · ${today.workingHours?.toFixed(1) ?? "?"}h worked`, cls: "text-[#4f46e5]", dot: "bg-indigo-400" };
  })();

  return (
    <div className="space-y-5">
      {/* Today status pill */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${todayStatus.dot}`} />
          <div>
            <p className="text-[11px] text-[#94a3b8] font-medium uppercase tracking-wide">Today</p>
            <p className={`text-sm font-semibold mt-0.5 ${todayStatus.cls}`}>{todayStatus.label}</p>
          </div>
        </div>
        {monthly.averageHours > 0 && (
          <div className="text-right shrink-0">
            <p className="text-xs text-[#94a3b8]">Avg / day</p>
            <p className="text-sm font-bold text-[#4f46e5]">{monthly.averageHours?.toFixed(1)}h</p>
          </div>
        )}
      </div>

      {/* Monthly breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Completed"  value={monthly.completedDays}  icon={CalendarCheck} iconBg="bg-blue-500"   valueColor="text-blue-700" />
        <StatCard label="Incomplete" value={monthly.incompleteDays} icon={Clock}         iconBg="bg-amber-500"  valueColor="text-amber-600" />
        <StatCard label="Half Days"  value={monthly.halfDays}       icon={CalendarX}     iconBg="bg-violet-500" valueColor="text-violet-700" />
        <StatCard label="Absent"     value={monthly.absentDays}     icon={XCircle}       iconBg="bg-red-500"    valueColor="text-red-600" />
      </div>

      {/* Overtime bar */}
      {(ot.pending > 0 || ot.approved > 0 || ot.rejected > 0) && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Timer size={15} className="text-amber-600" />
            </div>
            <p className="text-sm font-semibold text-[#0f172a]">Overtime</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {ot.pending  > 0 && <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">{ot.pending} pending</span>}
            {ot.approved > 0 && <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">{ot.approved} approved</span>}
            {ot.rejected > 0 && <span className="bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full">{ot.rejected} rejected</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Manager dashboard stats ──────────────────────────────────────────────────

function ManagerStats({ data }) {
  const team      = data?.team ?? {};
  const pendingOT = data?.pendingOvertime?.count ?? 0;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatCard label="Present Today"    value={team.present}     icon={UserCheck}  iconBg="bg-emerald-500" valueColor="text-emerald-700" />
      <StatCard label="Absent Today"     value={team.absent}      icon={UserX}      iconBg="bg-red-500"     valueColor="text-red-600" />
      <StatCard label="Not In Yet"       value={team.notPunched}  icon={Clock}      iconBg="bg-slate-400"   valueColor="text-slate-600" />
      <StatCard label="Pending Overtime" value={pendingOT}        icon={Timer}      iconBg="bg-amber-500"   valueColor="text-amber-600" />
    </div>
  );
}

// ─── Admin dashboard stats ────────────────────────────────────────────────────

function AdminStats({ data }) {
  const users   = data?.users ?? {};
  const today   = data?.today ?? {};
  const monthly = data?.month ?? {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard label="Total Users"   value={users.nonAdmin}          icon={Users}     iconBg="bg-indigo-500"  valueColor="text-indigo-700" />
        <StatCard label="Present Today" value={today.present ?? 0}      icon={UserCheck} iconBg="bg-emerald-500" valueColor="text-emerald-700" />
        <StatCard label="Absent Today"  value={today.absent  ?? 0}      icon={UserX}     iconBg="bg-red-500"     valueColor="text-red-600" />
        <StatCard label="Not In Yet"    value={today.notPunched ?? 0}   icon={Clock}     iconBg="bg-slate-400"   valueColor="text-slate-600" />
        <StatCard label="Pending OT"    value={data?.pendingOvertime}   icon={Timer}     iconBg="bg-amber-500"   valueColor="text-amber-600" />
      </div>
      {monthly.completed != null && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Completed this month"   value={monthly.completed}         icon={CalendarCheck} iconBg="bg-blue-500"   valueColor="text-blue-700" />
          <StatCard label="Incomplete this month"  value={monthly.incomplete}        icon={Clock}         iconBg="bg-amber-500"  valueColor="text-amber-600" />
          <StatCard label="Half Days this month"   value={monthly.halfDay}           icon={TrendingUp}    iconBg="bg-violet-500" valueColor="text-violet-700" />
          <StatCard label="Pending Validation"     value={monthly.pendingValidation} icon={AlertTriangle} iconBg="bg-orange-500" valueColor="text-orange-600" />
        </div>
      )}
    </div>
  );
}

// ─── Pending approvals widget ─────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function ApprovalRow({ rec }) {
  const [action, setAction]   = useState(null);
  const [remarks, setRemarks] = useState("");
  const [localToast, setLocalToast] = useState(null);
  const [reviewOvertime, { isLoading }] = useReviewOvertimeMutation();

  const name = rec.userId?.name ?? rec.userName ?? "Unknown";
  const dept = rec.userId?.department ?? "";

  const confirm = async () => {
    try {
      await reviewOvertime({ id: rec._id, status: action, reviewNote: remarks.trim() || undefined }).unwrap();
      setLocalToast({ type: "success", text: action === "approved" ? "Approved!" : "Rejected." });
      setAction(null);
      setRemarks("");
    } catch (err) {
      setLocalToast({ type: "error", text: err?.data?.message || "Action failed." });
      setAction(null);
    }
  };

  return (
    <div className="border-b border-[#f1f5f9] last:border-0">
      <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#fafafa] transition-colors">
        <div className={`w-8 h-8 rounded-full ${avatarColor(name)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
          {getInitials(name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0f172a] truncate">{name}</p>
          <p className="text-xs text-[#94a3b8] truncate">
            {fmtDate(rec.date)} · <span className="text-[#4f46e5] font-semibold">{rec.extraHours}h</span>
            {rec.reason && ` · ${rec.reason}`}
            {dept && ` · ${dept}`}
          </p>
        </div>
        {localToast ? (
          <div className={`flex items-center gap-1.5 text-xs font-semibold shrink-0 ${
            localToast.type === "success" ? "text-emerald-600" : "text-red-600"
          }`}>
            {localToast.type === "success" ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
            {localToast.text}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 shrink-0">
            <button type="button"
              onClick={() => setAction(action === "rejected" ? null : "rejected")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                action === "rejected" ? "bg-red-600 text-white border-red-600" : "text-red-600 bg-red-50 border-red-200 hover:bg-red-100"
              }`}>
              Reject
            </button>
            <button type="button"
              onClick={() => setAction(action === "approved" ? null : "approved")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                action === "approved" ? "bg-emerald-600 text-white border-emerald-600" : "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
              }`}>
              Approve
            </button>
          </div>
        )}
      </div>

      {action && !localToast && (
        <div className={`mx-5 mb-3 rounded-xl p-3 border space-y-2 ${
          action === "approved" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
        }`}>
          <p className="text-xs font-semibold text-[#374151]">
            {action === "approved" ? "Approving" : "Rejecting"} {name}'s request — add a note (optional)
          </p>
          <div className="flex gap-2">
            <input type="text"
              className="flex-1 border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-xs text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
              placeholder="e.g. Approved for production release…"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
            <button type="button" onClick={() => { setAction(null); setRemarks(""); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#64748b] bg-white border border-[#e2e8f0] cursor-pointer hover:bg-[#f1f5f9]">
              Cancel
            </button>
            <button type="button" onClick={confirm} disabled={isLoading}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white border-0 cursor-pointer disabled:opacity-40 flex items-center gap-1 ${
                action === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
              }`}>
              {isLoading && <Loader2 size={12} className="animate-spin" />}
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PendingApprovalsWidget() {
  const { data, isLoading } = useGetAllOvertimeQuery({ status: "pending", limit: 5 });
  const records = data?.overtime ?? [];
  const total   = data?.total   ?? records.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-[#0f172a]">Pending Approvals</h3>
          {total > 5 && <p className="text-xs text-[#94a3b8] mt-0.5">{total} total · showing 5</p>}
        </div>
        <Link to="/approvals" className="flex items-center gap-1 text-xs font-semibold text-[#4f46e5] no-underline hover:underline">
          View all <ChevronRight size={13} />
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={22} className="animate-spin text-[#4f46e5]" />
          </div>
        )}
        {!isLoading && records.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle size={20} className="text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-[#374151]">All caught up</p>
            <p className="text-xs text-[#94a3b8]">No pending overtime requests</p>
          </div>
        )}
        {!isLoading && records.length > 0 && records.map(rec => (
          <ApprovalRow key={rec._id} rec={rec} />
        ))}
      </div>
    </div>
  );
}

// ─── Greeting helper ──────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const user    = useSelector(state => state.auth.user);
  const role    = user?.role || "employee";
  const actions = actionsByRole[role] || actionsByRole.employee;
  const isManagerOrAdmin = role === "manager" || role === "admin";

  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local timezone
  const { data: dashData, isLoading: isDashLoading } = useGetDashboardQuery(today);
  const dash = dashData?.dashboard ?? dashData;

  const yesterday = new Date(Date.now() - 864e5).toISOString().split("T")[0];
  const { data: missedData } = useGetMissedPunchQuery(yesterday, { skip: !isManagerOrAdmin });
  const missedShown = useRef(false);

  useEffect(() => {
    if (!missedData || missedShown.current) return;
    const count = missedData.count ?? missedData.records?.length ?? 0;
    if (count > 0) {
      toast.error(`${count} employee${count > 1 ? "s" : ""} did not punch out yesterday`, { duration: 8000 });
      missedShown.current = true;
    }
  }, [missedData]);

  const missedCount = missedData?.count ?? missedData?.records?.length ?? 0;

  return (
    <div className="space-y-6">

      {/* ── Welcome banner ── */}
      <div className="relative overflow-hidden bg-[#0f1729] rounded-2xl px-7 py-6">
        {/* subtle decorative rings */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/[0.03] pointer-events-none" />
        <div className="absolute -right-2 -top-2 w-24 h-24 rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute right-16 bottom-0 w-16 h-16 rounded-full bg-[#4f46e5]/20 pointer-events-none" />

        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/50 mb-1">{greeting()},</p>
            <h2 className="text-2xl font-bold text-white leading-tight">{user?.name || "User"}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/70 text-xs font-medium px-2.5 py-1 rounded-full capitalize">
                {role}
              </span>
              {user?.department && (
                <span className="text-xs text-white/40">{user.department}</span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#4f46e5] flex items-center justify-center shrink-0 shadow-lg shadow-[#4f46e5]/40">
            <Sparkles size={22} className="text-white" />
          </div>
        </div>
      </div>

      {/* ── Missed punch alert ── */}
      {isManagerOrAdmin && missedCount > 0 && (
        <Link to="/attendance"
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 no-underline hover:bg-amber-100 transition-colors group">
          <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center shrink-0">
            <AlertTriangle size={15} className="text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              {missedCount} employee{missedCount !== 1 ? "s" : ""} didn't punch out yesterday
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Tap to review attendance records</p>
          </div>
          <ArrowRight size={15} className="text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}

      {/* ── Dashboard stats ── */}
      {isDashLoading ? (
        <div className="flex items-center gap-2 text-sm text-[#94a3b8] py-4">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : dash && (
        <div>
          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest mb-3">
            {role === "employee" ? "My overview" : "Today's overview"}
          </p>
          {role === "employee" && <EmployeeStats data={dash} />}
          {role === "manager"  && <ManagerStats  data={dash} />}
          {role === "admin"    && <AdminStats    data={dash} />}
        </div>
      )}

      {/* ── Quick actions ── */}
      <div>
        <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest mb-3">Quick actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map(action => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.to}
                className="group bg-white rounded-2xl p-5 border border-[#e2e8f0] hover:border-[#c7d2fe] hover:shadow-sm transition-all no-underline flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${action.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon size={17} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0f172a] leading-snug">{action.title}</p>
                  <p className="text-xs text-[#94a3b8] mt-0.5 truncate">{action.desc}</p>
                </div>
                <ArrowRight size={15} className="text-[#cbd5e1] shrink-0 group-hover:text-[#4f46e5] group-hover:translate-x-0.5 transition-all" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Pending approvals ── */}
      {isManagerOrAdmin && <PendingApprovalsWidget />}
    </div>
  );
}
