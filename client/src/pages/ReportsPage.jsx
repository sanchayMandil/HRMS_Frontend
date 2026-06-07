import { FileBarChart, Users } from "lucide-react";
import { useSelector } from "react-redux";
import { useGetReportsQuery, useGetTeamAttendanceQuery } from "../app/api/baseApi";

function DataPanel({ title, icon: Icon, data, isLoading, accentClass }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accentClass}`}>
          <Icon size={16} />
        </div>
        <h3 className="text-base font-semibold text-[#0f172a]">{title}</h3>
      </div>
      {isLoading ? (
        <p className="text-sm text-[#64748b]">Loading…</p>
      ) : (
        <pre className="text-xs text-[#475569] overflow-auto whitespace-pre-wrap bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0] max-h-96 font-mono">
          {JSON.stringify(data ?? [], null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const role = useSelector((state) => state.auth.user?.role || "employee");
  const { data: reports, isLoading: isLoadingReports } = useGetReportsQuery();
  const { data: teamData, isLoading: isLoadingTeam } = useGetTeamAttendanceQuery(undefined, {
    skip: role === "employee"
  });

  return (
    <div className="space-y-6">
      <DataPanel
        title="Daily Report"
        icon={FileBarChart}
        data={reports}
        isLoading={isLoadingReports}
        accentClass="bg-purple-100 text-purple-600"
      />
      {role !== "employee" && (
        <DataPanel
          title="Team Attendance"
          icon={Users}
          data={teamData}
          isLoading={isLoadingTeam}
          accentClass="bg-blue-100 text-blue-600"
        />
      )}
    </div>
  );
}
