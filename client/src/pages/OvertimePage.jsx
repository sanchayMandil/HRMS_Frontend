import { useState } from "react";
import { Timer, Send, Clock } from "lucide-react";
import { useGetOvertimeRequestsQuery, useRequestOvertimeMutation } from "../app/api/baseApi";

export default function OvertimePage() {
  const [form, setForm] = useState({ hours: 2, reason: "" });
  const [message, setMessage] = useState(null);
  const [requestOvertime, { isLoading }] = useRequestOvertimeMutation();
  const { data, isLoading: isLoadingData } = useGetOvertimeRequestsQuery();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await requestOvertime({
        requestedHours: Number(form.hours),
        reason: form.reason || "Project delivery support"
      }).unwrap();
      setMessage({ type: "success", text: "Overtime request submitted successfully." });
      setForm({ hours: 2, reason: "" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err?.data?.message || "Request failed. Please try again."
      });
    }
  };

  const inputClass =
    "w-full border border-[#e2e8f0] rounded-xl px-4 py-3 bg-white text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] transition-colors";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Request form */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Timer size={18} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#0f172a]">Request Overtime</h3>
            <p className="text-xs text-[#64748b]">Submit a new overtime request</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-[#0f172a] block mb-1.5">
              Hours requested
            </label>
            <input
              className={inputClass}
              min="1"
              max="12"
              type="number"
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#0f172a] block mb-1.5">
              Reason{" "}
              <span className="text-[#94a3b8] font-normal">(optional)</span>
            </label>
            <input
              className={inputClass}
              placeholder="e.g. Project delivery deadline"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
                message.type === "error"
                  ? "bg-red-50 border border-red-200 text-red-600"
                  : "bg-emerald-50 border border-emerald-200 text-emerald-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            className="w-full flex items-center justify-center gap-2 bg-[#4f46e5] text-white rounded-xl py-3 text-sm font-semibold cursor-pointer border-0 hover:bg-[#4338ca] transition-colors disabled:opacity-50"
            disabled={isLoading}
            type="submit"
          >
            <Send size={15} />
            {isLoading ? "Submitting…" : "Submit request"}
          </button>
        </form>
      </div>

      {/* Requests list */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-[#64748b]" />
          <h3 className="text-base font-semibold text-[#0f172a]">My Requests</h3>
        </div>
        {isLoadingData ? (
          <p className="text-sm text-[#64748b]">Loading…</p>
        ) : (
          <pre className="text-xs text-[#475569] overflow-auto whitespace-pre-wrap bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0] max-h-80 font-mono">
            {JSON.stringify(data ?? [], null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
