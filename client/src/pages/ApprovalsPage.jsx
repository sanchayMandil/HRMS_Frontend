import { useState } from "react";
import { useSelector } from "react-redux";
import {
  Timer, Clock, CheckCircle, XCircle, AlertCircle,
  Loader2, X, Users, CalendarDays, ShieldAlert
} from "lucide-react";
import {
  useGetAllOvertimeQuery,
  useReviewOvertimeMutation
} from "../app/api/baseApi";
import { avatarColor, getInitials } from "../components/AttendanceRecordDrawer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }) {
  const map = {
    pending:  "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-600"
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${map[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────

function ReviewModal({ rec, onClose }) {
  const role = useSelector(state => state.auth.user?.role);
  const isAdmin = role === "admin";
  const canAct  = rec.status === "pending" || isAdmin;

  const [remarks, setRemarks] = useState("");
  const [approvedHours, setApprovedHours] = useState(rec.extraHours ?? "");
  const [reviewOvertime, { isLoading }] = useReviewOvertimeMutation();
  const [toast, setToast] = useState(null);

  const name = rec.userId?.name ?? rec.userName ?? "Unknown";
  const dept = rec.userId?.department ?? "";

  const handle = async (status) => {
    try {
      await reviewOvertime({
        id: rec._id,
        status,
        reviewNote: remarks.trim() || undefined,
        approvedHours: status === "approved" ? Number(approvedHours) : undefined
      }).unwrap();
      setToast({ type: "success", text: `Request ${status}.` });
      setTimeout(() => onClose(), 800);
    } catch (err) {
      setToast({ type: "error", text: err?.data?.message || "Action failed." });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${avatarColor(name)} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
              {getInitials(name)}
            </div>
            <div>
              <p className="text-sm font-bold text-[#0f172a]">{name}</p>
              <p className="text-xs text-[#94a3b8]">{dept || "—"}</p>
            </div>
          </div>
          <button onClick={onClose} type="button"
            className="text-[#94a3b8] hover:text-[#0f172a] border-0 bg-transparent cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Date",  value: fmtDate(rec.date) },
            { label: "Hours", value: `${rec.extraHours}h` },
            { label: "Status", value: <StatusBadge status={rec.status} /> }
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 text-center">
              <p className="text-xs text-[#94a3b8] mb-1">{label}</p>
              <div className="text-sm font-semibold text-[#0f172a] flex justify-center">{value}</div>
            </div>
          ))}
        </div>

        {/* Reason */}
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
          <p className="text-xs font-semibold text-[#64748b] mb-1">Reason</p>
          <p className="text-sm text-[#0f172a]">{rec.reason || "—"}</p>
        </div>

        {/* Existing review info (always visible when already reviewed) */}
        {rec.status !== "pending" && rec.reviewedBy?.name && (
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 space-y-1">
            <p className="text-xs text-[#64748b]">
              Previously reviewed by{" "}
              <span className="font-semibold text-[#0f172a]">{rec.reviewedBy.name}</span>
              {rec.reviewedBy.role && (
                <span className={`ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${
                  rec.reviewedBy.role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-blue-100 text-blue-700"
                }`}>{rec.reviewedBy.role}</span>
              )}
            </p>
            {rec.approvedHours && <p className="text-xs text-emerald-700 font-semibold">Approved: {rec.approvedHours}h</p>}
            {rec.reviewNote && <p className="text-sm text-[#475569]">"{rec.reviewNote}"</p>}
          </div>
        )}

        {/* Admin override warning */}
        {isAdmin && rec.status !== "pending" && (
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <ShieldAlert size={15} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              <span className="font-semibold">Admin override</span> — you can change this decision.
              The previous reviewer's action will be replaced.
            </p>
          </div>
        )}

        {/* Approved hours + note — shown for pending, or for admin overriding */}
        {canAct && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Approved Hours <span className="text-[#94a3b8] font-normal">(for approval)</span>
              </label>
              <input
                type="number"
                min={0.5}
                max={12}
                step={0.5}
                className="w-full border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                value={approvedHours}
                onChange={e => setApprovedHours(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                {isAdmin && rec.status !== "pending" ? "Override Note" : "Review Note"}
                {" "}<span className="text-[#94a3b8] font-normal">(optional)</span>
              </label>
              <textarea
                className="w-full border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] resize-none"
                rows={2}
                placeholder="Add a note for the employee…"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>
          </div>
        )}

        {toast && (
          <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm border ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-600"
          }`}>
            {toast.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {toast.text}
          </div>
        )}

        {canAct ? (
          <div className="flex gap-3">
            <button type="button" onClick={() => handle("rejected")} disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5">
              <XCircle size={14} /> {isAdmin && rec.status === "approved" ? "Override: Reject" : "Reject"}
            </button>
            <button type="button" onClick={() => handle("approved")} disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5">
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {isAdmin && rec.status === "rejected" ? "Override: Approve" : "Approve"}
            </button>
          </div>
        ) : (
          <button type="button" onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-[#64748b] bg-[#f1f5f9] border-0 cursor-pointer hover:bg-[#e2e8f0] transition-colors">
            Close
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ApprovalsPage() {
  const role = useSelector(state => state.auth.user?.role);
  const isAdmin = role === "admin";

  // Admin starts on "all" so approved/rejected records are immediately visible for override
  const [statusFilter, setStatusFilter] = useState(isAdmin ? "all" : "pending");
  const [month, setMonth] = useState("");
  const [selected, setSelected] = useState(null);

  const { data, isLoading, error, isFetching, refetch } = useGetAllOvertimeQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    month: month || undefined
  });

  const records = data?.overtime ?? [];
  const total   = data?.total ?? records.length;

  const counts = {
    all:      total,
    pending:  records.filter(r => r.status === "pending").length,
    approved: records.filter(r => r.status === "approved").length,
    rejected: records.filter(r => r.status === "rejected").length
  };

  return (
    <div className="space-y-5">
      {selected && <ReviewModal rec={selected} onClose={() => setSelected(null)} />}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: "all",      label: "Total",    icon: Users,       iconBg: "bg-indigo-500",  vc: "text-indigo-700" },
          { key: "pending",  label: "Pending",  icon: Clock,       iconBg: "bg-amber-500",   vc: "text-amber-600" },
          { key: "approved", label: "Approved", icon: CheckCircle, iconBg: "bg-emerald-500", vc: "text-emerald-700" },
          { key: "rejected", label: "Rejected", icon: XCircle,     iconBg: "bg-red-500",     vc: "text-red-600" }
        ].map(({ key, label, icon: Icon, iconBg, vc }) => (
          <button key={key} type="button" onClick={() => setStatusFilter(key)}
            className={`bg-white rounded-2xl border p-5 flex flex-col gap-4 cursor-pointer text-left transition-all ${
              statusFilter === key ? "border-[#4f46e5] ring-2 ring-[#4f46e5]/20" : "border-[#e2e8f0] hover:border-[#c7d2e8]"
            }`}>
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
              <Icon size={17} className="text-white" />
            </div>
            <div>
              <p className={`text-3xl font-bold leading-none ${vc}`}>{counts[key]}</p>
              <p className="text-sm text-[#64748b] mt-1.5">{label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9] flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">Overtime Requests</h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              {total} record{total !== 1 ? "s" : ""} · click a row to approve or reject
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-[#94a3b8]" />
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="border border-[#e2e8f0] rounded-xl px-3 py-1.5 text-xs text-[#0f172a] bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] cursor-pointer" />
            <button type="button" onClick={refetch}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748b] border border-[#e2e8f0] rounded-xl bg-white cursor-pointer hover:bg-[#f8fafc] transition-colors">
              <Loader2 size={12} className={isFetching ? "animate-spin" : "opacity-0"} />
              Refresh
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
            {error?.data?.message || "Failed to load overtime requests."}
          </div>
        )}
        {!isLoading && !error && records.length === 0 && (
          <div className="text-center py-16">
            <Timer size={32} className="text-[#cbd5e1] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#64748b]">No requests found.</p>
            <p className="text-xs text-[#94a3b8] mt-1">Try changing the status filter or month.</p>
          </div>
        )}

        {!isLoading && records.length > 0 && (
          <div className="overflow-x-auto">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3 bg-[#f8fafc] border-b border-[#e2e8f0]">
              {["Employee", "Date", "Hours", "Reason", "Status", "Action"].map(h => (
                <p key={h} className="text-xs font-semibold text-[#64748b] uppercase tracking-wider whitespace-nowrap">{h}</p>
              ))}
            </div>

            {records.map((rec, idx) => {
              const name = rec.userId?.name ?? rec.userName ?? "Unknown";
              const dept = rec.userId?.department ?? "";
              return (
                <div key={rec._id ?? idx}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-6 py-4 border-b border-[#f1f5f9] last:border-0 hover:bg-[#fafafa] transition-colors">

                  {/* Employee */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full ${avatarColor(name)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                      {getInitials(name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0f172a] truncate">{name}</p>
                      {dept && <p className="text-xs text-[#94a3b8]">{dept}</p>}
                    </div>
                  </div>

                  <p className="text-sm text-[#0f172a] whitespace-nowrap">{fmtDate(rec.date)}</p>
                  <p className="text-sm font-semibold text-[#4f46e5] whitespace-nowrap">{rec.extraHours}h{rec.approvedHours && rec.approvedHours !== rec.extraHours ? ` → ${rec.approvedHours}h` : ""}</p>
                  <p className="text-sm text-[#64748b] max-w-[160px] truncate">{rec.reason || "—"}</p>
                  <StatusBadge status={rec.status} />

                  {/* Action buttons */}
                  {rec.status === "pending" ? (
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => setSelected(rec)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors whitespace-nowrap">
                        <CheckCircle size={12} /> Approve
                      </button>
                      <button type="button" onClick={() => setSelected(rec)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors whitespace-nowrap">
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  ) : isAdmin ? (
                    <button type="button" onClick={() => setSelected(rec)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors whitespace-nowrap">
                      <ShieldAlert size={12} /> Override
                    </button>
                  ) : (
                    <button type="button" onClick={() => setSelected(rec)}
                      className="text-xs text-[#4f46e5] font-medium cursor-pointer border-0 bg-transparent hover:underline whitespace-nowrap">
                      View
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
