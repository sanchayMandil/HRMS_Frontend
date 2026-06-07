# Attendance Management System

Frontend-only starter for the assessment brief:

- React + Vite frontend
- Redux Toolkit + RTK Query state/data layer
- Role-based dashboard scaffolding for employee, manager, and admin flows

## Project Structure

```text
client/   React app with routes, store, auth shell, and assessment page scaffolds
```

## Frontend Scope Scaffolded

- Signup, login, JWT auth, and role-aware route protection
- Attendance page shell for punch in/out with selfie + location integration points
- Overtime request page shell
- Reports/dashboard pages for employee, manager, and admin views
- RTK Query API layer ready to connect to your separate backend

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create env files:

```bash
copy client\\.env.example client\\.env
```

3. Run the app:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Next Implementation Steps

- Point `VITE_API_URL` at your separate backend server
- Replace the demo attendance payload with live camera capture and browser geolocation
- Add persistent auth rehydration and better form validation
- Build manager/admin specific UI for attendance verification and OT review
- Add filters, pagination, and report polish

## Assumptions

- The backend lives in a separate folder/repo and exposes matching auth, attendance, overtime, and report APIs
- Frontend setup is limited to the technologies explicitly required in the PDF: React (Vite), Redux Toolkit, and RTK Query
- Geofencing, notifications, exports, and real-time updates are intentionally deferred
