import { useState } from "react";
import { useSelector } from "react-redux";
import { LogIn, LogOut, MapPin, Camera, Clock, Users } from "lucide-react";
import {
  useGetMyAttendanceQuery,
  useGetTeamAttendanceQuery,
  usePunchInMutation,
  usePunchOutMutation
} from "../../app/api/baseApi";

const demoPayload = {
  selfie: "data:image/png;base64,replace-me-with-live-camera-capture",
  location: { latitude: 12.9716, longitude: 77.5946 }
};

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// ── Admin view: read-only, all users' attendance ───────────────────────────
function AdminAttendanceView() {
  const { data, isLoading, error } = useGetTeamAttendanceQuery();
  const records = Array.isArray(data) ? data : data?.records ?? [];

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Users size={18} className="text-blue-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#0f172a]">All Attendance Records</h3>
          <p className="text-xs text-[#64748b]">System-wide punch-in/out log</p>
        </div>
      </div>

      {isLoading && <p className="text-sm text-[#64748b]">Loading records…</p>}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error?.data?.message || "Failed to load attendance records."}
        </div>
      )}
      {!isLoading && !error && records.length === 0 && (
        <div className="text-center py-10">
          <Clock size={32} className="text-[#cbd5e1] mx-auto mb-3" />
          <p className="text-sm font-medium text-[#64748b]">No attendance records yet</p>
        </div>
      )}

      {records.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[#e2e8f0]">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-[#f8fafc] border-b border-[#e2e8f0]">
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Employee</p>
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Punch In</p>
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Punch Out</p>
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Status</p>
          </div>
          {records.map((rec, idx) => {
            const name = rec.userId?.name ?? rec.userName ?? "Unknown";
            const punchIn = rec.punchIn
              ? new Date(rec.punchIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
              : "—";
            const punchOut = rec.punchOut
              ? new Date(rec.punchOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
              : "—";
            const isActive = !rec.punchOut;

            return (
              <div
                key={rec._id ?? idx}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5 border-b border-[#f1f5f9] last:border-0 hover:bg-[#fafafa] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#4f46e5] flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {getInitials(name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0f172a] truncate">{name}</p>
                    {rec.userId?.department && (
                      <p className="text-xs text-[#94a3b8]">{rec.userId.department}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-[#0f172a] whitespace-nowrap font-mono">{punchIn}</p>
                <p className="text-sm text-[#64748b] whitespace-nowrap font-mono">{punchOut}</p>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                    isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {isActive ? "Checked in" : "Completed"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Employee / Manager view: punch buttons + personal records ──────────────
function EmployeeAttendanceView() {
  const [message, setMessage] = useState(null);
  const { data, isLoading: isLoadingData } = useGetMyAttendanceQuery();
  const [punchIn, punchInState] = usePunchInMutation();
  const [punchOut, punchOutState] = usePunchOutMutation();

  const handlePunchIn = async () => {
    try {
      await punchIn(demoPayload).unwrap();
      setMessage({ type: "success", text: "Punched in successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err?.data?.message || "Punch in failed." });
    }
  };

  const handlePunchOut = async () => {
    try {
      await punchOut(demoPayload).unwrap();
      setMessage({ type: "success", text: "Punched out successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err?.data?.message || "Punch out failed." });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-[#0f172a]">Mark Attendance</h3>
          <p className="text-sm text-[#64748b] mt-0.5">Record your check-in or check-out for today.</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs text-[#64748b]">
            <Camera size={12} /> Selfie required
          </div>
          <div className="flex items-center gap-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs text-[#64748b]">
            <MapPin size={12} /> GPS location
          </div>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 leading-relaxed">
          Currently using a demo payload. Replace with{" "}
          <code className="font-mono bg-amber-100 px-1 rounded">getUserMedia()</code> and{" "}
          <code className="font-mono bg-amber-100 px-1 rounded">navigator.geolocation</code> for production.
        </div>

        <div className="flex gap-3">
          <button
            className="flex-1 flex items-center justify-center gap-2 bg-[#4f46e5] text-white rounded-xl py-3 text-sm font-semibold cursor-pointer border-0 hover:bg-[#4338ca] transition-colors disabled:opacity-50"
            disabled={punchInState.isLoading}
            onClick={handlePunchIn}
            type="button"
          >
            <LogIn size={16} />
            {punchInState.isLoading ? "Punching in…" : "Punch In"}
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 bg-[#f1f5f9] text-[#475569] rounded-xl py-3 text-sm font-semibold cursor-pointer border border-[#e2e8f0] hover:bg-[#e2e8f0] transition-colors disabled:opacity-50"
            disabled={punchOutState.isLoading}
            onClick={handlePunchOut}
            type="button"
          >
            <LogOut size={16} />
            {punchOutState.isLoading ? "Punching out…" : "Punch Out"}
          </button>
        </div>

        {message && (
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
            message.type === "error"
              ? "bg-red-50 border border-red-200 text-red-600"
              : "bg-emerald-50 border border-emerald-200 text-emerald-700"
          }`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-[#64748b]" />
          <h3 className="text-base font-semibold text-[#0f172a]">My Attendance</h3>
        </div>
        {isLoadingData ? (
          <p className="text-sm text-[#64748b]">Loading records…</p>
        ) : (
          <pre className="text-xs text-[#475569] overflow-auto whitespace-pre-wrap bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0] max-h-80 font-mono">
            {JSON.stringify(data ?? [], null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const role = useSelector((state) => state.auth.user?.role);
  return role === "admin" ? <AdminAttendanceView /> : <EmployeeAttendanceView />;
}
