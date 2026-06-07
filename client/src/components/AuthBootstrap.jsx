import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setCredentials, logout } from "../features/auth/authSlice";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const USER_KEY = "hrms_user";

export default function AuthBootstrap({ children }) {
  const [ready, setReady] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    fetch(`${API}/auth/refresh`, { method: "POST", credentials: "include" })
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => {
        // Backend may return just the token, or token + user
        const storedUser = JSON.parse(localStorage.getItem(USER_KEY) || "null");
        const user  = data.user  || storedUser;
        const token = data.accessToken || data.token;
        if (user && token) {
          dispatch(setCredentials({ user, token }));
        } else {
          dispatch(logout());
        }
      })
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
