import { Clock, Timer, User } from "lucide-react";
import { useGetOvertimeRequestsQuery } from "../app/api/baseApi";

const statusStyle = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-600"
};

function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ApprovalsPage() {
  const { data, isLoading, error } = useGetOvertimeRequestsQuery();
  const requests = Array.isArray(data) ? data : data?.requests ?? [];

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Timer size={18} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#0f172a]">Overtime Requests</h3>
            <p className="text-xs text-[#64748b]">
              Review all submitted overtime requests from your team
            </p>
          </div>
        </div>
      </div>

      {/* States */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 text-center text-[#64748b] text-sm">
          Loading requests…
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">
          {error?.data?.message || "Failed to load overtime requests."}
        </div>
      )}
      {!isLoading && !error && requests.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 text-center">
          <Timer size={32} className="text-[#cbd5e1] mx-auto mb-3" />
          <p className="text-sm font-medium text-[#64748b]">No overtime requests yet</p>
          <p className="text-xs text-[#94a3b8] mt-1">
            Requests submitted by team members will appear here.
          </p>
        </div>
      )}

      {/* Request list */}
      {requests.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-[#f1f5f9] bg-[#f8fafc]">
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Employee</p>
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Hours</p>
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Date</p>
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Status</p>
          </div>

          {requests.map((req, idx) => {
            const status = req.status ?? "pending";
            const name = req.userId?.name ?? req.userName ?? "Unknown";
            const reason = req.reason ?? req.notes ?? "—";
            const date = req.createdAt
              ? new Date(req.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })
              : "—";

            return (
              <div
                key={req._id ?? idx}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-6 py-4 border-b border-[#f1f5f9] last:border-0 hover:bg-[#fafafa] transition-colors"
              >
                {/* Employee */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#4f46e5] flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {getInitials(name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0f172a] truncate">{name}</p>
                    <p className="text-xs text-[#94a3b8] truncate">{reason}</p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-center gap-1.5 text-sm font-semibold text-[#0f172a] whitespace-nowrap">
                  <Clock size={13} className="text-[#94a3b8]" />
                  {req.requestedHours ?? req.hours ?? "—"}h
                </div>

                {/* Date */}
                <p className="text-xs text-[#64748b] whitespace-nowrap">{date}</p>

                {/* Status */}
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize whitespace-nowrap ${
                    statusStyle[status] ?? statusStyle.pending
                  }`}
                >
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Note about approve/reject */}
      <p className="text-xs text-[#94a3b8] text-center">
        Approve / reject actions require additional backend endpoints not yet in the current API spec.
      </p>
    </div>
  );
}
