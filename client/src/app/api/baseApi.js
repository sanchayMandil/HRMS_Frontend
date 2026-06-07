import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ["Auth", "Attendance", "Overtime", "Users", "Reports"],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials
      })
    }),
    register: builder.mutation({
      query: (payload) => ({
        url: "/auth/register",
        method: "POST",
        body: payload
      })
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST"
      })
    }),
    refreshToken: builder.mutation({
      query: () => ({
        url: "/auth/refresh",
        method: "POST"
      })
    }),
    getProfile: builder.query({
      query: () => "/auth/me",
      providesTags: ["Auth"]
    }),
    getMyAttendance: builder.query({
      query: () => "/attendance/me",
      providesTags: ["Attendance"]
    }),
    getTeamAttendance: builder.query({
      query: () => "/attendance/team",
      providesTags: ["Attendance"]
    }),
    punchIn: builder.mutation({
      query: (payload) => ({
        url: "/attendance/punch-in",
        method: "POST",
        body: payload
      }),
      invalidatesTags: ["Attendance"]
    }),
    punchOut: builder.mutation({
      query: (payload) => ({
        url: "/attendance/punch-out",
        method: "POST",
        body: payload
      }),
      invalidatesTags: ["Attendance"]
    }),
    requestOvertime: builder.mutation({
      query: (payload) => ({
        url: "/overtime",
        method: "POST",
        body: payload
      }),
      invalidatesTags: ["Overtime", "Attendance"]
    }),
    getOvertimeRequests: builder.query({
      query: () => "/overtime",
      providesTags: ["Overtime"]
    }),
    getUsers: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams();
        if (params.role) qs.set("role", params.role);
        if (params.department) qs.set("department", params.department);
        if (params.search) qs.set("search", params.search);
        const query = qs.toString();
        return `/users${query ? `?${query}` : ""}`;
      },
      providesTags: ["Users"]
    }),
    updateUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/users/${id}/role`,
        method: "PATCH",
        body: { role }
      }),
      invalidatesTags: ["Users"]
    }),
    getReports: builder.query({
      query: (params = "") => `/reports/daily${params ? `?${params}` : ""}`,
      providesTags: ["Reports"]
    })
  })
});

export const {
  useGetMyAttendanceQuery,
  useGetOvertimeRequestsQuery,
  useGetProfileQuery,
  useGetReportsQuery,
  useGetTeamAttendanceQuery,
  useGetUsersQuery,
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  usePunchInMutation,
  usePunchOutMutation,
  useRegisterMutation,
  useRequestOvertimeMutation,
  useUpdateUserRoleMutation
} = api;
