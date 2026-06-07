# HRMS — Attendance Management System

A full-stack Attendance Management System built as a MERN assessment project. Tracks employee attendance using live selfie capture and GPS-based geofencing, with role-based dashboards for employees, managers, and admins.

---

## Live Demo

| Service | URL |
|---------|-----|
| Frontend | _deploy to Vercel/Netlify and add link here_ |
| Backend | _deploy to Render and add link here_ |

---

## Tech Stack

**Frontend**
- React 19 + Vite 7
- Redux Toolkit + RTK Query (state management & API layer)
- React Router v7 (client-side routing with protected routes)
- Tailwind CSS v4 (utility-first styling)
- Recharts (charts and analytics)
- lucide-react (icons)

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT (access + refresh tokens via HTTP-only cookies)
- Cloudinary (selfie image storage)
- Redis / ioredis (token blacklisting and caching)
- Winston + Morgan (structured logging)
- Helmet + CORS + express-rate-limit (security hardening)

---

## Project Structure

```
/
├── client/               # React frontend (Vite)
│   └── src/
│       ├── app/api/      # RTK Query API slice (baseApi.js)
│       ├── components/   # Shared components (drawer, toast, health monitor)
│       ├── features/     # Redux slices (auth)
│       ├── pages/        # Page components per role/feature
│       └── routes/       # ProtectedRoute wrapper
│
└── Backend/
    └── src/
        ├── modules/      # Feature modules (auth, attendance, overtime, ...)
        │   ├── auth/
        │   ├── attendance/
        │   ├── overtime/
        │   ├── users/
        │   ├── reports/
        │   ├── dashboard/
        │   └── settings/
        ├── middlewares/  # Auth, RBAC, error handling
        ├── config/       # DB, Cloudinary, Redis config
        └── shared/       # Utilities, validators
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)
- Redis (local or upstash)
- Cloudinary account

### Backend Setup

```bash
cd Backend
npm install
```

Create `.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hrms
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
REDIS_URL=redis://localhost:6379
CLIENT_URL=http://localhost:5173
```

Seed the admin account:

```bash
npm run seed:admin
```

Start the server:

```bash
npm run dev        # development (nodemon)
npm start          # production
```

Backend runs on `http://localhost:5000`.

### Frontend Setup

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the dev server:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`.

---

## Features Implemented

### Authentication & Authorization
- Secure login and signup with bcrypt password hashing
- JWT access + refresh token flow (HTTP-only cookies)
- Role-based access control — Employee, Manager, Admin
- Protected routes on both frontend and backend
- Auto token refresh via RTK Query base query
- Redux state reset on logout (prevents cross-user cache leaks)

### Attendance — Punch In / Punch Out
- Live selfie capture using device camera (`getUserMedia`) — no file upload
- GPS location capture (`navigator.geolocation`) auto-triggered on camera open
- Geofencing: punch rejected if employee is outside the configured office radius
- Stores: punch-in time, punch-out time, selfie (Cloudinary URL), location (lat/lng), working hours
- Early exit reason prompt when punching out under 8 hours
- Next-day unblock: incomplete previous-day record does not prevent next-day punch-in
- Calendar view on employee dashboard — colour-coded dots per day, click for day details

### Working Hours Logic
- Standard shift: 8 hours
- `Completed` → ≥ 8 hours worked
- `Incomplete` → < 8 hours worked (valid record)
- `Half Day` → < 8 hours + marked valid by manager/admin
- `Absent` → no punch-in, OR marked invalid by admin/manager
- `Checked In` → punched in, not yet punched out

### Attendance Validation
- Admin and Manager can open any record in a drawer
- View punch-in and punch-out selfies (lightbox)
- View GPS coordinates
- Mark record as **Valid** or **Invalid** with optional remarks
- **Admin lock**: admin-finalised records show a lock badge and cannot be edited by managers or employees

### Overtime Workflow
- Employee submits overtime request (date, hours, reason)
- Submit response shows who will review the request (`willBeReviewedBy`)
- Manager/Admin can approve or reject with optional remarks
- Reviewer name + role badge shown on approved/rejected requests
- Admin can override a manager's decision with a warning banner
- Admin-overridden requests are locked from further changes

### Dashboards

**Employee**
- Today punch status banner (checked in time / completed hours)
- Monthly breakdown: Completed, Incomplete, Half Days, Absent
- Overtime summary badges (pending / approved / total hours)
- Attendance calendar with colour-coded status dots
- Click any day for punch times, working hours, early exit reason

**Manager**
- Today's team stats: Present, Absent, Pending Overtime
- Pending approvals widget with inline approve/reject (+ optional remarks)
- Quick actions: Team Attendance, Overtime Approvals, Reports

**Admin**
- System-wide stats: Total Users, Present Today, Absent Today, Pending OT
- Monthly breakdown: Completed, Incomplete, Half Days, Absent
- Pending approvals widget
- Quick actions: User Management, All Attendance, OT Approvals, Reports

### Reports
- Daily attendance report with date picker
- Donut chart (status breakdown) + bar chart (department present/absent)
- Records table: Employee name, Selfie thumbnail (click to enlarge), Punch-in time, Punch-out time, Location (lat/lng), Working hours, Status
- Access: Employee → own data, Manager → team data, Admin → all data
- Admins filtered out of report records

### Team & User Management
- Manager: view own team members with today's attendance status
- Admin: view all teams grouped by manager, assign/remove employees from teams
- Admin: change user roles (Employee ↔ Manager), admin accounts excluded from listing

### Settings (Admin only)
- Configure office geofence: name, latitude, longitude, radius in metres
- "Use my location" button to auto-fill coordinates
- System Status panel: live health check for API Server, MongoDB, Redis

### System Health Monitoring
- `GET /api/health` checked on every page load (no auth required)
- Polls every 60 seconds
- Toast notification if any service is down on startup or goes down mid-session
- Toast notification when services recover
- Detailed status tiles in Settings page with manual refresh

---

## Good to Have — Implemented

| Feature | Details |
|---------|---------|
| Filters | Date, department, user search across all pages |
| Pagination | Backend pagination, frontend consumes `total` for display |
| Clean UI/UX | Tailwind v4, consistent card/drawer design system |

## Bonus Features — Implemented

| Feature | Details |
|---------|---------|
| Geofencing | Office location configured by admin; punch blocked outside radius |
| Notification system | Toast notifications for server health; backend health monitoring |

---

## Assumptions

- One office location (geofence) applies to all employees; configurable by admin
- Standard shift is fixed at 8 hours; overtime is requested separately
- A manager can only approve/reject requests from employees in their team; admin can act on any
- Admin decisions are final — they lock the record and cannot be overridden by managers
- Selfies are stored on Cloudinary; the backend returns public URLs
- Refresh tokens are stored in HTTP-only cookies; access tokens in Redux state (memory only)
- The system does not send email/SMS notifications — in-app toast and status badges are used instead
- Real-time updates (Socket.IO) are not implemented; pages use RTK Query polling/invalidation

---

## Evaluation Criteria Coverage

| Criterion | Weight | Implementation |
|-----------|--------|---------------|
| Core Feature Implementation | 40% | All 7 core sections complete |
| Code Quality | 20% | RTK Query for all API calls, role-aware components, consistent error handling |
| UI & UX | 15% | Tailwind v4 design system, recharts analytics, responsive layout |
| Architecture | 15% | Feature-based module structure (backend), RTK Query slice (frontend), RBAC middleware |
| Bonus Features | 10% | Geofencing + health monitoring implemented |
