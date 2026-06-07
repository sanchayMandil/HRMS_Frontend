import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./routes/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OverviewPage from "./pages/OverviewPage";
import AttendancePage from "./pages/attendance/AttendancePage";
import OvertimePage from "./pages/OvertimePage";
import ReportsPage from "./pages/ReportsPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import UsersPage from "./pages/UsersPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<OverviewPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="overtime" element={<OvertimePage />} />
          <Route path="reports" element={<ReportsPage />} />

          <Route element={<ProtectedRoute roles={["manager", "admin"]} />}>
            <Route path="approvals" element={<ApprovalsPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
