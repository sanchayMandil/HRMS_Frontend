import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Users, Clock, Timer, FileBarChart, CheckSquare, ArrowRight } from "lucide-react";

const actionsByRole = {
  employee: [
    { title: "Punch In / Out", desc: "Record your attendance with selfie + GPS location", to: "/attendance", icon: Clock, accent: "text-blue-600 bg-blue-50" },
    { title: "Request Overtime", desc: "Submit an overtime request for approval", to: "/overtime", icon: Timer, accent: "text-amber-600 bg-amber-50" },
    { title: "View Reports", desc: "Check your personal attendance history", to: "/reports", icon: FileBarChart, accent: "text-purple-600 bg-purple-50" }
  ],
  manager: [
    { title: "Team Attendance", desc: "Monitor your team's punch-in/out status", to: "/reports", icon: Clock, accent: "text-blue-600 bg-blue-50" },
    { title: "Overtime Approvals", desc: "Review and approve pending OT requests", to: "/approvals", icon: CheckSquare, accent: "text-emerald-600 bg-emerald-50" },
    { title: "Reports", desc: "View team-wide attendance reports", to: "/reports", icon: FileBarChart, accent: "text-purple-600 bg-purple-50" }
  ],
  admin: [
    { title: "User Management", desc: "Create, update, and manage user accounts & roles", to: "/users", icon: Users, accent: "text-blue-600 bg-blue-50" },
    { title: "All Attendance", desc: "View and validate system-wide attendance records", to: "/reports", icon: Clock, accent: "text-emerald-600 bg-emerald-50" },
    { title: "OT Approvals", desc: "Manage overtime requests across all departments", to: "/approvals", icon: CheckSquare, accent: "text-amber-600 bg-amber-50" },
    { title: "Daily Reports", desc: "Generate and export system-wide daily reports", to: "/reports", icon: FileBarChart, accent: "text-purple-600 bg-purple-50" }
  ]
};

export default function OverviewPage() {
  const user = useSelector((state) => state.auth.user);
  const role = user?.role || "employee";
  const actions = actionsByRole[role] || actionsByRole.employee;

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] rounded-2xl p-6 text-white">
        <p className="text-sm font-medium text-white/70 mb-1">Good day,</p>
        <h2 className="text-2xl font-bold">{user?.name || "User"} 👋</h2>
        <p className="text-sm text-white/60 mt-1 capitalize">
          {role} · {user?.department || "Attendance Hub"}
        </p>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-[#64748b] uppercase tracking-wider mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.to}
                className="group bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-md hover:border-[#c7d2fe] transition-all no-underline flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl ${action.accent} flex items-center justify-center`}>
                    <Icon size={18} />
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-[#cbd5e1] group-hover:text-brand group-hover:translate-x-0.5 transition-all"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#0f172a]">{action.title}</h4>
                  <p className="text-xs text-[#64748b] mt-0.5 leading-relaxed">{action.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
