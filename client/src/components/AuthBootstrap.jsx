import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setCredentials, logout } from "../features/auth/authSlice";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function AuthBootstrap({ children }) {
  const [ready, setReady] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => dispatch(setCredentials({ user: data.user })))
      .catch(() => dispatch(logout()))
      .finally(() => setReady(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f1f5f9]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-[#4f46e5] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#64748b]">Loading…</p>
        </div>
      </div>
    );
  }

  return children;
}
