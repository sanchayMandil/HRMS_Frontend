import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials, logout } from "../features/auth/authSlice";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function fetchMe(token) {
  const res = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include"
  });
  if (!res.ok) throw new Error("invalid");
  const data = await res.json();
  return data.user;
}

async function fetchRefresh() {
  const res = await fetch(`${API}/auth/refresh`, {
    method: "POST",
    credentials: "include"  // sends the refresh token cookie
  });
  if (!res.ok) throw new Error("refresh_failed");
  const data = await res.json();
  return data.accessToken;
}

export default function AuthBootstrap({ children }) {
  const [ready, setReady] = useState(false);
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setReady(true);
        return;
      }

      try {
        // 1. Token exists — verify it's still valid
        const user = await fetchMe(token);
        dispatch(setCredentials({ token, user }));
      } catch {
        // 2. Token expired — try the refresh token cookie
        try {
          const newToken = await fetchRefresh();
          const user = await fetchMe(newToken);
          dispatch(setCredentials({ token: newToken, user }));
        } catch {
          // 3. Refresh also failed — clear everything, force re-login
          dispatch(logout());
        }
      } finally {
        setReady(true);
      }
    };

    bootstrap();
  }, []); // runs once on mount

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
