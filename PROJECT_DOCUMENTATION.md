# HR Recruitment Platform

## 1. Project Overview

The HR Recruitment Platform is a full-stack HR automation system built with a decoupled backend and frontend.

- Backend: Node.js with Express 5, Mongoose, JWT authentication, role-based access control, and a modular feature-based structure.
- Frontend: React 19 with Vite, TypeScript, TanStack Router / React Query, Tailwind CSS, Radix UI primitives, and component-driven pages.
- Purpose: Manage candidates, calls, interviews, tasks, reports, notifications, and recruiter workflows for a hiring team.

This repository contains two separate apps:
- `backend/` — REST API server and persistent business logic.
- `frontend/` — UI app with mock service implementation and client-side route structure.

---

## 2. Folder Structure

### Root
- `README.md` — Application introduction and quick start (not fully documented here).
- `PROJECT_DOCUMENTATION.md` — This file.
- `generate_tree.js` — Script to generate repository tree output.

### Backend
- `backend/package.json` — Backend dependencies and scripts.
- `backend/src/` — Express app source code.
- `backend/src/app.js` — Express configuration and middleware registration.
- `backend/src/server.js` — Server startup and MongoDB connection.
- `backend/src/config/database.js` — MongoDB connection helper.
- `backend/src/constants/` — Shared constant definitions.
- `backend/src/middleware/` — Authentication, authorization, upload, and error handling.
- `backend/src/modules/` — Feature modules for auth, candidates, calls, dashboard, interviews, notifications, reports, resumes, search, tasks, users, settings, activity, health.
- `backend/src/routes/index.js` — API router mounting all module routes.
- `backend/src/shared/` — Utilities and standardized response/error helpers.

### Frontend
- `frontend/package.json` — Frontend dependencies and scripts.
- `frontend/bunfig.toml` — Bun configuration file; may be present from scaffold but not actively referenced by frontend scripts.
- `frontend/src/` — Main frontend source.
- `frontend/src/App.tsx` — Present but empty.
- `frontend/src/main.tsx` — Present but empty.
- `frontend/src/start.ts` — TanStack server middleware and error page handling.
- `frontend/src/router.tsx` — Route definitions and page layout structure.
- `frontend/src/routeTree.gen.ts` — Generated route configuration helper.
- `frontend/src/styles.css` — Tailwind / global CSS.
- `frontend/src/components/` — Reusable UI components and layout components.
- `frontend/src/components/ui/` — Design-system primitives and Tailwind wrapper components.
- `frontend/src/contexts/AuthContext.tsx` — Authentication context for login state.
- `frontend/src/hooks/use-mobile.tsx` — Mobile detection hook.
- `frontend/src/layouts/AppShell.tsx` — Primary app shell with sidebar + topbar.
- `frontend/src/lib/` — Client-side configs, error handling, and utilities.
- `frontend/src/services/` — Mock service interface, HTTP client, and fake data.
- `frontend/src/types/index.ts` — Shared TypeScript model definitions.
- `frontend/src/routes/` — Page route components.

---

## 3. Frontend Architecture

### Entry Points
- `frontend/src/start.ts` sets up a TanStack request middleware and an HTML error page fallback.
- `frontend/src/routes/__root.tsx` defines the root route for TanStack Router with a React Query provider and `AuthProvider` context.
- `frontend/src/main.tsx` is empty, indicating the client entrypoint is not implemented in this project snapshot.

### Page Routing
- `frontend/src/router.tsx` declares application-level routes and page metadata.
- Pages are mounted via TanStack Router routes and include:
  - `/login` — login page.
  - `/dashboard` — HR dashboard.
  - `/candidates` — candidate list page.
  - `/candidates/:id` — candidate detail page.
  - `/interviews` — interview management.
  - `/notifications` — notifications center.
  - `/reports` — analytics pages.
  - `/settings` — settings page.
  - `/tasks` — task board.
  - `/activity` — activity feed.

### Layout
- `frontend/src/layouts/AppShell.tsx` renders common page scaffolding with a `Sidebar`, `Topbar`, and content area.
- `frontend/src/components/Sidebar.tsx`, `Topbar.tsx`, `PageHeader.tsx`, `DashboardCard.tsx`, and `StatusBadge.tsx` are the main layout/UI building blocks.
- The app shell is wrapped by `AuthProvider` and `QueryClientProvider` in `__root.tsx`.

### Authentication Flow
- `AuthContext.tsx` manages auth state and route redirection.
- `frontend/src/services/http.ts` stores access and refresh tokens in `localStorage`, injects the access token into outgoing Axios requests, and redirects to `/login` on 401 responses.
- `authService.login()` in `frontend/src/services/index.ts` is currently a mock implementation that validates credentials against `MOCK_USERS` and returns fake tokens.
- There is no real API integration on the frontend yet; the backend auth routes are not wired from UI pages.

### Data Layer
- `frontend/src/services/index.ts` exposes service methods for auth, dashboard, candidates, interviews, tasks, reports, and notifications.
- All methods currently return fake data from `frontend/src/services/mock-data.ts` and simulate asynchronous delays.
- `frontend/src/services/http.ts` is prepared for API integration, but the service functions are not yet using it.

### Types
- `frontend/src/types/index.ts` defines domain models used across pages and services.
- It includes models such as `User`, `Candidate`, `Interview`, `Task`, `NotificationItem`, `DashboardStats`, and audit/timeline structures.

### Error Handling
- `frontend/src/lib/error-capture.ts`, `error-page.ts`, and `lovable-error-reporting.ts` handle error reporting and rendering for the client.
- `__root.tsx` reports uncaught route errors and displays a fallback UI.

---

## 4. Backend Architecture

### Application Startup
- `backend/src/server.js` loads environment variables and connects to MongoDB via `config/database.js`.
- `backend/src/app.js` builds the Express app with `helmet`, `cors`, `express.json()`, `express.urlencoded()`, and `morgan` request logging.
- `/api/health` is a basic health check endpoint.
- The app mounts `backend/src/routes/index.js` at `/api` and uses centralized error handling.

### Database
- MongoDB is used via Mongoose.
- `backend/src/config/database.js` connects `mongoose` to `process.env.MONGO_URI`.
- Persistent entities are defined with Mongoose schemas.

### Shared Backend Patterns
- Controllers handle request/response flow and call services.
- Services contain business logic, data access, token generation, and workflow rules.
- Middleware enforces authentication, authorization, request validation, file upload handling, and error formatting.
- `shared/response/apiResponse.js` standardizes success responses.
- `shared/errors/AppError.js` models API errors with statuses.
- `shared/utils/validateRequest.js` integrates `express-validator` input validation.
- `shared/utils/asyncHandler.js` wraps async route handlers.

### Authentication & Authorization
- `backend/src/modules/auth/auth.routes.js` exposes:
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
- `auth.service.js` uses bcrypt and JWT for password validation and token generation.
- Access tokens are signed with `JWT_ACCESS_SECRET`; refresh tokens use `JWT_REFRESH_SECRET`.
- `auth.middleware.js` verifies access tokens and attaches `req.user`.
- `role.middleware.js` enforces user roles for protected routes.
- User model includes `refreshToken`, `role`, `isActive`, and `lastLogin`.

### Candidate Management
- Candidate CRUD and workflow routes are split across:
  - `backend/src/modules/candidates/candidate.routes.js`
  - `backend/src/modules/candidates/candidate.controller.js`
  - `backend/src/modules/candidates/candidate.service.js`
  - `backend/src/modules/candidates/candidate.model.js`
  - `backend/src/modules/candidates/candidateDetails.routes.js`
  - `backend/src/modules/candidates/candidateDetails.controller.js`
  - `backend/src/modules/candidates/candidateDetails.service.js`
  - `backend/src/modules/candidates/candidateWorkflow.routes.js`
- Candidate endpoints include creation, update, deletion, detail fetch, timeline, audits, and workflow transitions.
- Routes are protected, with `ADMIN` required for create/delete and `ADMIN|HR` for updates.

### Call Management
- `backend/src/modules/calls/call.routes.js` handles call creation and follow-up queries.
- `backend/src/modules/calls/call.controller.js` and `call.service.js` implement call scheduling and candidate status transitions.
- Calls are linked to candidates and status events are recorded in candidate timelines.

### Interview Management
- Interview routes are defined in `backend/src/modules/interviews/interview.routes.js`.
- Controllers/services schedule interviews and update completion status.
- Candidate status changes and notifications are propagated through these modules.

### Task Management
- Task endpoints in `backend/src/modules/tasks/task.routes.js` manage task creation, updates, review, and candidate status.
- `task.service.js` supports task lifecycle and assignment.

### Reports & Dashboard
- `backend/src/modules/dashboard/dashboard.routes.js` returns HR summary metrics.
- `backend/src/modules/reports/report.routes.js` returns summary analytics and trend data.
- These endpoints aggregate candidate, call, interview, and task data for charts and KPI pages.

### Notifications
- `backend/src/modules/notifications/notification.routes.js` offers notification list and read/update operations.
- Notifications are delivered for candidate assignments, interviews, offers, and overdue actions.

### Settings
- `backend/src/modules/settings/settings.routes.js` supports retrieving and updating application settings.
- This module is likely designed for global configuration like company info or hiring thresholds.

### Resumes
- `backend/src/modules/resumes/resume.routes.js` accepts file uploads using `multer` and Cloudinary storage.
- The route uploads resumes and returns metadata (name, URL, size, type).

### Search
- `backend/src/modules/search/search.routes.js` provides search across candidates by text.

### Activity
- `backend/src/modules/activity/activity.routes.js` returns activity feed events for dashboards.

### Health Monitoring
- `backend/src/modules/health/health.routes.js` provides API health details separate from the root `/api/health` route.

---

## 5. Database Design (Inferred)

### Core Collections

#### Users
- `name`, `email`, `passwordHash`, `role`, `isActive`, `lastLogin`, `refreshToken`
- Roles are defined in `backend/src/constants/roles.js`.

#### Candidates
- Candidate data likely includes:
  - `code`, `name`, `email`, `phone`, `category`, `status`, `assignedTo`, `owner`, `createdAt`, `isActive`
  - Timeline entries and audit history are attached via separate services.

#### Calls
- Call records are associated with candidates and include scheduling/follow-up details.

#### Interviews
- Interview records include `candidateId`, `interviewerName`, `interviewType`, `scheduledAt`, `status`.

#### Tasks
- Tasks track candidate-related work with `title`, `description`, `status`, `priority`, `dueDate`, `assigneeName`, `candidateName`.

#### Notifications
- Notification items include `title`, `body`, `read`, `createdAt`, `type`.

#### Settings
- Settings support application-level configuration values.

### Notes
- The backend architecture is modeled for normalized, collection-based storage.
- Candidate timeline and audit history appear to be separate entities created dynamically by workflow events.
- Mongoose models and service methods imply the system is optimized for recruiter workflows, candidate transitions, and activity tracking.

---

## 6. API Documentation

### Base URL
- Backend API base: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

### Authentication

#### POST /api/auth/login
- Request body: `{ email, password }`
- Response: `{ accessToken, refreshToken, user }`
- Returns JWT tokens and user profile.

#### POST /api/auth/refresh
- Request body: `{ refreshToken }`
- Response: `{ accessToken }`
- Refreshes the access token when the refresh token is valid.

#### POST /api/auth/logout
- Protected route
- Uses access token, clears stored refresh token.

### Candidate APIs

#### GET /api/candidates
- Protected route.
- Returns list of candidate summaries.

#### GET /api/candidates/:id
- Protected route.
- Returns candidate detail and metadata for a single candidate.

#### POST /api/candidates
- Protected route; role `ADMIN` required.
- Creates a new candidate.

#### PATCH /api/candidates/:id
- Protected route; roles `ADMIN|HR` allowed.
- Updates a candidate record.

#### DELETE /api/candidates/:id
- Protected route; role `ADMIN` required.
- Deletes or soft-deletes candidate.

### Candidate Details & Workflow

#### Candidate details routing
- `backend/src/modules/candidates/candidateDetails.routes.js` is mounted at `/api/candidates` as additional routes.
- It exposes candidate detail, timeline, and audit endpoints.

#### Candidate workflow routing
- `backend/src/modules/candidates/candidateWorkflow.routes.js` is mounted at `/api/candidates`.
- This module handles status transitions.

### Call APIs

#### POST /api/calls
- Protected; creates candidate call records and follow-up status.

#### GET /api/calls/today
- Protected; returns today’s scheduled calls.

#### GET /api/calls/upcoming
- Protected; returns upcoming follow-up calls.

### Interview APIs

#### GET /api/interviews
- Protected; list interviews.

#### POST /api/interviews
- Protected; schedule interviews.

### Task APIs

#### GET /api/tasks
- Protected; list tasks.

#### PATCH /api/tasks/:id/status
- Protected; update task status.

### Notifications APIs

#### GET /api/notifications
- Protected; list notifications.

#### PATCH /api/notifications/:id/read
- Protected; mark a notification as read.

### Report APIs

#### GET /api/reports
- Protected; returns hiring analytics and charts.

### Dashboard APIs

#### GET /api/dashboard
- Protected; returns summary metrics for dashboard cards.

### Search APIs

#### GET /api/search?query=...
- Protected; search candidates by text.

### Resume Upload APIs

#### POST /api/resumes
- Protected; upload resume files with `multipart/form-data`.
- Uses Cloudinary storage via `multer-storage-cloudinary`.

### Settings APIs

#### GET /api/settings
- Protected; retrieve application settings.

#### PUT /api/settings
- Protected; update application settings.

### Activity APIs

#### GET /api/activity
- Protected; activity feed events for timeline display.

### Health APIs

#### GET /api/health
- Public health check endpoint.

---

## 7. Backend Auth Flow

1. User submits email/password to `/api/auth/login`.
2. `auth.controller.login()` forwards the request to `auth.service.loginUser()`.
3. `loginUser()` looks up the user by email, verifies `passwordHash` with bcrypt, and checks `isActive`.
4. On success, it creates an access token and a refresh token, stores the refresh token in the user record, and returns both.
5. Protected routes require the `Authorization: Bearer <accessToken>` header.
6. `auth.middleware.js` verifies the access token and sets `req.user`.
7. `role.middleware.js` enforces route authorization by `req.user.role`.
8. Refresh flow uses `POST /api/auth/refresh` with a refresh token to generate a new access token.
9. Logout clears the refresh token from the user document.

---

## 8. Candidate Workflow

The backend supports a stepwise candidate lifecycle and event recording.

### Candidate statuses
- `NEW`
- `CONTACTED`
- `INTERVIEW`
- `SELECTED`
- `DROPPED`
- `ON_HOLD`

### Workflow events
- Candidate creation, update, and deletion are managed through candidate APIs.
- Call scheduling and completion influence candidate status and timeline events.
- Interview scheduling and completion are handled by the interview module.
- Task creation + review supports candidate progress tracking.
- Notifications are generated for assignment, interview reminders, offers, and overdue actions.

### Data flow
- Most candidate-related endpoints are protected by auth.
- Candidate details include timeline and audit history to trace status changes.
- Workflow modules update candidate timelines via service helpers.

---

## 9. Frontend / Backend Mapping

### Backend modules → Frontend pages
- `auth` → `login.tsx` + `AuthContext.tsx`
- `dashboard` → `dashboard.tsx` + `DashboardCard.tsx`
- `candidates` → `candidates.tsx` + `candidates.$id.tsx`
- `interviews` → `interviews.tsx`
- `tasks` → `tasks.tsx`
- `notifications` → `notifications.tsx`
- `reports` → `reports.tsx`
- `settings` → `settings.tsx`
- `activity` → `activity.tsx`
- `search` → not yet wired in frontend pages; search UX is not implemented.
- `resumes` → not yet wired in frontend pages; resume upload UI is not implemented.

### UI to backend gaps
- The frontend currently uses mock service data only.
- No real API calls or data hydration from the backend are implemented in the service layer.
- `frontend/src/App.tsx` and `frontend/src/main.tsx` are empty, suggesting the app is incomplete or relies on a different startup pattern.
- Authentication context and HTTP client are configured, but actual login calls are mock-only.

---

## 10. Missing and Partially Implemented Features

### Frontend gaps
- No real backend integration for candidate, interview, task, notification, report, dashboard, or auth APIs.
- `main.tsx` and `App.tsx` are empty.
- `frontend/src/routes/README.md` exists but the page implementation details are not fully developed.
- Resume upload UI is absent.
- Search UI and search endpoint integration are absent.
- Candidate details page appears present but may not display backend-driven timeline and audit data yet.

### Backend / stability gaps
- No seed data script for backend users/candidates beyond `frontend` mock data.
- No explicit database migration or seeding mechanism in the backend.
- Some modules are configured with `routes` only; the UI integration is missing.
- The backend health endpoint is duplicated at `/api/health` and `/api/health` (root and module route), which is acceptable but should be consolidated.
- Documentation and readme files are incomplete for deployment and developer onboarding.

---

## 11. Deployment Guide

### Prerequisites
- Node.js 20+ (or compatible LTS)
- MongoDB instance accessible via `MONGO_URI`
- Cloudinary account and credentials if resume upload is used
- `npm` or `pnpm` available

### Backend setup
1. Open terminal in `backend/`
2. Install dependencies: `npm install`
3. Create `.env` in `backend/` with:
   - `PORT=5000`
   - `MONGO_URI=<your mongodb connection string>`
   - `JWT_ACCESS_SECRET=<secret>`
   - `JWT_REFRESH_SECRET=<secret>`
   - `CLOUDINARY_CLOUD_NAME=<cloud_name>`
   - `CLOUDINARY_API_KEY=<api_key>`
   - `CLOUDINARY_API_SECRET=<api_secret>`
4. Start the backend in development: `npm run dev`

### Frontend setup
1. Open terminal in `frontend/`
2. Install dependencies: `npm install`
3. Create `.env` or set Vite env variable if needed: `VITE_API_URL=http://localhost:5000/api`
4. Start the frontend: `npm run dev`

### Production build
- Backend: `npm start` in `backend/`
- Frontend: `npm run build` in `frontend/`
- Serve the build output via a static hosting provider or integrate with a Node server.

### Notes
- The frontend currently relies on mock services, so the UI will work without a live backend.
- When wiring production API integration, update `frontend/src/services/index.ts` to call `frontend/src/services/http.ts` instead of returning mock data.

---

## 12. Onboarding Guide

### Recommended first steps
1. Review `backend/src/app.js`, `backend/src/server.js`, and `backend/src/routes/index.js` to understand the backend request flow.
2. Review `frontend/src/routes/__root.tsx`, `frontend/src/router.tsx`, and `frontend/src/layouts/AppShell.tsx` for the frontend app structure.
3. Open `frontend/src/services/index.ts` and `frontend/src/services/mock-data.ts` to understand how mock data is provided.
4. Inspect `backend/src/modules/auth` and `backend/src/middleware` to understand authentication and RBAC.
5. Run both apps locally with `npm run dev` in each folder and verify the frontend loads.

### Core responsibilities
- Backend developers: build and extend API modules, add seed data, secure auth flows, and wire Cloudinary/resume storage.
- Frontend developers: implement actual API calls, complete page interactions, connect candidate detail workflows, and add missing UX such as search and upload.
- QA: verify page routes, auth redirect behavior, and mock vs real data transitions after integration.

---

## 13. Completion Roadmap

### Phase 1: Stabilize backend
- Add database seeding for users and candidates.
- Add API documentation or OpenAPI spec.
- Improve error handling and validation schema coverage.
- Consolidate health endpoints.

### Phase 2: Frontend integration
- Implement live API service layer in `frontend/src/services/index.ts`.
- Replace mock data with backend responses.
- Wire login to `POST /api/auth/login` and persist tokens.
- Implement candidate search page and resume upload UI.
- Add refresh token flow and route guarding.

### Phase 3: UX completion
- Build candidate details timeline and audit history views.
- Add task assignment, interview scheduling, and call follow-up forms.
- Add settings management and report filters.
- Improve mobile/responsive layout.

### Phase 4: Production readiness
- Add CI lint/build checks.
- Add tests for backend routes and frontend pages.
- Harden security for token storage, CORS, and Cloudinary uploads.
- Document environment and runbooks.

---

## 14. Architecture Summary

This platform uses a classic decoupled architecture:

- Backend: REST API + MongoDB with domain modules handling auth, candidate lifecycle, hiring workflows, notifications, and analytics.
- Frontend: React SPA using TanStack Router and React Query, built with Tailwind and Radix UI.

The backend supports a recruiter workflow from candidate intake through interviews, task assignment, reporting, and notifications.

The frontend is currently scaffolded with strong route and UI structure, but it remains disconnected from the real backend because service methods still return mock data.

### Key strengths
- Modular backend design for extensibility.
- Clean frontend route layout and design-system primitives.
- Authentication and role-based access control prepared in the backend.

### Primary gap
- The application is not fully integrated: the frontend works in mock mode while the backend is ready for API-driven workflows.

---

## 15. Important Files Reference

- `backend/src/app.js`
- `backend/src/server.js`
- `backend/src/routes/index.js`
- `backend/src/modules/auth/auth.service.js`
- `backend/src/modules/auth/auth.middleware.js`
- `backend/src/modules/candidates/candidate.controller.js`
- `backend/src/modules/candidates/candidate.service.js`
- `backend/src/modules/resumes/resume.routes.js`
- `frontend/src/routes/__root.tsx`
- `frontend/src/router.tsx`
- `frontend/src/layouts/AppShell.tsx`
- `frontend/src/services/index.ts`
- `frontend/src/services/http.ts`
- `frontend/src/services/mock-data.ts`
- `frontend/src/types/index.ts`

---

## 16. Notes and Recommendations

- If you want the UI to talk to the backend, the next priority is to implement the backend API calls in `frontend/src/services/index.ts`.
- Add a backend seed script to create an initial admin user and sample candidate records.
- Confirm the actual entrypoint pattern for the frontend: `main.tsx` is empty, which likely means the app is not wired through a standard React client entry.
- Validate the Cloudinary resume upload flow with proper `CLOUDINARY_*` env variables and update the resume UI accordingly.
- Create a developer README with commands for running the backend and frontend together.

---

## 17. Quick Start Commands

Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 18. Additional Observations

- The frontend appears to be built using the newer TanStack React Start / Router pattern rather than traditional ReactDOM render logic.
- `frontend/src/start.ts` includes request middleware for server-side behavior, which suggests the app may target a hybrid or is preconfigured for server rendering.
- The UI uses a mock-first approach, making it easy to demo the product without backend availability.
- `backend/package.json` uses `type: module`, so all backend source files are ES modules.

---

## 19. Suggested Next Work Items

1. Implement actual backend API integration on the frontend.
2. Add backend database seeding and sample data scripts.
3. Build search and resume upload pages.
4. Add role-based UI behavior for admin vs HR users.
5. Create API docs or Postman collection for backend endpoints.

---

## 20. Contact Points in Code

- Search term `TODO` or `mock` in `frontend/src/services/index.ts` and `frontend/src/services/mock-data.ts` for the main integration gap.
- `backend/src/constants/roles.js` defines role values used across authorization logic.
- `backend/src/shared/utils/generateToken.js` controls JWT behavior.
- `backend/src/modules/auth` and `frontend/src/contexts/AuthContext.tsx` are the key auth touchpoints.
