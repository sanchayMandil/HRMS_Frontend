# HRMS — Implementation Log

What was required by the assessment PDF, what was built, and what was added beyond the spec.

---

## PDF Requirements vs. Implementation

### 1. Authentication & Authorization

| PDF Requirement | Status | Notes |
|----------------|--------|-------|
| User registration | ✅ Done | `/register` — name, email, password, optional department |
| User login | ✅ Done | `/login` — returns access token in body + sets HTTP-only refresh cookie |
| JWT-based auth | ✅ Done | Short-lived access token (Bearer) + long-lived refresh token (HttpOnly cookie) |
| Role-based access — Employee, Manager, Admin | ✅ Done | RBAC middleware on every protected route; frontend `ProtectedRoute` per role |
| Protected routes | ✅ Done | `ProtectedRoute.jsx` wraps all authenticated pages |
| Logout | ✅ Done | Clears cookies server-side, resets Redux + RTK Query cache |

**Extra beyond PDF:**
- **Access token in Redux memory only** — never written to `localStorage`. On page refresh, `AuthBootstrap` calls `POST /auth/refresh` using the HttpOnly cookie to get a fresh access token silently.
- **Automatic token refresh on 401** — `baseQueryWithReauth` in RTK Query intercepts any 401, calls `/auth/refresh` once, retries the original request with the new token. If refresh also fails (session fully expired), dispatches `logout()` and redirects to `/login`.
- **Vercel API proxy** — `client/vercel.json` rewrites `/api/*` to the Render backend, making all requests same-origin. Eliminates cross-domain `SameSite` cookie issues in production without any backend changes.

---

### 2. Attendance — Punch In / Punch Out

| PDF Requirement | Status | Notes |
|----------------|--------|-------|
| Punch in with selfie | ✅ Done | Live camera capture via `getUserMedia` — no file picker |
| Punch in with GPS location | ✅ Done | `navigator.geolocation` triggered automatically on camera open |
| Punch out | ✅ Done | Records punch-out time, calculates working hours |
| View own attendance history | ✅ Done | Employee sees own records with calendar + list |
| Manager/Admin view team/all records | ✅ Done | Filterable table with date, status, user, department filters |

**Extra beyond PDF:**
- **Geofencing** (listed as PDF bonus — fully implemented): punch blocked if employee is outside the configured office radius. Radius and coordinates set by admin in Settings.
- **Early exit reason**: prompt shown when punching out with < 8 hours worked. Reason is stored and shown in the validation drawer.
- **Next-day unblock**: an incomplete record from yesterday does not block today's punch-in.
- **Camera resource cleanup**: `video.srcObject` is explicitly set to `null` when the stream stops — releases the camera hardware and turns off the browser's camera indicator light immediately.
- **Attendance status logic** (`statusOf` helper — used consistently across all pages):
  - `Completed` → ≥ 8 hours
  - `Incomplete` → < 8 hours, not validated as Half Day
  - `Half Day` → < 8 hours, validated as Half Day by manager/admin
  - `Absent` → no punch-in OR record marked invalid
  - `Checked In` → punched in, not yet punched out
- **Attendance calendar** on employee dashboard: colour-coded dot per day, click for day details.

---

### 3. Attendance Validation

| PDF Requirement | Status | Notes |
|----------------|--------|-------|
| Manager can validate attendance records | ✅ Done | Slide-out drawer per record |
| Mark record as Valid / Invalid | ✅ Done | With optional remarks |
| View selfie in validation | ✅ Done | Punch-in and punch-out selfies in drawer with lightbox |
| View GPS location | ✅ Done | Coordinates shown in drawer |

**Extra beyond PDF:**
- **Admin lock**: once an admin validates a record, it shows a lock badge and cannot be re-edited by managers or employees.
- **Bulk validate** endpoint wired up (`PATCH /attendance/admin/bulk-validate`).
- **Manual attendance creation** by admin (`POST /attendance/admin/manual`).
- **Day type override** (`PATCH /attendance/:id/day-type`) and **mark absent** (`POST /attendance/team/mark-absent`) endpoints available in the API layer.

---

### 4. Overtime Workflow

| PDF Requirement | Status | Notes |
|----------------|--------|-------|
| Employee submits overtime request | ✅ Done | Date, hours (`extraHours`), reason |
| Manager/Admin approves or rejects | ✅ Done | With `reviewNote` and `approvedHours` |
| Employee sees request status | ✅ Done | Status badge + reviewer name + role badge |
| Cancel pending request | ✅ Done | Employee can delete their own pending request |

**Extra beyond PDF:**
- **`willBeReviewedBy`** shown on submit success — employee immediately sees who will review their request.
- **`approvedHours`** field — reviewer can approve a different number of hours than requested (partial approval).
- **Admin override**: admin can reverse a manager's approved/rejected decision. Warning banner shown. Override locks the record from further manager edits.
- **Approved hours shown** inline — if approved hours differ from requested, both values are displayed.
- Filter by status + month on both employee history and manage views.

---

### 5. Dashboards

| PDF Requirement | Status | Notes |
|----------------|--------|-------|
| Role-specific dashboard | ✅ Done | Three completely different views: Employee, Manager, Admin |
| Employee: today's status | ✅ Done | Punch status pill — null-safe when employee hasn't punched in |
| Employee: monthly summary | ✅ Done | Completed, Incomplete, Half Days, Absent from `dashboard.monthStats` |
| Manager: team today stats | ✅ Done | Present, Absent, Not In Yet, Pending OT from `dashboard.team` + `pendingOvertime.count` |
| Admin: system-wide stats | ✅ Done | Total Users, Present, Absent from `dashboard.today.present/absent`; Pending OT from `dashboard.pendingOvertime` |

**API field mapping (exact backend response keys used):**

| Role | Field | Source |
|------|-------|--------|
| Employee | Monthly stats | `dashboard.monthStats.completedDays / incompleteDays / halfDays / absentDays` |
| Employee | Avg hours | `dashboard.monthStats.averageHours` |
| Employee | OT counts | `dashboard.overtime.pending / approved / rejected` |
| Manager | Team counts | `dashboard.team.present / absent / notPunched` |
| Manager | Pending OT | `dashboard.pendingOvertime.count` |
| Admin | Today counts | `dashboard.today.present / absent` (server pre-calculates, excludes admins) |
| Admin | Monthly stats | `dashboard.month.completed / incomplete / halfDay / pendingValidation` |
| Admin | Pending OT | `dashboard.pendingOvertime` (plain number) |

**Extra beyond PDF:**
- **Date-aware dashboard** — frontend passes today's date in the user's local timezone (`en-CA` locale → `YYYY-MM-DD`) as a query param. Prevents the Render server's UTC clock from showing the wrong day for IST users.
- **Average hours/day** shown on employee today pill — from `monthStats.averageHours`.
- **Not In Yet card** on manager dashboard — `team.notPunched` distinguishes employees who simply haven't arrived from those marked absent.
- **Pending Validation card** on admin monthly row — `month.pendingValidation` shows how many records still need a manager/admin review.
- **Missed punch alert**: manager/admin sees an amber banner + toast if any employee didn't punch out the previous day. Triggered on page load — no cron job needed (Render free-tier sleeps, so cron was deliberately avoided).
- **Pending approvals widget** inline on manager/admin dashboard: approve or reject without leaving the Overview page.
- **Time-aware greeting**: "Good morning / Good afternoon / Good evening" based on current hour.
- **Overtime summary** on employee dashboard: pending, approved, and rejected request counts.

---

### 6. Reports

| PDF Requirement | Status | Notes |
|----------------|--------|-------|
| Attendance report | ✅ Done | Date-scoped daily report |
| Role-scoped access | ✅ Done | Employee → own, Manager → team, Admin → all |
| Status summary | ✅ Done | Total, Completed, Checked In, Incomplete, Absent counts |

**Extra beyond PDF:**
- **Selfie column** in records table: circular thumbnail, click to open full-size lightbox.
- **Location column**: `lat, lng` coordinates from punch-in record.
- **Donut chart**: visual status breakdown using Recharts.
- **Bar chart**: department-wise present/absent breakdown.
- **Export CSV / Excel**: `GET /reports/export?date=&format=` — triggered via `window.location.href` so the browser handles the file download natively (cookies sent automatically).
- Admin accounts are filtered out of report records.

---

### 7. Team & User Management

| PDF Requirement | Status | Notes |
|----------------|--------|-------|
| Admin manages users | ✅ Done | View, filter by role/department/name |
| Admin changes user roles | ✅ Done | Employee ↔ Manager via inline role selector + save button |
| Manager views own team | ✅ Done | Team members with today's attendance status |

**Extra beyond PDF:**
- **Team management page** (Admin): all teams grouped by manager, with assign/remove buttons.
- **Admin excluded from user list**: admin accounts are filtered out so they can't accidentally be demoted.
- **Department filter** on Users page.

---

### 8. Settings (Admin only)

| PDF Requirement | Status | Notes |
|----------------|--------|-------|
| Configure office location for geofence | ✅ Done | Latitude, longitude, radius in metres |
| "Use my location" shortcut | ✅ Done | Auto-fills coords from browser geolocation |

**Extra beyond PDF:**
- **System Status panel**: live health tiles for API Server, MongoDB, Redis. Manual refresh button.
- Health data sourced from `GET /api/health` — same endpoint polled by the global health monitor.

---

## Extra Features Added Entirely Beyond the PDF

### Production Deployment (Vercel + Render)

- `client/vercel.json` — two rules:
  1. `/api/*` → proxied to `https://hrms-backend-difb.onrender.com/api/*` (same-origin trick so HttpOnly cookies work cross-domain without `SameSite=None`)
  2. `/*` → `index.html` (SPA fallback so page refresh doesn't return 404)
- `VITE_API_URL=/api` set in Vercel env vars so the built JS calls relative paths, hitting the proxy

### Auth Flow — JWT Bearer + HttpOnly Refresh Cookie

- `POST /auth/login` → backend returns `{ user, accessToken }` + sets HttpOnly refresh cookie
- Frontend stores `accessToken` in Redux memory only (never `localStorage`)
- Every RTK Query request sends `Authorization: Bearer <token>` via `prepareHeaders`
- `AuthBootstrap` calls `POST /auth/refresh` on app mount to silently restore the session after a page reload
- On any 401: `baseQueryWithReauth` calls `/auth/refresh` once → retries original request → if refresh also fails, `dispatch(logout())` + redirect to `/login`

### Health Monitoring (Global)

- `HealthMonitor.jsx` — invisible component mounted in `App.jsx`
- Calls `GET /api/health` on every page load, then polls every 60 seconds
- **Down → toast error** if any service (server, MongoDB, Redis) is unhealthy
- **Up → toast success** when a previously-down service recovers
- `useRef` tracks previous state to de-duplicate toasts

### Custom Toast System

- No external library (avoids adding a dependency to React 19)
- Module-level singleton: `toast.error()`, `toast.success()`, `toast.info()` callable from anywhere — including outside React components (e.g. inside RTK Query base query)
- Auto-dismiss with configurable duration
- `Toaster` component renders a fixed bottom-right stack

### Responsive Collapsible Sidebar

- **Desktop**: sidebar toggles between 240px (expanded) and 68px (icon-only collapsed)
- **Collapsed mode**: `Tip` tooltip component on every icon and the user avatar
- **Preference persisted** in `localStorage` — survives page refresh
- **Mobile**: sidebar hidden by default, opens as a slide-in drawer via hamburger button with backdrop overlay
- Nav items grouped into logical sections: Workspace, Team, Admin — each group only renders if the current role has items in it

### Attendance Record Drawer

- Shared `AttendanceRecordDrawer.jsx` used across Attendance, Reports, and Overview pages
- Shows punch-in selfie + punch-out selfie side by side with lightbox
- GPS coordinates
- Validation controls (Valid / Invalid + remarks)
- Status badge with correct colour per status
- Admin lock badge on finalised records

---

## Assumptions Made

| Decision | Reason |
|----------|--------|
| One office geofence for all employees | PDF did not specify multi-location; admin can reconfigure at any time |
| Standard shift fixed at 8 hours | PDF used 8h as the threshold for Completed vs Incomplete |
| No cron jobs | Render free tier sleeps between requests; missed-punch is checked on page load instead |
| No email/SMS notifications | Not in PDF scope; in-app toasts used instead |
| No real-time (Socket.IO) | Not in PDF scope; RTK Query polling/invalidation covers live data needs |
| Admin decisions are final | PDF implied a hierarchy; admin lock prevents re-editing by lower roles |
| Vercel proxy instead of `SameSite=None` | Avoids backend cookie config changes; all API calls are same-origin from the browser's perspective |
| Local timezone date for dashboard | Render backend runs UTC; passing the client's local date prevents wrong-day data for IST users |

---

## Evaluation Criteria Coverage

| Criterion | Weight | What was built |
|-----------|--------|---------------|
| Core Feature Implementation | 40% | All 8 PDF sections fully implemented |
| Code Quality | 20% | RTK Query for all API calls, role-aware components, consistent `statusOf` helper, access token in Redux memory only |
| UI & UX | 15% | Tailwind v4, Recharts charts, responsive collapsible sidebar, vertical stat cards, camera light released on stop |
| Architecture | 15% | Feature-based backend modules, single RTK Query slice, RBAC middleware, JWT Bearer + HttpOnly refresh cookie, Vercel proxy |
| Bonus Features | 10% | Geofencing ✅, Health monitoring ✅, Export ✅, Missed-punch alert ✅, Admin override ✅, Production deployment ✅ |
