import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials, logout } from "../../features/auth/authSlice";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  }
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    // Try a silent refresh using the HTTP-only refresh cookie
    const refreshResult = await rawBaseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Store the new access token and retry the original request
      api.dispatch(setCredentials({
        user: refreshResult.data.user,
        token: refreshResult.data.accessToken
      }));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      // Refresh failed — session fully expired
      api.dispatch(logout());
      window.location.href = "/login";
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth", "Attendance", "Overtime", "Users", "Reports", "Settings"],
  endpoints: (builder) => ({

    // ── Auth ──────────────────────────────────────────────────────────────
    login: builder.mutation({
      query: (credentials) => ({ url: "/auth/login", method: "POST", body: credentials })
    }),
    register: builder.mutation({
      query: (payload) => ({ url: "/auth/register", method: "POST", body: payload })
    }),
    logout: builder.mutation({
      query: () => ({ url: "/auth/logout", method: "POST" })
    }),
    refreshToken: builder.mutation({
      query: () => ({ url: "/auth/refresh", method: "POST" })
    }),
    getProfile: builder.query({
      query: () => "/auth/me",
      providesTags: ["Auth"]
    }),

    // ── Attendance — employee ─────────────────────────────────────────────

    // GET /attendance/today — logged-in user's record for today
    getTodayAttendance: builder.query({
      query: () => "/attendance/today",
      providesTags: ["Attendance"]
    }),

    // GET /attendance/me?month=2026-06 — own history, optional month filter
    getMyAttendance: builder.query({
      query: (month) => `/attendance/me${month ? `?month=${month}` : ""}`,
      providesTags: ["Attendance"]
    }),

    // POST /attendance/punch-in
    punchIn: builder.mutation({
      query: (payload) => ({ url: "/attendance/punch-in", method: "POST", body: payload }),
      invalidatesTags: ["Attendance"]
    }),

    // POST /attendance/punch-out
    punchOut: builder.mutation({
      query: (payload) => ({ url: "/attendance/punch-out", method: "POST", body: payload }),
      invalidatesTags: ["Attendance"]
    }),

    // ── Attendance — admin + manager ──────────────────────────────────────

    // GET /attendance — paginated, all filters
    getAllAttendance: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams();
        if (params.month)            qs.set("month", params.month);
        if (params.date)             qs.set("date", params.date);
        if (params.userId)           qs.set("userId", params.userId);
        if (params.department)       qs.set("department", params.department);
        if (params.status)           qs.set("status", params.status);
        if (params.validationStatus) qs.set("validationStatus", params.validationStatus);
        if (params.page)             qs.set("page", params.page);
        if (params.limit)            qs.set("limit", params.limit);
        const q = qs.toString();
        return `/attendance${q ? `?${q}` : ""}`;
      },
      providesTags: ["Attendance"]
    }),

    // PATCH /attendance/:id/validate
    validateAttendance: builder.mutation({
      query: ({ id, validationStatus, remarks }) => ({
        url: `/attendance/${id}/validate`,
        method: "PATCH",
        body: { validationStatus, remarks }
      }),
      invalidatesTags: ["Attendance"]
    }),

    // ── Attendance — admin only ───────────────────────────────────────────

    // GET /attendance/admin/summary?month=2026-06
    getMonthlySummary: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams();
        if (params.month)      qs.set("month", params.month);
        if (params.userId)     qs.set("userId", params.userId);
        if (params.department) qs.set("department", params.department);
        return `/attendance/admin/summary?${qs.toString()}`;
      },
      providesTags: ["Attendance"]
    }),

    // GET /attendance/admin/absent?date=2026-06-07
    getAbsentEmployees: builder.query({
      query: (date) => `/attendance/admin/absent?date=${date}`,
      providesTags: ["Attendance"]
    }),

    // POST /attendance/admin/manual
    createManualAttendance: builder.mutation({
      query: (payload) => ({ url: "/attendance/admin/manual", method: "POST", body: payload }),
      invalidatesTags: ["Attendance"]
    }),

    // PATCH /attendance/admin/bulk-validate
    bulkValidateAttendance: builder.mutation({
      query: (payload) => ({ url: "/attendance/admin/bulk-validate", method: "PATCH", body: payload }),
      invalidatesTags: ["Attendance"]
    }),

    // PATCH /attendance/:id — edit a record
    editAttendance: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/attendance/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Attendance"]
    }),

    // DELETE /attendance/:id
    deleteAttendance: builder.mutation({
      query: (id) => ({ url: `/attendance/${id}`, method: "DELETE" }),
      invalidatesTags: ["Attendance"]
    }),

    // ── Overtime ──────────────────────────────────────────────────────────

    // POST /overtime — all roles
    submitOvertime: builder.mutation({
      query: (payload) => ({ url: "/overtime", method: "POST", body: payload }),
      invalidatesTags: ["Overtime"]
    }),

    // GET /overtime/my?status=&month= — own history
    getMyOvertime: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams();
        if (params.status) qs.set("status", params.status);
        if (params.month)  qs.set("month", params.month);
        const q = qs.toString();
        return `/overtime/my${q ? `?${q}` : ""}`;
      },
      providesTags: ["Overtime"]
    }),

    // DELETE /overtime/:id — cancel own pending request
    cancelOvertime: builder.mutation({
      query: (id) => ({ url: `/overtime/${id}`, method: "DELETE" }),
      invalidatesTags: ["Overtime"]
    }),

    // GET /overtime?status=&month=&date=&userId= — admin + manager
    getAllOvertime: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams();
        if (params.status) qs.set("status", params.status);
        if (params.month)  qs.set("month", params.month);
        if (params.date)   qs.set("date", params.date);
        if (params.userId) qs.set("userId", params.userId);
        const q = qs.toString();
        return `/overtime${q ? `?${q}` : ""}`;
      },
      providesTags: ["Overtime"]
    }),

    // GET /overtime/:id
    getOvertimeById: builder.query({
      query: (id) => `/overtime/${id}`,
      providesTags: ["Overtime"]
    }),

    // PATCH /overtime/:id/review — admin + manager
    reviewOvertime: builder.mutation({
      query: ({ id, status, reviewNote, approvedHours }) => ({
        url: `/overtime/${id}/review`,
        method: "PATCH",
        body: { status, reviewNote, approvedHours }
      }),
      invalidatesTags: ["Overtime"]
    }),

    // ── Users / Teams ─────────────────────────────────────────────────────

    // GET /users/teams — all managers + members + unassigned (admin)
    getAllTeams: builder.query({
      query: () => "/users/teams",
      providesTags: ["Users"]
    }),

    // GET /users/my-team — manager sees own team
    getMyTeam: builder.query({
      query: () => "/users/my-team",
      providesTags: ["Users"]
    }),

    // PATCH /users/:id/assign-manager
    assignManager: builder.mutation({
      query: ({ userId, managerId }) => ({
        url: `/users/${userId}/assign-manager`,
        method: "PATCH",
        body: { managerId }
      }),
      invalidatesTags: ["Users"]
    }),

    // DELETE /users/:id/assign-manager
    removeFromTeam: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}/assign-manager`,
        method: "DELETE"
      }),
      invalidatesTags: ["Users"]
    }),

    // ── Users ─────────────────────────────────────────────────────────────
    getUsers: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams();
        if (params.role)       qs.set("role", params.role);
        if (params.department) qs.set("department", params.department);
        if (params.search)     qs.set("search", params.search);
        const q = qs.toString();
        return `/users${q ? `?${q}` : ""}`;
      },
      providesTags: ["Users"]
    }),
    updateUserRole: builder.mutation({
      query: ({ id, role }) => ({ url: `/users/${id}/role`, method: "PATCH", body: { role } }),
      invalidatesTags: ["Users"]
    }),

    // ── Reports ───────────────────────────────────────────────────────────
    getReports: builder.query({
      query: (params = "") => `/reports/daily${params ? `?${params}` : ""}`,
      providesTags: ["Reports"]
    }),

    // GET /attendance/missed-punch?date=YYYY-MM-DD — employees with punchIn but no punchOut
    getMissedPunch: builder.query({
      query: (date) => `/attendance/missed-punch${date ? `?date=${date}` : ""}`,
      providesTags: ["Attendance"]
    }),

    // POST /attendance/team/mark-absent — admin + manager
    markAbsent: builder.mutation({
      query: (payload) => ({ url: "/attendance/team/mark-absent", method: "POST", body: payload }),
      invalidatesTags: ["Attendance"]
    }),

    // PATCH /attendance/:id/day-type — admin + manager
    setDayType: builder.mutation({
      query: ({ id, dayType }) => ({ url: `/attendance/${id}/day-type`, method: "PATCH", body: { dayType } }),
      invalidatesTags: ["Attendance"]
    }),

    // GET /reports/attendance — role-scoped attendance report with selfie + location
    getAttendanceReport: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams();
        if (params.date)             qs.set("date", params.date);
        if (params.month)            qs.set("month", params.month);
        if (params.userId)           qs.set("userId", params.userId);
        if (params.status)           qs.set("status", params.status);
        if (params.validationStatus) qs.set("validationStatus", params.validationStatus);
        const q = qs.toString();
        return `/reports/attendance${q ? `?${q}` : ""}`;
      },
      providesTags: ["Reports"]
    }),

    // ── Dashboard ─────────────────────────────────────────────────────────
    getDashboard: builder.query({
      query: () => "/dashboard",
      providesTags: ["Attendance", "Overtime"]
    }),

    // ── Health ────────────────────────────────────────────────────────────
    getHealth: builder.query({
      query: () => "/health"
    }),

    // ── Settings ──────────────────────────────────────────────────────────
    getOfficeLocation: builder.query({
      query: () => "/settings/office",
      providesTags: ["Settings"]
    }),
    setOfficeLocation: builder.mutation({
      query: (payload) => ({ url: "/settings/office", method: "PUT", body: payload }),
      invalidatesTags: ["Settings"]
    })
  })
});

export const {
  // auth
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetProfileQuery,
  // attendance — employee
  useGetTodayAttendanceQuery,
  useGetMyAttendanceQuery,
  usePunchInMutation,
  usePunchOutMutation,
  // attendance — admin + manager
  useGetAllAttendanceQuery,
  useValidateAttendanceMutation,
  // attendance — admin
  useGetMonthlySummaryQuery,
  useGetAbsentEmployeesQuery,
  useCreateManualAttendanceMutation,
  useBulkValidateAttendanceMutation,
  useEditAttendanceMutation,
  useDeleteAttendanceMutation,
  // overtime
  useSubmitOvertimeMutation,
  useGetMyOvertimeQuery,
  useCancelOvertimeMutation,
  useGetAllOvertimeQuery,
  useReviewOvertimeMutation,
  // users / teams
  useGetAllTeamsQuery,
  useGetMyTeamQuery,
  useAssignManagerMutation,
  useRemoveFromTeamMutation,
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  // dashboard
  useGetDashboardQuery,
  // health
  useGetHealthQuery,
  // reports
  useGetReportsQuery,
  useGetMissedPunchQuery,
  useGetAttendanceReportQuery,
  useMarkAbsentMutation,
  useSetDayTypeMutation,
  // settings
  useGetOfficeLocationQuery,
  useSetOfficeLocationMutation
} = api;
