import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LayoutDashboard,
  Clock,
  Timer,
  FileBarChart,
  CheckSquare,
  Users,
  LogOut,
  Building2
} from "lucide-react";
import { logout } from "../features/auth/authSlice";
import { useLogoutMutation } from "../app/api/baseApi";

const allNavItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true, roles: [] },
  { to: "/attendance", label: "Attendance", icon: Clock, roles: [] },
  { to: "/overtime", label: "Overtime", icon: Timer, roles: ["employee", "manager"] },
  { to: "/reports", label: "Reports", icon: FileBarChart, roles: [] },
  { to: "/approvals", label: "Approvals", icon: CheckSquare, roles: ["manager", "admin"] },
  { to: "/users", label: "Users", icon: Users, roles: ["admin"] }
];

const pageTitles = {
  "/": "Overview",
  "/attendance": "Attendance",
  "/overtime": "Overtime",
  "/reports": "Reports",
  "/approvals": "Approvals",
  "/users": "User Management"
};

function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const [logoutApi] = useLogoutMutation();

  const navItems = allNavItems.filter(
    (item) => item.roles.length === 0 || item.roles.includes(user?.role)
  );

  const pageTitle = pageTitles[location.pathname] || "Dashboard";

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch (_) {}
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 flex flex-col bg-[#0f1729] text-white">
        {/* Brand */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/50 leading-none mb-0.5 tracking-widest uppercase">
                HRMS
              </p>
              <h1 className="text-sm font-bold text-white leading-none">Attendance Hub</h1>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          <p className="px-3 pb-2 text-[10px] font-semibold tracking-widest text-white/30 uppercase">
            Navigation
          </p>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all no-underline ${
                  isActive
                    ? "bg-brand text-white shadow-lg shadow-brand/30"
                    : "text-white/60 hover:text-white hover:bg-white/8"
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-3 pb-4 border-t border-white/10 pt-4 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-white shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-white/40 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-all cursor-pointer border-0 bg-transparent"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="shrink-0 bg-white border-b border-[#e2e8f0] px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a]">{pageTitle}</h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-[#e0e7ff] text-brand text-xs font-semibold px-3 py-1.5 rounded-full capitalize tracking-wide">
              {user?.role}
            </span>
            <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-white">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
