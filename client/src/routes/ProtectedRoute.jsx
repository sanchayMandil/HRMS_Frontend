import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ roles }) {
  const { token, user } = useSelector((state) => state.auth);

  if (!token) {
    return <Navigate replace to="/login" />;
  }

  if (roles?.length && !roles.includes(user?.role)) {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}
