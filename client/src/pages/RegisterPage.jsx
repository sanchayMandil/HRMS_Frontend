import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Building2, Mail, Lock, User, Briefcase, ShieldCheck, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useRegisterMutation } from "../app/api/baseApi";
import { setCredentials } from "../features/auth/authSlice";

const DEPARTMENTS = [
  "Engineering", "Marketing", "Sales", "Human Resources",
  "Finance", "Operations", "Design", "Product", "Legal", "Customer Support"
];

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [register, { isLoading, error }] = useRegisterMutation();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", department: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) { setPasswordError("Passwords do not match."); return; }
    setPasswordError("");
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role: "employee" };
      if (form.department) payload.department = form.department;
      const result = await register(payload).unwrap();
      dispatch(setCredentials({ user: result.user, token: result.accessToken }));
      navigate("/");
    } catch (_) {}
  };

  const serverError = error?.data?.message ?? (error ? "Registration failed. Please try again." : null);
  const ic = "w-full pl-9 pr-4 py-2 border border-[#e2e8f0] rounded-lg bg-white text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] transition-colors";
  const icon = "absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]";

  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const passwordsMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[38%] bg-gradient-to-br from-[#0f1729] to-[#1e3a6e] flex-col justify-between p-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#4f46e5] flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-white/40 tracking-widest uppercase">HRMS</p>
            <p className="text-sm font-bold text-white">Attendance Hub</p>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white leading-snug mb-3">
            Join your team on<br />
            <span className="text-[#818cf8]">Attendance Hub.</span>
          </h2>
          <p className="text-white/50 text-xs leading-relaxed">
            Set up your account and start managing attendance, overtime, and reports from day one.
          </p>
        </div>
        <p className="text-[11px] text-white/25">
          All accounts start as Employee. Admin can assign higher roles.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc] p-6">
        <div className="w-full max-w-sm">
          <div className="mb-5">
            <h1 className="text-xl font-bold text-[#0f172a]">Create your account</h1>
            <p className="text-xs text-[#64748b] mt-0.5">Fill in your details to get started</p>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            {/* Name + Email side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#0f172a] block mb-1">Full name</label>
                <div className="relative">
                  <User size={13} className={icon} />
                  <input className={ic} placeholder="John Doe" required value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#0f172a] block mb-1">Email</label>
                <div className="relative">
                  <Mail size={13} className={icon} />
                  <input className={ic} placeholder="you@co.com" required type="email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Password + Confirm side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#0f172a] block mb-1">Password</label>
                <div className="relative">
                  <Lock size={13} className={icon} />
                  <input className={ic + " pr-8"} minLength={6} placeholder="Min 6 chars" required
                    type={showPassword ? "text" : "password"} value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] border-0 bg-transparent cursor-pointer p-0">
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#0f172a] block mb-1">Confirm</label>
                <div className="relative">
                  <Lock size={13} className={icon} />
                  <input
                    className={ic + " pr-8 " + (passwordsMismatch ? "border-red-400 focus:border-red-400" : passwordsMatch ? "border-emerald-400 focus:border-emerald-400" : "")}
                    placeholder="Re-enter" required type={showConfirm ? "text" : "password"} value={form.confirmPassword}
                    onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setPasswordError(""); }} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] border-0 bg-transparent cursor-pointer p-0">
                    {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {passwordsMismatch && <p className="text-[10px] text-red-500 mt-0.5">Don't match</p>}
                {passwordsMatch && <p className="text-[10px] text-emerald-600 mt-0.5">Passwords match ✓</p>}
              </div>
            </div>

            {/* Department + Role side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#0f172a] block mb-1">
                  Department <span className="text-[#94a3b8] font-normal">(opt.)</span>
                </label>
                <div className="relative">
                  <Briefcase size={13} className={icon} />
                  <select className={ic + " appearance-none cursor-pointer"} value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}>
                    <option value="">Select…</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#0f172a] block mb-1">Role</label>
                <div className="relative">
                  <ShieldCheck size={13} className={icon} />
                  <div className="w-full pl-9 pr-3 py-2 border border-[#e2e8f0] rounded-lg bg-[#f8fafc] text-[#64748b] text-sm flex items-center justify-between">
                    <span className="text-xs">Employee</span>
                    <span className="text-[10px] bg-[#e0e7ff] text-[#4f46e5] px-1.5 py-0.5 rounded-full font-medium">Default</span>
                  </div>
                </div>
              </div>
            </div>

            {(passwordError || serverError) && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="text-xs text-red-600">{passwordError || serverError}</p>
              </div>
            )}

            <button
              className="w-full flex items-center justify-center gap-2 bg-[#4f46e5] text-white rounded-lg py-2.5 text-sm font-semibold cursor-pointer border-0 hover:bg-[#4338ca] transition-colors disabled:opacity-50"
              disabled={isLoading || passwordsMismatch}
              type="submit"
            >
              {isLoading ? "Creating account…" : "Create account"}
              {!isLoading && <ArrowRight size={15} />}
            </button>
          </form>

          <p className="text-xs text-center text-[#64748b] mt-4">
            Already have an account?{" "}
            <Link className="text-[#4f46e5] font-semibold hover:underline" to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
