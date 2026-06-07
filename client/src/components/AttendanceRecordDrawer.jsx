import { useState } from "react";
import { useSelector } from "react-redux";
import {
  X, Eye, Image, MessageSquare, CheckSquare, XCircle,
  CalendarCheck, CalendarX, CheckCircle, AlertCircle, Loader2, Lock
} from "lucide-react";
import {
  useValidateAttendanceMutation,
  useEditAttendanceMutation
} from "../app/api/baseApi";

// ─── helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-indigo-500", "bg-teal-500", "bg-pink-500"
];
export function avatarColor(name = "") {
  let s = 0; for (const c of name) s += c.charCodeAt(0);
  return AVATAR_COLORS[s % AVATAR_COLORS.length];
}
export function getInitials(name = "") {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}
export function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
export function fmtHours(h) {
  if (h == null) return "—";
  return `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`;
}

// ─── Selfie lightbox ──────────────────────────────────────────────────────────

export function SelfieModal({ url, label, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="relative max-w-md w-full" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} type="button"
          className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow border-0 cursor-pointer z-10">
          <X size={16} className="text-[#0f172a]" />
        </button>
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-4 py-3 border-b border-[#f1f5f9]">
            <p className="text-sm font-semibold text-[#0f172a]">{label}</p>
          </div>
          <img src={url} alt={label} className="w-full object-cover max-h-96" />
        </div>
      </div>
    </div>
  );
}

// ─── Validation badge (used in tables) ───────────────────────────────────────

export function ValidationIcon({ vs, adminLocked }) {
  if (adminLocked) return <Lock size={12} className="text-indigo-400 shrink-0" title="Finalised by admin" />;
  if (vs === "valid")   return <CheckCircle size={14} className="text-emerald-500 shrink-0" />;
  if (vs === "invalid") return <XCircle     size={14} className="text-red-500 shrink-0" />;
  return null;
}

// ─── Status helper (used in tables + drawer) ─────────────────────────────────

export function statusOf(r) {
  if (r.validationStatus === "invalid") return { label: "Absent", cls: "bg-red-100 text-red-600" };
  if (!r.punchIn)  return { label: "Absent",     cls: "bg-red-100 text-red-600" };
  if (!r.punchOut) return { label: "Checked In", cls: "bg-emerald-100 text-emerald-700" };
  if (r.status === "incomplete" && r.validationStatus === "valid")
    return { label: "Half Day",   cls: "bg-purple-100 text-purple-700" };
  if (r.status === "incomplete")
    return { label: "Incomplete", cls: "bg-amber-100 text-amber-700" };
  return { label: "Completed",  cls: "bg-slate-100 text-slate-600" };
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

export function AttendanceRecordDrawer({ rec, onClose }) {
  const role = useSelector(state => state.auth.user?.role);
  const [validate, { isLoading: isValidating }] = useValidateAttendanceMutation();
  const [editAttendance, { isLoading: isEditing }] = useEditAttendanceMutation();
  const [remarks, setRemarks] = useState("");
  const [selfie, setSelfie] = useState(null);
  const [toast, setToast] = useState(null);

  const name     = rec.userId?.name ?? rec.userName ?? "Unknown";
  const isLocked = rec.adminLocked && role !== "admin";
  const isBusy   = isValidating || isEditing;
  const { label, cls } = statusOf(rec);

  const showToast = (type, text) => {
    setToast({ type, text });
    if (type === "success") setTimeout(() => onClose(), 1000);
    else setTimeout(() => setToast(null), 3500);
  };

  const handleValidate = async (status) => {
    try {
      await validate({ id: rec._id, validationStatus: status, remarks }).unwrap();
      showToast("success", `Attendance marked as ${status}.`);
    } catch (err) {
      showToast("error", err?.data?.message || "Validation failed.");
    }
  };

  const handleMarkDay = async (type) => {
    try {
      await editAttendance({
        id: rec._id,
        status: type === "full" ? "completed" : "incomplete",
        validationStatus: "valid",
        remarks: remarks.trim() || (type === "full" ? "Approved as full day" : "Approved as half day")
      }).unwrap();
      showToast("success", type === "full" ? "Marked as full day." : "Marked as half day.");
    } catch (err) {
      showToast("error", err?.data?.message || "Update failed.");
    }
  };

  return (
    <>
      {selfie && <SelfieModal url={selfie.url} label={selfie.label} onClose={() => setSelfie(null)} />}

      <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-40 p-4" onClick={onClose}>
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-full max-h-[90vh] overflow-y-auto flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f1f5f9] shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${avatarColor(name)} flex items-center justify-center text-sm font-bold text-white`}>
                {getInitials(name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[#0f172a]">{name}</p>
                  {rec.adminLocked && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      <Lock size={9} /> Admin finalised
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#94a3b8]">{rec.userId?.department ?? "—"} · {rec.date}</p>
              </div>
            </div>
            <button onClick={onClose} type="button"
              className="text-[#94a3b8] hover:text-[#0f172a] border-0 bg-transparent cursor-pointer">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 p-5 space-y-5">

            {/* Admin lock banner — shown to non-admins */}
            {isLocked && (
              <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
                <Lock size={15} className="text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-indigo-700">Record finalised by admin</p>
                  <p className="text-xs text-indigo-500 mt-0.5">This record has been locked by an administrator and cannot be modified.</p>
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

            {/* Time summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Punch In",  value: fmtTime(rec.punchIn?.time),  color: "text-emerald-600" },
                { label: "Punch Out", value: fmtTime(rec.punchOut?.time), color: "text-rose-500" },
                { label: "Hours",     value: fmtHours(rec.workingHours),  color: "text-[#4f46e5]" }
              ].map(({ label: l, value, color }) => (
                <div key={l} className="bg-[#f8fafc] rounded-xl p-3 text-center border border-[#e2e8f0]">
                  <p className="text-xs text-[#94a3b8] mb-1">{l}</p>
                  <p className={`text-sm font-bold font-mono ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Status + validation badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>
              {rec.validationStatus === "valid"   && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1"><CheckCircle size={11} /> Valid</span>}
              {rec.validationStatus === "invalid" && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600 flex items-center gap-1"><XCircle size={11} /> Invalid</span>}
              {rec.validationStatus === "pending" && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Pending Review</span>}
              {rec.isManual && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-600">Manual</span>}
            </div>

            {/* Selfies */}
            <div>
              <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">Selfies</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "punchIn",  label: "Punch In",  data: rec.punchIn },
                  { key: "punchOut", label: "Punch Out", data: rec.punchOut }
                ].map(({ key, label: l, data }) => (
                  <div key={key} className="space-y-1.5">
                    <p className="text-xs text-[#94a3b8]">{l}</p>
                    {data?.selfie ? (
                      <button type="button"
                        onClick={() => setSelfie({ url: data.selfie, label: `${name} — ${l}` })}
                        className="w-full aspect-square rounded-xl overflow-hidden border border-[#e2e8f0] cursor-pointer bg-transparent p-0 relative group">
                        <img src={data.selfie} alt={l} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye size={20} className="text-white" />
                        </div>
                      </button>
                    ) : (
                      <div className="aspect-square rounded-xl border border-dashed border-[#e2e8f0] flex flex-col items-center justify-center gap-1">
                        <Image size={20} className="text-[#cbd5e1]" />
                        <p className="text-xs text-[#94a3b8]">No photo</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Early-exit reason */}
            {rec.earlyExitReason && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <MessageSquare size={13} className="text-amber-600" />
                  <p className="text-xs font-semibold text-amber-700">Early Exit Reason</p>
                </div>
                <p className="text-sm text-amber-800">{rec.earlyExitReason}</p>
              </div>
            )}

            {/* Existing remarks */}
            {rec.remarks && (
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
                <p className="text-xs font-semibold text-[#64748b] mb-1">Remarks</p>
                <p className="text-sm text-[#475569]">{rec.remarks}</p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Actions</p>

              {isLocked ? (
                <div className="flex items-center justify-center gap-2 py-4 text-xs text-indigo-400">
                  <Lock size={13} />
                  Actions disabled — record locked by admin
                </div>
              ) : (
                <>
                  <textarea
                    className="w-full border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] resize-none"
                    placeholder="Add remarks (optional)…"
                    rows={2}
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => handleValidate("valid")} disabled={isBusy}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors disabled:opacity-40">
                      <CheckSquare size={13} /> Mark Valid ✓
                    </button>
                    <button type="button" onClick={() => handleValidate("invalid")} disabled={isBusy}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors disabled:opacity-40">
                      <XCircle size={13} /> Mark Invalid ✗
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => handleMarkDay("full")} disabled={isBusy}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-[#4f46e5] bg-indigo-50 border border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-colors disabled:opacity-40">
                      {isEditing ? <Loader2 size={12} className="animate-spin" /> : <CalendarCheck size={13} />}
                      Full Day
                    </button>
                    <button type="button" onClick={() => handleMarkDay("half")} disabled={isBusy}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors disabled:opacity-40">
                      {isEditing ? <Loader2 size={12} className="animate-spin" /> : <CalendarX size={13} />}
                      Half Day —
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
