import { useState } from "react";
import { Search, SlidersHorizontal, Save } from "lucide-react";
import { useSelector } from "react-redux";
import { useGetUsersQuery, useUpdateUserRoleMutation } from "../app/api/baseApi";

const ROLES = ["admin", "manager", "employee"];

const roleStyle = {
  admin: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  employee: "bg-slate-100 text-slate-600"
};

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const avatarColor = [
  "bg-[#4f46e5]", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"
];

export default function UsersPage() {
  const [filters, setFilters] = useState({ search: "", role: "", department: "" });
  const [pendingRoles, setPendingRoles] = useState({});

  const currentUserId = useSelector((state) => state.auth.user?._id);

  const { data, isLoading, error, isFetching } = useGetUsersQuery(filters);
  const [updateRole, { isLoading: isUpdating }] = useUpdateUserRoleMutation();

  const users = (data?.users ?? []).filter((u) => u._id !== currentUserId);

  const handleRoleSave = async (userId) => {
    const newRole = pendingRoles[userId];
    if (!newRole) return;
    try {
      await updateRole({ id: userId, role: newRole }).unwrap();
      setPendingRoles((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    } catch (_) {}
  };

  const inputClass =
    "border border-[#e2e8f0] rounded-xl px-4 py-2.5 bg-white text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] transition-colors w-full";

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-[#64748b]" />
            <h3 className="text-sm font-semibold text-[#0f172a]">
              Filters
              {users.length > 0 && (
                <span className="ml-2 text-[#94a3b8] font-normal">— {users.length} other users</span>
              )}
            </h3>
            {isFetching && (
              <span className="text-xs text-[#94a3b8] animate-pulse">Refreshing…</span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              className="border border-[#e2e8f0] rounded-xl pl-9 pr-4 py-2.5 bg-white text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] transition-colors w-full"
              placeholder="Search name or email…"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <select
            className={inputClass}
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            placeholder="Filter by department…"
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          />
        </div>
      </div>

      {/* States */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 text-center text-[#64748b] text-sm">
          Loading users…
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">
          {error?.data?.message || "Failed to load users."}
        </div>
      )}
      {!isLoading && !error && users.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 text-center text-[#94a3b8] text-sm">
          No users match your filters.
        </div>
      )}

      {/* User table */}
      {users.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-[#f1f5f9] bg-[#f8fafc]">
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">User</p>
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Status</p>
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Current Role</p>
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Change Role</p>
          </div>

          {/* Rows */}
          {users.map((user, idx) => {
            const pendingRole = pendingRoles[user._id];
            const displayRole = pendingRole ?? user.role;
            const isDirty = pendingRole !== undefined && pendingRole !== user.role;
            const colorClass = avatarColor[idx % avatarColor.length];

            return (
              <div
                key={user._id}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-6 py-4 border-b border-[#f1f5f9] last:border-0 hover:bg-[#fafafa] transition-colors"
              >
                {/* User info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full ${colorClass} flex items-center justify-center text-xs font-bold text-white shrink-0`}
                  >
                    {getInitials(user.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0f172a] truncate">{user.name}</p>
                    <p className="text-xs text-[#64748b] truncate">{user.email}</p>
                    {user.department && (
                      <p className="text-xs text-[#94a3b8]">{user.department}</p>
                    )}
                  </div>
                </div>

                {/* Active status */}
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                    user.isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>

                {/* Current role badge */}
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize whitespace-nowrap ${
                    roleStyle[user.role] || roleStyle.employee
                  }`}
                >
                  {user.role}
                </span>

                {/* Role editor */}
                <div className="flex items-center gap-2">
                  <select
                    className="border border-[#e2e8f0] rounded-lg px-3 py-1.5 bg-white text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 cursor-pointer"
                    value={displayRole}
                    onChange={(e) =>
                      setPendingRoles((prev) => ({ ...prev, [user._id]: e.target.value }))
                    }
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </option>
                    ))}
                  </select>
                  {isDirty && (
                    <button
                      className="flex items-center gap-1.5 bg-[#4f46e5] text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer border-0 hover:bg-[#4338ca] transition-colors disabled:opacity-50 whitespace-nowrap"
                      disabled={isUpdating}
                      onClick={() => handleRoleSave(user._id)}
                      type="button"
                    >
                      <Save size={11} />
                      {isUpdating ? "…" : "Save"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
