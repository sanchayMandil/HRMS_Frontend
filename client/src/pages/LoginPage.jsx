import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Building2, Mail, Lock, ArrowRight } from "lucide-react";
import { useLoginMutation } from "../app/api/baseApi";
import { setCredentials } from "../features/auth/authSlice";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login, { isLoading, error }] = useLoginMutation();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const result = await login(form).unwrap();
      dispatch(setCredentials({ user: result.user }));
      navigate("/");
    } catch (_) {}
  };

  const errorMessage =
    error?.data?.message ?? (error ? "Invalid credentials. Please try again." : null);

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0f1729] to-[#1e3a6e] flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4f46e5] flex items-center justify-center">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 tracking-widest uppercase">HRMS</p>
            <p className="text-sm font-bold text-white">Attendance Hub</p>
          </div>
        </div>

        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage your workforce
            <br />
            <span className="text-[#818cf8]">smarter.</span>
          </h2>
          <p className="text-white/50 text-base leading-relaxed">
            Role-based attendance tracking, overtime management, and real-time reporting — all in one
            place.
          </p>
        </div>

        <div className="flex gap-6">
          {["Attendance Tracking", "Overtime Mgmt", "Role-Based Access"].map((feat) => (
            <div key={feat} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4f46e5]" />
              <p className="text-xs text-white/40">{feat}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc] p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#0f172a]">Welcome back</h1>
            <p className="text-sm text-[#64748b] mt-1">Sign in to your account to continue</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-[#0f172a] block mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  className="w-full pl-10 pr-4 py-3 border border-[#e2e8f0] rounded-xl bg-white text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] transition-colors"
                  placeholder="you@company.com"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#0f172a] block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  className="w-full pl-10 pr-4 py-3 border border-[#e2e8f0] rounded-xl bg-white text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] transition-colors"
                  placeholder="Your password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            )}

            <button
              className="w-full flex items-center justify-center gap-2 bg-[#4f46e5] text-white rounded-xl py-3 text-sm font-semibold cursor-pointer border-0 hover:bg-[#4338ca] transition-colors disabled:opacity-50 mt-2"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Signing in…" : "Sign in"}
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="text-sm text-center text-[#64748b] mt-6">
            Don't have an account?{" "}
            <Link className="text-[#4f46e5] font-semibold hover:underline" to="/register">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
