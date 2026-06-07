import { useState } from "react";
import { useSelector } from "react-redux";
import {
  Timer, Send, Clock, CheckCircle, XCircle, AlertCircle,
  Loader2, Trash2, Users, CalendarDays, X, ChevronDown
} from "lucide-react";
import {
  useSubmitOvertimeMutation,
  useGetMyOvertimeQuery,
  useCancelOvertimeMutation,
  useGetAllOvertimeQuery,
  useReviewOvertimeMutation
} from "../app/api/baseApi";
import { avatarColor, getInitials } from "../components/AttendanceRecordDrawer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function RoleBadge({ role }) {
  const map = {
    admin:   "bg-indigo-100 text-indigo-700",
    manager: "bg-blue-100 text-blue-700"
  };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${map[role] ?? "bg-slate-100 text-slate-600"}`}>
      {role}
    </span>
  );
}

function ReviewerInfo({ rec }) {
  if (!rec.reviewedBy?.name) return null;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-[#94a3b8]">Reviewed by</span>
      <span className="text-xs font-semibold text-[#0f172a]">{rec.reviewedBy.name}</span>
      {rec.reviewedBy.role && <RoleBadge role={rec.reviewedBy.role} />}
      {rec.reviewedAt && (
        <span className="text-xs text-[#94a3b8]">· {fmtDate(rec.reviewedAt)}</span>
      )}
    </div>
  );
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
      setTimeout(() => onClose(), 900);
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
              <p className="text-xs text-[#94a3b8]">{dept}</p>
            </div>
          </div>
          <button onClick={onClose} type="button" className="text-[#94a3b8] hover:text-[#0f172a] border-0 bg-transparent cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Details */}
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

        {/* Remarks */}
        {rec.status === "pending" && (
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
                Review Note <span className="text-[#94a3b8] font-normal">(optional)</span>
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

        {/* Existing review */}
        {rec.status !== "pending" && (
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 space-y-2">
            <ReviewerInfo rec={rec} />
            {rec.approvedHours && (
              <p className="text-xs text-[#64748b]">Approved: <span className="font-semibold text-emerald-700">{rec.approvedHours}h</span></p>
            )}
            {rec.reviewNote && (
              <>
                <p className="text-xs font-semibold text-[#64748b]">Note</p>
                <p className="text-sm text-[#475569]">{rec.reviewNote}</p>
              </>
            )}
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

        {rec.status === "pending" && (
          <div className="flex gap-3">
            <button type="button" onClick={() => handle("rejected")} disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5">
              <XCircle size={14} /> Reject
            </button>
            <button type="button" onClick={() => handle("approved")} disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5">
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve
            </button>
          </div>
        )}

        {rec.status !== "pending" && (
          <button type="button" onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-[#64748b] bg-[#f1f5f9] border-0 cursor-pointer hover:bg-[#e2e8f0] transition-colors">
            Close
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Submit form + My history ─────────────────────────────────────────────────

function MyOvertimeView() {
  const [form, setForm] = useState({ date: todayStr(), extraHours: 2, reason: "" });
  const [formMsg, setFormMsg] = useState(null);
  const [histFilter, setHistFilter] = useState("all");
  const [histMonth, setHistMonth] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const [submitOvertime, { isLoading: isSubmitting }] = useSubmitOvertimeMutation();
  const [cancelOvertime] = useCancelOvertimeMutation();

  const histParams = {};
  if (histFilter !== "all") histParams.status = histFilter;
  if (histMonth) histParams.month = histMonth;

  const { data: histData, isLoading: isHistLoading } = useGetMyOvertimeQuery(histParams);
  const records = histData?.overtime ?? [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason.trim()) { setFormMsg({ type: "error", text: "Reason is required." }); return; }
    try {
      const result = await submitOvertime({
        date: form.date,
        extraHours: Number(form.extraHours),
        reason: form.reason.trim()
      }).unwrap();
      const reviewer = result?.willBeReviewedBy;
      setFormMsg({
        type: "success",
        text: "Overtime request submitted!",
        reviewer
      });
      setForm({ date: todayStr(), extraHours: 2, reason: "" });
    } catch (err) {
      setFormMsg({ type: "error", text: err?.data?.message || "Submission failed." });
    }
  };

  const handleCancel = async (id) => {
    setCancellingId(id);
    try {
      await cancelOvertime(id).unwrap();
    } catch (_) {}
    setCancellingId(null);
  };

  const inputCls = "w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 bg-white text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] transition-colors";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ── Submit form ── */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Timer size={18} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#0f172a]">Request Overtime</h3>
            <p className="text-xs text-[#64748b]">Submit a new overtime request</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold text-[#374151] block mb-1.5">Date <span className="text-red-500">*</span></label>
            <input type="date" className={inputCls} value={form.date}
              onChange={e => { setForm({ ...form, date: e.target.value }); setFormMsg(null); }} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#374151] block mb-1.5">Hours Requested <span className="text-red-500">*</span></label>
            <input type="number" className={inputCls} min={1} max={12} value={form.extraHours}
              onChange={e => { setForm({ ...form, extraHours: e.target.value }); setFormMsg(null); }} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#374151] block mb-1.5">Reason <span className="text-red-500">*</span></label>
            <textarea className={`${inputCls} resize-none`} rows={3}
              placeholder="e.g. Critical deployment fix, client deadline…"
              value={form.reason}
              onChange={e => { setForm({ ...form, reason: e.target.value }); setFormMsg(null); }} />
          </div>

          {formMsg && (
            <div className={`rounded-xl px-4 py-3 text-sm border ${
              formMsg.type === "error"
                ? "bg-red-50 border-red-200 text-red-600"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}>
              <div className="flex items-center gap-2">
                {formMsg.type === "error" ? <AlertCircle size={14} className="shrink-0" /> : <CheckCircle size={14} className="shrink-0" />}
                <span>{formMsg.text}</span>
              </div>
              {formMsg.reviewer && (
                <div className="mt-2 ml-5 flex items-center gap-1.5">
                  <span className="text-xs text-emerald-600">Will be reviewed by</span>
                  <span className="text-xs font-semibold text-emerald-800">{formMsg.reviewer.name}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${
                    formMsg.reviewer.role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-blue-100 text-blue-700"
                  }`}>{formMsg.reviewer.role}</span>
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-[#4f46e5] text-white rounded-xl py-3 text-sm font-semibold cursor-pointer border-0 hover:bg-[#4338ca] transition-colors disabled:opacity-40">
            {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {isSubmitting ? "Submitting…" : "Submit Request"}
          </button>
        </form>
      </div>

      {/* ── My history ── */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#64748b]" />
            <h3 className="text-base font-semibold text-[#0f172a]">My Requests</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-[#f1f5f9] rounded-xl p-1 gap-0.5">
              {["all", "pending", "approved", "rejected"].map(s => (
                <button key={s} type="button" onClick={() => setHistFilter(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border-0 cursor-pointer transition-all capitalize ${
                    histFilter === s ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b] bg-transparent"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="relative">
              <input type="month" value={histMonth} onChange={e => setHistMonth(e.target.value)}
                className="border border-[#e2e8f0] rounded-xl px-3 py-1.5 text-xs text-[#0f172a] bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] cursor-pointer" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[480px]">
          {isHistLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="animate-spin text-[#4f46e5]" />
            </div>
          )}
          {!isHistLoading && records.length === 0 && (
            <div className="text-center py-10">
              <Timer size={28} className="text-[#cbd5e1] mx-auto mb-2" />
              <p className="text-sm text-[#94a3b8]">No overtime requests found.</p>
            </div>
          )}
          {records.map(rec => (
            <div key={rec._id} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[#0f172a]">{fmtDate(rec.date)}</p>
                    <StatusBadge status={rec.status} />
                  </div>
                  <p className="text-xs text-[#64748b] mt-1">
                    <span className="font-medium text-[#4f46e5]">{rec.extraHours}h</span>
                    {rec.approvedHours && rec.approvedHours !== rec.extraHours && (
                      <span className="text-emerald-600"> → {rec.approvedHours}h approved</span>
                    )}
                    {rec.reason && ` · ${rec.reason}`}
                  </p>
                  {rec.reviewedBy?.name && (
                    <div className="mt-1.5 space-y-0.5">
                      <ReviewerInfo rec={rec} />
                      {rec.reviewNote && (
                        <p className="text-xs text-[#64748b] italic">"{rec.reviewNote}"</p>
                      )}
                    </div>
                  )}
                </div>
                {rec.status === "pending" && (
                  <button type="button" onClick={() => handleCancel(rec._id)}
                    disabled={cancellingId === rec._id}
                    className="shrink-0 flex items-center gap-1 text-xs text-red-500 font-medium border-0 bg-transparent cursor-pointer hover:text-red-700 disabled:opacity-40">
                    {cancellingId === rec._id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Trash2 size={13} />}
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Admin / Manager management view ─────────────────────────────────────────

function ManageOvertimeView() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [month, setMonth] = useState("");
  const [selected, setSelected] = useState(null);

  const { data, isLoading, isFetching, refetch } = useGetAllOvertimeQuery({
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9] flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">Overtime Requests</h3>
            <p className="text-xs text-[#64748b] mt-0.5">{total} record{total !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-[#94a3b8]" />
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="border border-[#e2e8f0] rounded-xl px-3 py-1.5 text-xs text-[#0f172a] bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] cursor-pointer" />
            <button type="button" onClick={refetch}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748b] border border-[#e2e8f0] rounded-xl bg-white cursor-pointer hover:bg-[#f8fafc] transition-colors">
              <Loader2 size={12} className={isFetching ? "animate-spin" : "hidden"} />
              Refresh
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[#4f46e5]" />
          </div>
        )}
        {!isLoading && records.length === 0 && (
          <div className="text-center py-16">
            <Timer size={32} className="text-[#cbd5e1] mx-auto mb-3" />
            <p className="text-sm text-[#64748b]">No requests found.</p>
          </div>
        )}

        {!isLoading && records.length > 0 && (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3 bg-[#f8fafc] border-b border-[#e2e8f0]">
              {["Employee", "Date", "Hours", "Reason", "Status", ""].map(h => (
                <p key={h} className="text-xs font-semibold text-[#64748b] uppercase tracking-wider whitespace-nowrap">{h}</p>
              ))}
            </div>
            {records.map((rec, idx) => {
              const name = rec.userId?.name ?? rec.userName ?? "Unknown";
              const dept = rec.userId?.department ?? "";
              return (
                <div key={rec._id ?? idx}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-6 py-4 border-b border-[#f1f5f9] last:border-0 hover:bg-[#fafafa] transition-colors">
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
                  <p className="text-sm text-[#64748b] max-w-[180px] truncate">{rec.reason || "—"}</p>
                  <StatusBadge status={rec.status} />
                  <button type="button" onClick={() => setSelected(rec)}
                    className="text-xs text-[#4f46e5] font-medium cursor-pointer border-0 bg-transparent hover:underline whitespace-nowrap flex items-center gap-1">
                    <ChevronDown size={13} /> Review
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

// ─── Main export ─────────────────────────────────────────────────────────────

export default function OvertimePage() {
  const role = useSelector(state => state.auth.user?.role || "employee");
  const [tab, setTab] = useState("manage");

  if (role === "employee") {
    return <MyOvertimeView />;
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex bg-[#f1f5f9] rounded-2xl p-1 w-fit gap-1">
        {[
          { key: "manage", label: "Team Requests", icon: Users },
          { key: "mine",   label: "My Requests",   icon: Timer }
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all ${
              tab === key ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b] bg-transparent hover:text-[#0f172a]"
            }`}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === "manage" ? <ManageOvertimeView /> : <MyOvertimeView />}
    </div>
  );
}
