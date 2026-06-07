import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LayoutDashboard, Clock, Timer, FileBarChart,
  CheckSquare, Users, UsersRound, Network,
  LogOut, Building2, Settings, Menu, ChevronLeft
} from "lucide-react";
import { logout } from "../features/auth/authSlice";
import { api, useLogoutMutation } from "../app/api/baseApi";

// ─── Nav structure ────────────────────────────────────────────────────────────

const navGroups = [
  {
    label: "Workspace",
    items: [
      { to: "/",           label: "Overview",   icon: LayoutDashboard, end: true, roles: [] },
      { to: "/attendance", label: "Attendance",  icon: Clock,           roles: [] },
      { to: "/overtime",   label: "Overtime",    icon: Timer,           roles: ["employee", "manager"] },
      { to: "/reports",    label: "Reports",     icon: FileBarChart,    roles: [] },
    ]
  },
  {
    label: "Team",
    items: [
      { to: "/team",      label: "My Team",   icon: UsersRound,  roles: ["manager"] },
      { to: "/approvals", label: "Approvals", icon: CheckSquare, roles: ["manager", "admin"] },
    ]
  },
  {
    label: "Admin",
    items: [
      { to: "/users",    label: "Users",    icon: Users,    roles: ["admin"] },
      { to: "/teams",    label: "Teams",    icon: Network,  roles: ["admin"] },
      { to: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
    ]
  }
];

const pageTitles = {
  "/":           "Overview",
  "/attendance": "Attendance",
  "/overtime":   "Overtime",
  "/reports":    "Reports",
  "/approvals":  "Approvals",
  "/team":       "My Team",
  "/users":      "User Management",
  "/teams":      "Team Management",
  "/settings":   "Settings"
};

function getInitials(name = "") {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Tooltip wrapper (collapsed mode) ────────────────────────────────────────

function Tip({ label, children }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
                      opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150">
        <div className="bg-[#1e293b] text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
          {label}
        </div>
        {/* arrow */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1e293b]" />
      </div>
    </div>
  );
}

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({ user, collapsed, onNav }) {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const [logoutApi] = useLogoutMutation();

  const handleLogout = async () => {
    try { await logoutApi().unwrap(); } catch (_) {}
    dispatch(logout());
    dispatch(api.util.resetApiState());
    navigate("/login");
  };

  const visibleGroups = navGroups
    .map(g => ({
      ...g,
      items: g.items.filter(i => i.roles.length === 0 || i.roles.includes(user?.role))
    }))
    .filter(g => g.items.length > 0);

  return (
    <div className="flex flex-col h-full">

      {/* Brand */}
      <div className={`border-b border-white/10 flex items-center gap-3 shrink-0 transition-all duration-200 ${
        collapsed ? "px-0 py-5 justify-center" : "px-5 py-5"
      }`}>
        <div className="w-9 h-9 rounded-xl bg-[#4f46e5] flex items-center justify-center shrink-0">
          <Building2 size={17} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0 overflow-hidden">
            <p className="text-[10px] font-semibold text-white/40 tracking-widest uppercase leading-none mb-0.5">HRMS</p>
            <h1 className="text-sm font-bold text-white leading-none truncate">Attendance Hub</h1>
          </div>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-5 overflow-x-hidden">
        {visibleGroups.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-4 mb-1.5 text-[10px] font-semibold tracking-widest text-white/25 uppercase">
                {group.label}
              </p>
            )}
            {collapsed && <div className="mx-3 mb-1.5 h-px bg-white/10" />}

            <div className={`space-y-0.5 ${collapsed ? "px-2" : "px-3"}`}>
              {group.items.map(({ to, label, icon: Icon, end }) => {
                const linkCls = ({ isActive }) =>
                  `flex items-center gap-3 rounded-xl text-sm font-medium transition-all no-underline ${
                    collapsed ? "justify-center w-10 h-10 mx-auto" : "px-3 py-2.5"
                  } ${
                    isActive
                      ? "bg-[#4f46e5] text-white shadow-md shadow-[#4f46e5]/30"
                      : "text-white/55 hover:text-white hover:bg-white/8"
                  }`;

                return collapsed ? (
                  <Tip key={to} label={label}>
                    <NavLink to={to} end={end} onClick={onNav} className={linkCls}>
                      <Icon size={17} />
                    </NavLink>
                  </Tip>
                ) : (
                  <NavLink key={to} to={to} end={end} onClick={onNav} className={linkCls}>
                    <Icon size={16} />
                    {label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div className={`pt-3 pb-4 border-t border-white/10 space-y-1 ${collapsed ? "px-2" : "px-3"}`}>
        {collapsed ? (
          <Tip label={`${user?.name} (${user?.role})`}>
            <div className="w-10 h-10 rounded-full bg-[#4f46e5] flex items-center justify-center text-xs font-bold text-white mx-auto cursor-default">
              {getInitials(user?.name)}
            </div>
          </Tip>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[#4f46e5] flex items-center justify-center text-xs font-bold text-white shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-snug">{user?.name}</p>
              <p className="text-xs text-white/40 capitalize">{user?.role}</p>
            </div>
          </div>
        )}

        {collapsed ? (
          <Tip label="Sign out">
            <button
              onClick={handleLogout} type="button"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/8 transition-all cursor-pointer border-0 bg-transparent mx-auto"
            >
              <LogOut size={16} />
            </button>
          </Tip>
        ) : (
          <button
            onClick={handleLogout} type="button"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/8 transition-all cursor-pointer border-0 bg-transparent"
          >
            <LogOut size={16} />
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function Layout() {
  const location = useLocation();
  const user     = useSelector(state => state.auth.user);

  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebar_collapsed") === "true"
  );

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      localStorage.setItem("sidebar_collapsed", String(!prev));
      return !prev;
    });
  };

  const pageTitle = pageTitles[location.pathname] || "Dashboard";

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden">

      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden lg:flex flex-col bg-[#0f1729] text-white shrink-0 relative transition-all duration-200 ${
          collapsed ? "w-[68px]" : "w-60"
        }`}
      >
        <SidebarContent user={user} collapsed={collapsed} onNav={() => {}} />

        {/* Collapse toggle button */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-white border border-[#e2e8f0] shadow-sm flex items-center justify-center cursor-pointer hover:bg-[#f1f5f9] transition-colors z-10"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            size={13}
            className={`text-[#64748b] transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f1729] text-white flex flex-col transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent user={user} collapsed={false} onNav={() => setMobileOpen(false)} />
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="shrink-0 bg-white border-b border-[#e2e8f0] px-5 lg:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#64748b] hover:bg-[#f1f5f9] border-0 bg-transparent cursor-pointer shrink-0"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#0f172a] leading-tight">{pageTitle}</h2>
              <p className="text-xs text-[#94a3b8] mt-0.5 hidden sm:block">
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="bg-[#ede9fe] text-[#4f46e5] text-xs font-semibold px-3 py-1.5 rounded-full capitalize">
              {user?.role}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#4f46e5] flex items-center justify-center text-xs font-bold text-white shrink-0">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
