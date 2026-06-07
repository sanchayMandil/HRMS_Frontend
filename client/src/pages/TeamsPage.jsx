import { useState } from "react";
import {
  Users, UserPlus, UserMinus, ChevronDown, CheckCircle,
  AlertCircle, Search, Loader2, Shield
} from "lucide-react";
import {
  useGetAllTeamsQuery,
  useAssignManagerMutation,
  useRemoveFromTeamMutation
} from "../app/api/baseApi";

const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-indigo-500", "bg-teal-500", "bg-pink-500"
];
function avatarColor(name = "") {
  let s = 0; for (const c of name) s += c.charCodeAt(0);
  return AVATAR_COLORS[s % AVATAR_COLORS.length];
}
function getInitials(name = "") {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function TeamsPage() {
  const { data, isLoading, error } = useGetAllTeamsQuery();
  const [assignManager] = useAssignManagerMutation();
  const [removeFromTeam] = useRemoveFromTeamMutation();

  const [assigningId, setAssigningId] = useState(null); // userId being assigned
  const [selectedManager, setSelectedManager] = useState({}); // { [userId]: managerId }
  const [removingId, setRemovingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  const teams = data?.teams ?? [];
  const unassigned = data?.unassigned?.employees ?? [];
  const managers = teams.map(t => t.manager);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAssign = async (userId) => {
    const managerId = selectedManager[userId];
    if (!managerId) return;
    setAssigningId(userId);
    try {
      await assignManager({ userId, managerId }).unwrap();
      showToast("success", "Employee assigned to team.");
    } catch (err) {
      showToast("error", err?.data?.message || "Assignment failed.");
    } finally {
      setAssigningId(null);
      setSelectedManager(prev => ({ ...prev, [userId]: "" }));
    }
  };

  const handleRemove = async (userId, memberName) => {
    setRemovingId(userId);
    try {
      await removeFromTeam(userId).unwrap();
      showToast("success", `${memberName} removed from team.`);
    } catch (err) {
      showToast("error", err?.data?.message || "Remove failed.");
    } finally {
      setRemovingId(null);
    }
  };

  const filteredUnassigned = unassigned.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          toast.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-red-50 border-red-200 text-red-600"
        }`}>
          {toast.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.text}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#4f46e5]" />
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error?.data?.message || "Failed to load teams."}
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* ── Left: Teams ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-[#4f46e5]" />
              <h3 className="text-sm font-bold text-[#0f172a]">Manager Teams ({teams.length})</h3>
            </div>

            {teams.length === 0 && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 text-center">
                <Users size={28} className="text-[#cbd5e1] mx-auto mb-2" />
                <p className="text-sm text-[#94a3b8]">No managers found.</p>
              </div>
            )}

            {teams.map((team, ti) => (
              <div key={team.manager?._id ?? ti} className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
                {/* Manager header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[#f1f5f9]">
                  <div className={`w-10 h-10 rounded-full ${avatarColor(team.manager?.name)} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                    {getInitials(team.manager?.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#0f172a] truncate">{team.manager?.name}</p>
                    <p className="text-xs text-[#94a3b8]">{team.manager?.department} · Manager</p>
                  </div>
                  <span className="text-xs font-semibold text-[#4f46e5] bg-indigo-50 px-2.5 py-1 rounded-full">
                    {team.memberCount} member{team.memberCount !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Members */}
                {(!team.members || team.members.length === 0) && (
                  <div className="px-5 py-4 text-xs text-[#94a3b8] italic">No team members yet.</div>
                )}
                {team.members?.map((member, mi) => (
                  <div key={member._id ?? mi} className="flex items-center gap-3 px-5 py-3 border-b border-[#f8fafc] last:border-0 hover:bg-[#fafafa]">
                    <div className={`w-8 h-8 rounded-full ${avatarColor(member.name)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                      {getInitials(member.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0f172a] truncate">{member.name}</p>
                      <p className="text-xs text-[#94a3b8]">{member.department || "—"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(member._id, member.name)}
                      disabled={removingId === member._id}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium cursor-pointer border-0 bg-transparent disabled:opacity-40"
                    >
                      {removingId === member._id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <UserMinus size={13} />}
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* ── Right: Unassigned employees ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus size={16} className="text-amber-500" />
                <h3 className="text-sm font-bold text-[#0f172a]">
                  Unassigned Employees ({unassigned.length})
                </h3>
              </div>
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-7 pr-3 py-1.5 text-xs border border-[#e2e8f0] rounded-xl bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] w-32"
                />
              </div>
            </div>

            {filteredUnassigned.length === 0 && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 text-center">
                <CheckCircle size={28} className="text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-[#94a3b8]">
                  {search ? "No match found." : "All employees are assigned!"}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {filteredUnassigned.map((emp, ei) => (
                <div key={emp._id ?? ei} className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm px-5 py-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-full ${avatarColor(emp.name)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                      {getInitials(emp.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0f172a] truncate">{emp.name}</p>
                      <p className="text-xs text-[#94a3b8]">{emp.department || "—"} · {emp.role}</p>
                    </div>
                  </div>

                  {/* Assign row */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        value={selectedManager[emp._id] ?? ""}
                        onChange={e => setSelectedManager(prev => ({ ...prev, [emp._id]: e.target.value }))}
                        className="w-full appearance-none border border-[#e2e8f0] rounded-xl px-3 py-2 pr-8 text-xs text-[#0f172a] bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] cursor-pointer"
                      >
                        <option value="">Select manager…</option>
                        {managers.map((m, mi) => (
                          <option key={m._id ?? mi} value={m._id}>{m.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAssign(emp._id)}
                      disabled={!selectedManager[emp._id] || assigningId === emp._id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#4f46e5] text-white text-xs font-semibold rounded-xl border-0 cursor-pointer hover:bg-[#4338ca] transition-colors disabled:opacity-40"
                    >
                      {assigningId === emp._id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <UserPlus size={12} />}
                      Assign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
