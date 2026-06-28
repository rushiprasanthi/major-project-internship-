# RMS MVP ENGINEERING BLUEPRINT
## Smart Resource Booking & Asset Management System
### Consolidated 72-Hour Single-Developer Execution Reference

---

## DOCUMENT CONTROL & SYNTHESIS NOTE

This blueprint consolidates seven prior analysis passes into one authoritative reference. Where iterations conflicted, the **fixed constraints** (6 tables — `roles, users, resources, bookings, assets, maintenance_requests`; 7 screens; ~20–25 APIs; React/Tailwind/Node/Express/SQLite/JWT/Recharts; no Kafka/RabbitMQ/Redis/Docker/microservices) are treated as binding and all conflicting drafts are overridden. Reconciliation decisions made in this pass:

| Conflict Found | Source(s) | Resolution |
|---|---|---|
| 6th table proposed as `notifications` or `activity_logs` instead of the mandated pair | `phase2.txt`, `phase3.txt` | Discarded. Canonical schema uses `roles` + `maintenance_requests` as the 5th/6th tables, per fixed constraints and `phase5.txt`'s correction. |
| `maintenance_tickets` vs `maintenance_requests` naming | `phase2.txt`/`phase3.txt` vs `phase5.txt` | Standardized on `maintenance_requests` (matches mandated schema). |
| Role stored as free-text `role` column vs normalized `role_id → roles` | `phase2.txt` vs `phase5.txt` | Normalized FK design adopted — required by the explicit `roles` table constraint. |
| Conflicting screen-role visibility matrices | `phase3.txt` vs `phase6.txt` vs `phase7.txt` | Single matrix adopted in Phase 4.5 below, aligned to the Functional Requirements / RBAC matrix in `phase7.txt` (the academic-report draft), since it is the most complete authority on access control. |
| API count drift (23 vs informal ~20) across drafts | `phase2.txt`, `resources_project.txt` | Final surface re-tallied at **24 endpoints** against the corrected schema (Roles + Users endpoints added; report endpoints consolidated to one). |

All technical content below is grounded in: the original 14-module ERP specification (`RMS_Educational_Document.md`), the MVP reduction rationale (`resources_project.txt`), the architecture/API drafts (`phase2.txt`, `phase3.txt`), the execution-timeline drafts (`phase4.txt`), the corrected schema (`phase5.txt`), the UI/component system (`phase6.txt`), and the academic report skeleton (`phase7.txt`).

Note: The project architecture was officially migrated from SQLite to PostgreSQL to better support multi-user concurrent booking.

---

# PHASE 1 — REQUIREMENT EXTRACTION & TRACEABILITY

## 1.1 Source Document Profile

`RMS_Educational_Document.md` specifies a full **Educational Institution Resource Management ERP**: 6 end-user role classes and **14 functional modules** (Auth & Access Control, Dashboard, Classroom & Space Management, Laboratory Management, Equipment & Asset Management, Human Resource Management, Library Resource Management, Budget & Finance Management, Schedule & Timetable Management, Maintenance & Facility Management, Notification & Communication, Feedback & Grievance Management, Reports & Analytics, Procurement Management), plus a high-level user-flow diagram. At full scope this implies 100+ relational entities and 200+ endpoints — **infeasible inside a 72-hour single-developer window.** The MVP scope reduction below is the governing engineering decision for this entire blueprint.

## 1.2 Stakeholder Mapping (Original → MVP)

| Original Role (source doc) | MVP RBAC Role | Support Level |
|---|---|---|
| Super Admin | `admin` (merged) | Full |
| Administrator / Resource Manager | `admin` (merged) | Full |
| Faculty / Teaching Staff | `faculty` | Full |
| Students | `student` | Full |
| Support Staff / Maintenance Team | `maintenance` | Full |
| Finance / Budget Officer | *No login role* | Simulated (static dashboard widget only — no FR implements a Finance actor) |

**Engineering rationale:** Super Admin and Administrator/Resource Manager have overlapping permission sets in the source document (both manage resources, approve requests, view analytics). Merging them into a single `admin` role removes a redundant permission tier without losing any MVP-relevant capability, and keeps the `roles` table small and demo-legible.

## 1.3 Functional Requirements (Traceable)

| ID | Module | Requirement | Priority | MVP Status |
|---|---|---|---|---|
| FR-01 | Auth | Email/password login issuing JWT | High | Fully Implemented |
| FR-02 | Auth | Registration with role assignment | High | Fully Implemented |
| FR-03 | Auth | Role-based authorization on protected routes | High | Fully Implemented |
| FR-04 | Resources | CRUD for Classroom / Laboratory / Seminar Hall | High | Fully Implemented |
| FR-05 | Resources | Real-time status (Available/Occupied/Maintenance) | High | Fully Implemented |
| FR-06 | Bookings | Create booking request against a resource | High | Fully Implemented |
| FR-07 | Bookings | Conflict-free slot validation (atomic transaction) | High | Fully Implemented |
| FR-08 | Bookings | Approve / Reject / Cancel lifecycle | High | Fully Implemented |
| FR-09 | Assets | CRUD with category, serial number, condition | High | Fully Implemented |
| FR-10 | Assets | Assignment binding to a resource (room) | Medium | Fully Implemented |
| FR-11 | Maintenance | Raise ticket against an asset | High | Fully Implemented |
| FR-12 | Maintenance | Status lifecycle: Open → In Progress → Resolved | High | Fully Implemented |
| FR-13 | Dashboard | Role-aware KPI cards | High | Fully Implemented |
| FR-14 | Dashboard | Recharts visualizations (utilization, asset condition) | Medium | Fully Implemented |
| FR-15 | Dashboard | Budget snapshot widget | Low | **Simulated** (static figures, no ledger) |
| FR-16 | Reports | Booking / Asset / Maintenance summary aggregation | Medium | Fully Implemented |
| FR-17 | Reports | Procurement workflow visualization | Low | **Simulated** (static stage diagram, no backend) |
| FR-18 | Notifications | In-app alerting on booking/ticket state change | Low | **Simulated** (toast/banner only, no email/SMS) |
| FR-19 | Library / HR / Payroll / Multi-campus / AI Scheduling | — | — | **Deferred — Future Scope** |

## 1.4 Non-Functional Requirements

| Category | Requirement | Target |
|---|---|---|
| Performance | API response latency | < 2 s under demo load |
| Security | Stateless auth via JWT, hashed credentials (bcrypt) | Enforced on every protected route |
| Reliability | CRUD operation success rate | ≥ 99% in QA pass |
| Usability | Responsive layout (mobile drawer, desktop fixed sidebar) | Tailwind breakpoints sm/md/lg/xl |
| Maintainability | Single monolith, no distributed infra | Express + SQLite only |
| Portability | Runs identically on localhost and Render | No environment-specific code paths |

## 1.5 Requirement Traceability Matrix — 14 Source Modules → 7 MVP Modules

| Source Module | MVP Classification | Mapped MVP Module | Justification |
|---|---|---|---|
| 1. User Authentication & Access Control | Fully Implemented (core only) | **Auth** | MFA, SSO, password-recovery flows dropped — JWT + bcrypt is sufficient security for an evaluated demo. |
| 2. Dashboard Management | Fully Implemented | **Dashboard** | KPI cards + 2 chart types retained; deep personalization per role dropped. |
| 3. Classroom & Space Management | Fully Implemented | **Resources** | Folded into a generic `resources` table with `type = Classroom`. |
| 4. Laboratory Management | Fully Implemented (booking/inventory only) | **Resources** | Folded into same table with `type = Laboratory`; safety-compliance and lab-specific audit trails deferred. |
| 5. Equipment & Asset Management | Fully Implemented (core lifecycle) | **Assets** | QR codes, depreciation, disposal workflow deferred; condition + assignment retained. |
| 6. Human Resource Management | **Deferred** | Future Scope | Zero MVP requirement references HR; no marks-to-effort justification for inclusion. |
| 7. Library Resource Management | **Deferred** | Future Scope | Out of scope for resource-booking MVP narrative. |
| 8. Budget & Finance Management | **Simulated** | Dashboard | Rendered as a static figures card; no ledger, no Finance role. |
| 9. Schedule & Timetable Management | Partially Implemented | **Bookings** | Conflict detection (the core value) retained; institution-wide timetable generation deferred. |
| 10. Maintenance & Facility Management | Fully Implemented (core ticketing) | **Maintenance** | Vendor management and preventive scheduling deferred. |
| 11. Notification & Communication | **Simulated** | Dashboard | In-app banners only; no email/SMS gateway. |
| 12. Feedback & Grievance Management | **Deferred** | Future Scope | No FR maps to this in the MVP contract. |
| 13. Reports & Analytics | Fully Implemented (core aggregation) | **Reports** | Custom report builder + PDF/Excel export deferred to CSV-only export. |
| 14. Procurement Management | **Simulated** | Reports / Dashboard | Static 4-stage flow card (Faculty→Admin→Finance→Purchase); no PO/GRN backend. |

**Net result:** 14 source modules collapse into **7 MVP modules** with zero loss of the core resource lifecycle (allocate → book → equip → maintain → report), which is the single throughline this MVP must defend at evaluation.

---

# PHASE 2 — MVP MODULE ARCHITECTURE

Each of the 7 modules below is specified with: purpose, retained scope, primary entity, and a coverage metric (feature-parity against the corresponding source module(s), per the Phase 1 matrix).

## 2.1 Authentication & RBAC

- **Purpose:** Establish identity and gate every downstream module.
- **Retained scope:** Register, login, JWT issuance (1-day expiry, no refresh tokens), `GET /me`, role-aware middleware.
- **Primary entities:** `users`, `roles`.
- **Coverage:** ~60% of source Module 1 (MFA, SSO, password reset explicitly excluded — none are demo-critical).
- **Why this is enough:** Every other module's authorization decision reduces to one question — "what is `req.user.role`?" — answered once at login and cached in the JWT payload, so no per-request DB join is required for RBAC checks.

## 2.2 Resource Management

- **Purpose:** Single source of truth for bookable physical spaces.
- **Retained scope:** CRUD for Classroom / Laboratory / Seminar Hall, capacity, status (Available/Occupied/Maintenance).
- **Primary entity:** `resources`.
- **Coverage:** Merges source Modules 3 + 4 into one table — ~70% feature parity (room features like projector/whiteboard flags and lab safety-compliance fields dropped; capacity + status retained, which is what the Booking module actually depends on).
- **Lifecycle anchor:** This table is the hub every other module references — `bookings.resource_id` and `assets.assigned_resource_id` both point here, so it must be built first (Day 1).

## 2.3 Booking Engine

- **Purpose:** Conflict-free scheduling — the single feature evaluators will probe hardest.
- **Retained scope:** Create / Approve / Reject / Cancel, atomic overlap check inside a SQLite transaction.
- **Primary entity:** `bookings`.
- **Coverage:** ~55% of source Module 9 — exam scheduling, calendar export, and automated notifications are dropped; the conflict-detection core (the part that actually demonstrates engineering competence) is implemented at full rigor (see Phase 4.3).

## 2.4 Asset Management

- **Purpose:** Track equipment lifecycle and bind it to a physical resource.
- **Retained scope:** CRUD, condition states, `assigned_resource_id` binding.
- **Primary entity:** `assets`.
- **Coverage:** ~45% of source Module 5 — QR codes, depreciation schedules, and disposal workflows dropped; core registry + condition tracking retained, which is sufficient to drive the Maintenance module.

## 2.5 Maintenance Workflow

- **Purpose:** Closed-loop ticketing from issue report to resolution.
- **Retained scope:** Raise ticket against an asset, status transitions (Open → In Progress → Resolved), reporter attribution.
- **Primary entity:** `maintenance_requests`.
- **Coverage:** ~50% of source Module 10 — vendor management and preventive scheduling dropped; the lifecycle that actually closes the loop (asset → ticket → resolution) is fully implemented.

## 2.6 Dashboard

- **Purpose:** Single-screen operational visibility, role-aware.
- **Retained scope:** 4–5 KPI cards (`COUNT` aggregations), 2 Recharts visualizations, 1 simulated budget card.
- **Primary entities:** Read-only aggregation across `resources`, `bookings`, `assets`, `maintenance_requests`.
- **Coverage:** ~50% of source Module 2 — deep per-role personalization dropped; the KPI/chart core retained.

## 2.7 Reports

- **Purpose:** Tabular/aggregate analytics for institutional decision support.
- **Retained scope:** Booking-status breakdown, asset-condition breakdown, maintenance-status breakdown, resource utilization join.
- **Primary entity:** Read-only SQL aggregation, no new table.
- **Coverage:** ~40% of source Module 13 — custom report builder and PDF/Excel export dropped in favor of CSV-only export; core aggregation queries retained.

## 2.8 Resource Lifecycle Continuity (Why the Cuts Don't Break the Story)

Despite an ~85% reduction in entity count (6 tables vs. 100+) and an ~88% reduction in endpoint count (24 vs. 200+), the **full resource lifecycle remains observable end to end**:

```
Resource created (Resources module)
        │
        ▼
Resource booked (Booking module → conflict-checked)
        │
        ▼
Resource equipped with Assets (Asset module → assigned_resource_id)
        │
        ▼
Asset develops a fault (Maintenance module → ticket raised against asset)
        │
        ▼
Ticket resolved (Maintenance module → status closed)
        │
        ▼
Entire lifecycle surfaced (Dashboard KPIs + Reports aggregation)
```

This is the single sentence that defends the architecture in a viva: *"Every module that was cut removed breadth, not depth — the core allocate→book→equip→maintain→report loop is fully implemented and fully demonstrable."*

---

# PHASE 3 — ACTUAL SYSTEM ARCHITECTURE & DATA FLOW

## 3.1 Monorepo Directory Structure

```text
rms-project/
│
├── backend/
│   ├── config/
│   │   └── env.js
│   ├── database/
│   │   ├── rms.db
│   │   ├── initDatabase.js
│   │   └── seedDatabase.js
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification
│   │   ├── roleMiddleware.js        # authorize('admin', ...) factory
│   │   └── errorMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── roleRoutes.js
│   │   ├── userRoutes.js
│   │   ├── resourceRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── assetRoutes.js
│   │   ├── maintenanceRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── reportRoutes.js
│   ├── controllers/
│   ├── services/
│   │   └── bookingConflictService.js   # isolates the transaction logic (Phase 4.3)
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── validator.js
│   │   └── response.js                 # { success, message, data } envelope
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Resources.jsx
│       │   ├── Bookings.jsx
│       │   ├── Assets.jsx
│       │   ├── Maintenance.jsx
│       │   └── Reports.jsx
│       ├── components/
│       │   ├── layout/ (Sidebar.jsx, Header.jsx, ProtectedLayout.jsx)
│       │   ├── shared/ (PageHeader, StatCard, StatusBadge, DataTable, EmptyState, Modal, FormInput)
│       │   └── forms/ (ResourceForm, BookingForm, AssetForm, TicketForm)
│       ├── services/ (axios.js, authService.js, resourceService.js, bookingService.js, assetService.js, maintenanceService.js, reportService.js)
│       ├── context/AuthContext.jsx
│       ├── hooks/useAuth.js
│       └── App.jsx
│
├── docs/
│   └── (README, schema diagrams, screenshots for the academic report — Phase 8)
│
└── README.md
```

**Design rationale:** a flat `routes → controllers → services` split (no microservice boundaries, no message queue) keeps every request traceable in under 4 file hops, which matters more for a 72-hour single-developer build than any horizontal-scaling concern.

## 3.2 Express Middleware Order

```text
CORS
  ↓
express.json() body parser
  ↓
Route-level: authMiddleware (verifies JWT, attaches req.user)
  ↓
Route-level: roleMiddleware / authorize(...allowedRoles) (RBAC gate)
  ↓
Controller (business logic)
  ↓
SQLite transaction (BEGIN / mutate / COMMIT|ROLLBACK)
  ↓
response.js envelope → res.json({ success, message, data })
  ↓
errorMiddleware (catches thrown errors, normalizes error envelope)
```

## 3.3 Role-Based Middleware Verification Loop (pseudocode)

```javascript
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, email, role }
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden for this role' });
    }
    next();
  };
}

// Usage:
router.delete('/resources/:id', authMiddleware, authorize('admin'), resourceController.remove);
```

## 3.4 Canonical SQLite Schema (Exact Data Types — 6 Tables)

> This schema is the single source of truth for the project. It supersedes the `notifications`/`activity_logs` 6th-table proposals found in earlier drafts — those violated the fixed constraint and have been discarded.

```sql
PRAGMA foreign_keys = ON;

-- 1. roles ---------------------------------------------------------------
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. users -----------------------------------------------------------------
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active','Inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(role_id) REFERENCES roles(id)
);

-- 3. resources ---------------------------------------------------------------
CREATE TABLE resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Classroom','Laboratory','Seminar Hall')),
    capacity INTEGER NOT NULL CHECK(capacity > 0),
    status TEXT NOT NULL DEFAULT 'Available' CHECK(status IN ('Available','Occupied','Maintenance')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. bookings ---------------------------------------------------------------
CREATE TABLE bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    resource_id INTEGER NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Approved','Rejected','Cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(resource_id) REFERENCES resources(id),
    CHECK(start_time < end_time)
);

-- 5. assets ---------------------------------------------------------------
CREATE TABLE assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_name TEXT NOT NULL,
    category TEXT NOT NULL,
    serial_number TEXT NOT NULL UNIQUE,
    condition TEXT NOT NULL CHECK(condition IN ('Available','Assigned','Damaged','Under Repair')),
    assigned_resource_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(assigned_resource_id) REFERENCES resources(id)
);

-- 6. maintenance_requests ---------------------------------------------------
CREATE TABLE maintenance_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    reported_by INTEGER NOT NULL,
    issue TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','In Progress','Resolved')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(asset_id) REFERENCES assets(id),
    FOREIGN KEY(reported_by) REFERENCES users(id)
);
```

### Indexes

```sql
CREATE INDEX idx_users_email           ON users(email);
CREATE INDEX idx_users_role             ON users(role_id);
CREATE INDEX idx_bookings_resource_date ON bookings(resource_id, booking_date);
CREATE INDEX idx_bookings_time          ON bookings(start_time, end_time);
CREATE INDEX idx_assets_resource        ON assets(assigned_resource_id);
CREATE INDEX idx_assets_condition       ON assets(condition);
CREATE INDEX idx_maintenance_asset      ON maintenance_requests(asset_id);
CREATE INDEX idx_maintenance_reporter   ON maintenance_requests(reported_by);
CREATE INDEX idx_maintenance_status     ON maintenance_requests(status);
```

### ER Diagram

```text
roles
 │
 └──── users
          │
          ├──── bookings
          │
          └──── maintenance_requests (reported_by)

resources
 │
 ├──── bookings
 │
 └──── assets (assigned_resource_id)

assets
 │
 └──── maintenance_requests (asset_id)
```

**Normalization check:** 1NF (atomic columns) ✓, 2NF (no partial dependencies — every non-key column depends on the whole PK) ✓, 3NF (no transitive dependencies — `role`, `status`, `condition` are CHECK-constrained enums, not derived data) ✓.

## 3.5 End-to-End Data Flow — A Booking Mutation Request

```text
┌──────────┐   HTTP POST /api/bookings   ┌───────────────┐
│  React   │ ───────────────────────────▶│  Express App  │
│  Client  │   Authorization: Bearer JWT  │               │
└──────────┘                              └──────┬────────┘
                                                  │
                                          CORS + JSON parse
                                                  │
                                                  ▼
                                     authMiddleware (verify JWT)
                                                  │
                                         req.user = {id, email, role}
                                                  │
                                                  ▼
                                 authorize('admin','faculty','student')
                                                  │ (maintenance role → 403)
                                                  ▼
                                       bookingController.create()
                                                  │
                                                  ▼
                                  BEGIN TRANSACTION (better-sqlite3)
                                                  │
                                   SELECT conflict check (resource_id,
                                   booking_date, overlapping time range)
                                                  │
                                   ┌──────────────┴──────────────┐
                                   │                              │
                              rows found                     no rows
                                   │                              │
                              ROLLBACK                    INSERT INTO bookings
                                   │                              │
                          409 Conflict response             COMMIT
                                   │                              │
                                   │                       201 Created response
                                   ▼                              ▼
                         { success:false,             { success:true,
                           message:"Booking            data:{ booking } }
                           conflict detected" }
```

This is the canonical path every mutating endpoint follows — only the controller and the SQL inside the transaction change between modules.

---

# PHASE 4 — COMPLETE MVP FUNCTIONAL SPECIFICATION

## 4.1 Auth & RBAC

**JWT Payload (signed, 1-day expiry):**

```json
{
  "id": 3,
  "email": "faculty1@rms.com",
  "role": "faculty"
}
```

**Mechanics:**

| Step | Detail |
|---|---|
| Register | `POST /api/auth/register` → validate email uniqueness → `bcrypt.hash(password, 10)` → resolve `role_id` from `roles` table by name → `INSERT INTO users` |
| Login | `POST /api/auth/login` → fetch user by email → `bcrypt.compare` → on success, sign JWT with `{id, email, role}` → return `{ token, user }` |
| Session | `GET /api/auth/me` → `authMiddleware` decodes JWT → re-fetch user row → return sanitized profile (no password_hash) |
| Logout | Client-side token discard only (no server-side blacklist — out of scope for MVP) |

**Role restrictions (explicit, enforced server-side via `authorize()`):**

| Action | Allowed Roles |
|---|---|
| Create/Edit/Delete Resource | `admin` |
| Create Booking | `admin`, `faculty`, `student` |
| Approve/Reject Booking | `admin` |
| Cancel own Booking | owner of the booking row (any role) |
| Create/Edit/Delete Asset | `admin` |
| Raise Maintenance Ticket | `admin`, `faculty`, `maintenance` |
| Update Ticket Status | `admin`, `maintenance` |
| View Reports | `admin`, `faculty`, `maintenance` |

Deliberately excluded: forgot-password flow, email verification, OAuth, refresh tokens — none are evaluator-visible in a 5–7 minute live demo and each would consume hours better spent on the booking conflict engine.

## 4.2 Resource Management — CRUD Mechanics

- **Create:** `POST /api/resources` (admin only) → validate `type ∈ {Classroom, Laboratory, Seminar Hall}` and `capacity > 0` (enforced at both the Express validator layer and the SQLite `CHECK` constraint — defense in depth) → insert, default `status = 'Available'`.
- **Read:** `GET /api/resources` (all roles) → optional query filters `?type=` and `?status=` for the frontend toolbar's type filter.
- **Update:** `PUT /api/resources/:id` (admin only) → partial update of name/capacity/status.
- **Delete:** `DELETE /api/resources/:id` (admin only) → hard delete; MVP does not implement soft-delete/audit trail (flagged as a defensible scope cut, not an oversight).
- **Frontend sequence:** Backend CRUD verified in Postman → table renders rows → form drives create/edit → client-side validation mirrors the server `CHECK` constraints so invalid states never reach the network layer.

## 4.3 Conflict-Free Booking Engine

**Slot allocation flow:**

```text
Booking Request
   ↓
BEGIN TRANSACTION
   ↓
SELECT id FROM bookings
WHERE resource_id = ?
  AND booking_date = ?
  AND status IN ('Pending','Approved')
  AND (start_time < ? AND end_time > ?)   -- new_end_time, new_start_time
   ↓
rows found? ──Yes──▶ ROLLBACK ──▶ 409 { success:false, message:"Booking conflict detected" }
   │
   No
   ↓
INSERT INTO bookings (...) VALUES (..., 'Pending')
   ↓
COMMIT ──▶ 201 { success:true, data:{ booking } }
```

**Why the overlap predicate works:** for an existing booking `[09:00, 11:00)` and a new request `[10:00, 12:00)`, the condition evaluates `09:00 < 12:00 AND 11:00 > 10:00` → both true → conflict correctly detected. A naive `UNIQUE(resource_id, booking_date, start_time)` constraint would **not** catch this case (the start times differ), which is precisely why the overlap query — not a unique index — is the load-bearing validation here.

**Lifecycle:** `Pending → Approved` (admin) | `Pending → Rejected` (admin) | `Pending/Approved → Cancelled` (owner). No `Completed` state is persisted in MVP — completion is inferred client-side once `booking_date` has passed.

**Explicitly out of scope:** Redis-backed locking, message-queue-based reservation holds, distributed locks — a single SQLite transaction is sufficient because the entire application is one Node process with one writer.

## 4.4 Asset Tracking & Maintenance Lifecycle

- **Asset registration:** `POST /api/assets` (admin) → `serial_number` enforced `UNIQUE` at the DB layer to prevent duplicate registry entries.
- **Assignment binding:** setting `assigned_resource_id` on an asset (e.g., binding "Projector — SN-001" to "Room 101") is a `PUT /api/assets/:id` call; this is what turns a generic equipment registry into a per-room inventory view.
- **Ticket raising:** `POST /api/maintenance` → requires `asset_id` + `issue` text; `reported_by` is taken from `req.user.id`, never trusted from client input.
- **Status update:** `PUT /api/maintenance/:id/status` (admin/maintenance only) → transitions `Open → In Progress → Resolved`; no backward transition is permitted by the controller (a `Resolved` ticket cannot be reopened in MVP — re-raise instead).
- **Closed loop:** a `Resolved` ticket does not automatically revert the parent asset's `condition` — this is an intentional manual admin action (`PUT /api/assets/:id` setting `condition = 'Available'`), keeping the state machine simple and demo-predictable rather than introducing implicit cascading writes.

## 4.5 Screen-to-Role Visibility Matrix (Reconciled)

> Earlier drafts (`phase3.txt`, `phase6.txt`) proposed two different visibility matrices. The table below is the single canonical version, aligned to the FR/RBAC table that anchors the academic report (Phase 8).

| Screen | Admin | Faculty | Student | Maintenance |
|---|---|---|---|---|
| Login | ✅ | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Resources | ✅ CRUD | ✅ view + book | ✅ view + book | ❌ |
| Bookings | ✅ approve/reject | ✅ create/cancel own | ✅ create/cancel own | ❌ |
| Assets | ✅ CRUD | ❌ | ❌ | 👁 read-only (needed to raise tickets against known assets) |
| Maintenance | ✅ assign/resolve | ✅ raise ticket only | ❌ | ✅ update status/close |
| Reports | ✅ all reports | ✅ booking/utilization report | ❌ | ✅ maintenance report |

Frontend enforcement is conditional rendering (`{user.role === 'admin' && <Action/>}`); backend enforcement is the `authorize()` middleware from Phase 3.3 — **the frontend check is a UX convenience, never the security boundary.**

## 4.6 Dashboard & Analytics

**KPI Cards (`GET /api/dashboard/summary`):**

| KPI | Query |
|---|---|
| Total Resources | `SELECT COUNT(*) FROM resources` |
| Active Bookings | `SELECT COUNT(*) FROM bookings WHERE status='Approved'` |
| Pending Approvals | `SELECT COUNT(*) FROM bookings WHERE status='Pending'` |
| Total Assets | `SELECT COUNT(*) FROM assets` |
| Open Tickets | `SELECT COUNT(*) FROM maintenance_requests WHERE status != 'Resolved'` |

**Simulated Budget Visualizer** (static card, no `budget` table):

```text
Budget Allocated:  ₹5,00,000
Used:              ₹3,25,000
Remaining:         ₹1,75,000
```
Color-coded Allocated = blue, Used = amber, Remaining = green. Rendered from a hardcoded constant in the frontend — explicitly disclosed as simulated in both the dashboard footnote and the viva script (Phase 6.6).

**Recharts integrations:**

| Chart | Type | Data Shape |
|---|---|---|
| Resource Utilization | `PieChart` | `[{ name:"Classroom", count:15 }, { name:"Laboratory", count:8 }, { name:"Seminar Hall", count:4 }]` |
| Asset Condition Distribution | `BarChart` | `[{ condition:"Available", count:10 }, { condition:"Assigned", count:6 }, { condition:"Damaged", count:2 }]` |

Both charts wrap in `<ResponsiveContainer>` and degrade to an `EmptyState` ("No Data Available") when the underlying aggregation returns zero rows — required so the dashboard never renders a blank/broken chart during a live demo.

---

# PHASE 5 — ENGINEERING DECISION MATRIX

> Framed for an internship/academic evaluation defense: every "no" below is paired with the specific reason it doesn't improve the marks-to-effort ratio at this scope.

## 5.1 SQLite vs. PostgreSQL

| Dimension | SQLite (Chosen) | PostgreSQL |
|---|---|---|
| Setup overhead | Zero — file-based, no service to install/run | Requires installed server, connection pooling, credentials |
| Concurrency model | Single-writer lock; acceptable for a single-evaluator demo with 4–8 seed users | True MVCC; needed only at multi-tenant/multi-campus scale |
| Deployment | Ships inside the Node process; trivial on Render free tier | Needs a managed DB add-on; extra moving part to demo around |
| Development velocity | `better-sqlite3` is synchronous — no callback/promise overhead in controllers | Async driver adds boilerplate with no demo-visible benefit |
| Honest trade-off | Not production-multi-user-safe at scale | This is explicitly logged as a **Future Scope migration item**, not hidden |

**Verdict:** SQLite is correct for this scope. The trade-off is real but irrelevant to a 72-hour, single-evaluator demonstration.

## 5.2 Monolith vs. Microservices

| Dimension | Monolith (Chosen) | Microservices |
|---|---|---|
| Infra to operate | None — one Express process | Kafka/RabbitMQ/Redis/Docker/K8s, explicitly excluded by the fixed constraints |
| Debug surface | One log stream, one stack trace | Distributed tracing required just to find which service failed |
| Team size fit | 1 developer | Designed for independently-deployed teams — wrong tool for a solo build |
| Evaluator expectation | A working, demoable system | Evaluators award marks for working software, not infrastructure complexity an internship project has no organizational need for |

**Verdict:** microservices would *reduce* the achievable score here — every hour spent on service boundaries is an hour not spent on the booking conflict engine, which is what's actually graded.

## 5.3 Lean 6-Table Schema vs. Full ERP Schema (100+ Tables)

| Dimension | 6-Table MVP (Chosen) | Full ERP (100+ tables) |
|---|---|---|
| Build time for schema + seed | ~2 hours (Day 1) | Multi-week effort, alone |
| Normalization | Fully 1NF/2NF/3NF (Phase 3.4) | Also normalizable, but irrelevant if it can't be built in time |
| Resource-lifecycle coverage | 100% of the allocate→book→equip→maintain→report loop | Same coverage, plus modules with zero MVP requirement (HR, Library, Payroll) |
| Risk of incomplete delivery | Low — scope matches the clock | High — a 72-hour deadline against a 100-table schema all but guarantees an unfinished, undemonstrable system |

**Verdict:** the lean schema isn't a compromise version of the full ERP — for *this specific deadline*, it is the only schema that produces a complete, working, demoable system at all. An unfinished 100-table system scores zero; a finished 6-table system scores on every rubric line it touches.

## 5.4 What This Buys (and What It Doesn't)

This MVP deliberately **does not** model: HR/payroll, library circulation, multi-campus tenancy, AI-driven scheduling, predictive maintenance, or a real procurement/finance ledger. Each is named explicitly in Future Scope (Phase 6 viva prep) rather than silently dropped — an evaluator who asks "why isn't X here?" gets a one-line, prepared, confident answer rather than an improvised one.

---

# PHASE 6 — HOUR-BY-HOUR 3-DAY IMPLEMENTATION SPRINT

## 6.1 Pre-Sprint Setup — Hour 0 (Target: 90 minutes max)

| Task | Time | Deliverable |
|---|---|---|
| Git init, `.gitignore` (`node_modules`, `.env`, `*.db`, `dist`, `build`) | 10 min | Repo exists |
| Folder skeleton (`backend/`, `frontend/`, `docs/`) | 10 min | Structure matches Phase 3.1 |
| Backend scaffold: `npm init -y && npm install express cors dotenv bcryptjs jsonwebtoken better-sqlite3 express-validator` + `nodemon` (dev) | 20 min | `server.js` boots |
| Frontend scaffold: `npm create vite@latest frontend -- --template react` + `axios react-router-dom recharts` + Tailwind | 20 min | Vite dev server boots |
| SQLite setup: `database/initDatabase.js`, `seedDatabase.js` | 10 min | Empty `rms.db` created |
| `.env`: `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN=1d` | 5 min | Config externalized |
| Adopt response envelope `{ success, message, data }` everywhere | — | Predictable frontend integration |

## 6.2 DAY 1 — Foundation (Auth, RBAC, Resources, Dashboard Skeleton)

**Goal:** Database ✓ · Authentication ✓ · RBAC ✓ · Resource CRUD ✓ · Dashboard skeleton ✓

| Block | Duration | Tasks | Risk → Fallback |
|---|---|---|---|
| Database implementation | 2h | Create tables in dependency order: `roles → users → resources → assets → bookings → maintenance_requests`; seed 4 roles, 8 users (2 per role), 3 resources, 3 assets, 1 booking, 1 ticket | Schema breaks → delete `rms.db`, rerun `initDatabase.js`; never hand-edit the DB file |
| Authentication | 2h | `authMiddleware.js`, `utils/jwt.js`, `routes/authRoutes.js`; bcrypt hash/compare; `POST /register`, `POST /login`, `GET /me`; frontend `Login.jsx` + `AuthContext` + `ProtectedRoute` | Cannot login → hardcode a known-good admin row in the seed script as a guaranteed demo fallback |
| RBAC | 1h | Add `role_id → roles` resolution; build `authorize(...)` middleware; protect Resource-create, Asset-create, Booking-approval routes | Faculty can do admin actions → re-check middleware is applied *before* the controller, not after |
| Resource CRUD | 3h | Hour 1: backend `GET/POST/PUT/DELETE /resources`, Postman-verified. Hour 2: frontend table (Name/Type/Capacity/Status). Hour 3: form with required-field + `capacity > 0` validation | Shortcut explicitly allowed: no pagination, no sorting, no bulk actions |
| Dashboard skeleton | 1h | Sidebar (6 nav items) + Header + 4 KPI card placeholders + 1 placeholder chart; KPI values may be mock data until Day 3 | — |

**Day 1 Exit Criteria (STOP and do not start Bookings until all are checked):**
`[ ]` Login `[ ]` Register `[ ]` JWT `[ ]` RBAC `[ ]` Resources CRUD `[ ]` Login screen `[ ]` Dashboard layout `[ ]` Resources screen `[ ]` Seed data loads

## 6.3 DAY 2 — Core Workflows (Booking, Assets, Maintenance, Role Restrictions)

**Goal:** Complete RMS core workflow.

| Block | Duration | Tasks | Risk → Fallback |
|---|---|---|---|
| Booking module | 3h | Hour 1: schema/`POST`+`GET /bookings`. Hour 2: approve/reject/cancel transitions. Hour 3: frontend form + table. Conflict query + transaction per Phase 4.3 | Overlap logic fails → temporarily disable the *approve* action (keep create/reject) so the demo still runs while the query is fixed live |
| Asset module | 3h | Hour 1: DB + CRUD APIs. Hour 2: frontend table. Hour 3: condition status badges | Status management bugs → fall back to a flat table with no badges, still functional |
| Maintenance module | 2h | Hour 1: ticket creation (`POST /maintenance`). Hour 2: status update endpoint + transitions | Role restriction bug → temporarily allow all authenticated roles to update status, tighten after demo prep |
| Role restrictions pass | 1h | Sweep every protected route for `authorize()`; sweep every frontend action button for `{user.role === ...}` guards | — |

**Day 2 Exit Criteria:** `[ ]` Book Resource `[ ]` Approve `[ ]` Reject `[ ]` Conflict Detection `[ ]` Asset CRUD `[ ]` Ticket Creation `[ ]` Ticket Status Update `[ ]` Role Restrictions — **nothing else starts until this list is complete.**

## 6.4 DAY 3 — Reports, Polish, QA, Documentation, Packaging

**Goal:** Submission-ready project.

| Block | Duration | Tasks |
|---|---|---|
| Reports | 2h | SQL `GROUP BY` aggregations for booking/asset/maintenance status; CSV export only (no PDF) |
| Recharts | 2h | Wire `PieChart` (utilization) + `BarChart` (asset condition) to live `/api/reports/overview` data; remove Day-1 mock data |
| Rapid QA pass | 2h | Execute the test matrix in 6.5 below; pass criterion = every workflow completes with zero console errors |
| Documentation | 2h | README, install steps, architecture diagram, DB design, API list, screenshots, future scope — target 15–20 pages |
| Presentation packaging | 2h | 12–13 slide deck (Phase 8 outline), demo script rehearsal, screenshot capture |

## 6.5 QA Test Matrix

| Feature | Test | Pass Criterion |
|---|---|---|
| Login | Submit valid credentials | Token returned, redirect to Dashboard |
| RBAC | Faculty attempts admin-only action | 403 returned, UI hides the action |
| Resource CRUD | Create → Edit → Delete | Each operation reflected immediately in table |
| Booking | Submit overlapping slot | 409 conflict returned, no row inserted |
| Asset | CRUD + assign to resource | `assigned_resource_id` persists correctly |
| Maintenance | Raise → progress → resolve | Status transitions in order, no skip/reopen |
| Dashboard | Compare KPI cards to raw `COUNT(*)` queries | Numbers match exactly |

## 6.6 Risk Elimination Table (Sprint-Wide)

| Risk | Warning Sign | Recovery |
|---|---|---|
| JWT bug | Cannot log in | Hardcoded seed admin credentials as guaranteed fallback |
| DB corruption | Missing/garbled data | Delete `rms.db`, rerun `initDatabase.js` + `seedDatabase.js` |
| Booking logic failure | Conflict check not firing | Temporarily disable approval action; keep create/reject live |
| UI crash | Blank screen | Fallback to a plain `<table>` render, no styling dependency |
| Render deploy failure | Deploy error mid-demo | Always keep a local instance running as the rollback demo path |

## 6.7 Deployment Checklist

```bash
# Local
npm install
node initDatabase.js
npm run dev

# Render (backend env)
JWT_SECRET=...
PORT=...
```

Smoke test before any live demo: Login → Resources → Booking → Asset → Maintenance → Dashboard, in that order.

---

# PHASE 7 — AI-ASSISTED PROJECT MEMORY SCAFFOLDING

A 72-hour AI-assisted build loses far more time to **context drift across sessions** (the AI re-inventing a schema or endpoint shape it already settled on) than to typing speed. The three files below are pasted at the start of every new AI session to re-anchor state.

## 7.1 `PROJECT_BRAIN.md` — System State Tracker

```markdown
# PROJECT_BRAIN.md — RMS MVP System State Tracker

## Project Identity
- Name: Smart Resource Booking & Asset Management System (RMS MVP)
- Stack: React + Tailwind | Node + Express | SQLite (better-sqlite3) | JWT | Recharts
- Locked constraints: 6 tables / 7 screens / 24 APIs / 1 developer / 72 hours
- Deployment target: Localhost or Render monolith — no Docker, no message queues

## Build Phase Checklist
- [ ] Day 1: Auth + RBAC + Resources + Dashboard skeleton
- [ ] Day 2: Bookings + Assets + Maintenance + Role restrictions
- [ ] Day 3: Reports + Charts + QA + Docs + PPT

## Schema State (source of truth — never let the AI regenerate this from memory)
1. roles(id, name, created_at)
2. users(id, name, email, password_hash, role_id→roles, status, created_at)
3. resources(id, name, type, capacity, status, created_at)
4. bookings(id, user_id→users, resource_id→resources, booking_date, start_time, end_time, status, created_at)
5. assets(id, asset_name, category, serial_number, condition, assigned_resource_id→resources, created_at)
6. maintenance_requests(id, asset_id→assets, reported_by→users, issue, status, created_at)

## Completed Endpoints (check off as built — see API_CONTRACTS.md for shapes)
- [ ] POST /api/auth/register   - [ ] POST /api/auth/login   - [ ] GET /api/auth/me
- [ ] GET /api/roles
- [ ] GET /api/users
- [ ] GET /api/resources  - [ ] GET /api/resources/:id  - [ ] POST/PUT/DELETE /api/resources(/:id)
- [ ] GET /api/bookings  - [ ] POST /api/bookings  - [ ] PUT /:id/approve  - [ ] PUT /:id/reject  - [ ] PUT /:id/cancel
- [ ] GET /api/assets  - [ ] POST/PUT/DELETE /api/assets(/:id)
- [ ] GET /api/maintenance  - [ ] POST /api/maintenance  - [ ] PUT /:id/status
- [ ] GET /api/dashboard/summary
- [ ] GET /api/reports/overview

## Decisions Log (why X over Y — do not re-litigate these mid-build)
- 6th/5th tables are `roles` + `maintenance_requests`, not `notifications`/`activity_logs` (locked constraint).
- SQLite over PostgreSQL; Monolith over microservices (Phase 5).
- Booking conflict via transactional overlap query, not a UNIQUE index (Phase 4.3).

## Known Issues / Technical Debt
- (append here as discovered — do not silently fix without logging)

## Next Session Resume Point
- (update at the end of every work session with the exact next task)
```

## 7.2 `API_CONTRACTS.md` — Endpoint Contracts (24 Endpoints)

> Full contracts shown for the non-trivial endpoints; simple CRUD GETs are shown compactly. All responses use the envelope `{ success, message, data }`.

**Auth (3)**
```http
POST /api/auth/register
Request:  { "name":"John", "email":"john@test.com", "password":"123456", "role":"student" }
Response: { "success":true, "data":{ "id":9, "name":"John", "email":"john@test.com", "role":"student" } }

POST /api/auth/login
Request:  { "email":"admin1@rms.com", "password":"password123" }
Response: { "success":true, "data":{ "token":"<jwt>", "user":{ "id":1, "role":"admin" } } }

GET /api/auth/me   (Bearer token)
Response: { "success":true, "data":{ "id":1, "name":"Admin One", "email":"admin1@rms.com", "role":"admin" } }
```

**Roles (1) / Users (1)**
```http
GET /api/roles   → data: [ {"id":1,"name":"Admin"}, {"id":2,"name":"Faculty"}, ... ]
GET /api/users    (admin only) → data: [ {"id":3,"name":"Dr Smith","email":"...","role":"faculty"}, ... ]
```

**Resources (5)**
```http
GET    /api/resources              → data: [ {id,name,type,capacity,status}, ... ]
GET    /api/resources/:id          → data: { id,name,type,capacity,status }
POST   /api/resources   (admin)    Request: { "name":"Room 102","type":"Classroom","capacity":40 }
PUT    /api/resources/:id (admin)  Request: { "status":"Maintenance" }
DELETE /api/resources/:id (admin)
```

**Bookings (5)**
```http
GET  /api/bookings                 → data: [ {id,resource_id,user_id,booking_date,start_time,end_time,status}, ... ]
POST /api/bookings
  Request:  { "resource_id":1, "booking_date":"2026-06-30", "start_time":"10:00", "end_time":"11:00" }
  Success:  { "success":true, "data":{ "id":12, "status":"Pending" } }
  Conflict: { "success":false, "message":"Booking conflict detected" }   (HTTP 409)
PUT /api/bookings/:id/approve  (admin)
PUT /api/bookings/:id/reject   (admin)
PUT /api/bookings/:id/cancel   (owner)
```

**Assets (4)**
```http
GET    /api/assets                 → data: [ {id,asset_name,category,serial_number,condition,assigned_resource_id}, ... ]
POST   /api/assets   (admin)       Request: { "asset_name":"Projector","category":"Electronics","serial_number":"SN-004" }
PUT    /api/assets/:id (admin)     Request: { "condition":"Under Repair", "assigned_resource_id":2 }
DELETE /api/assets/:id (admin)
```

**Maintenance (3)**
```http
GET  /api/maintenance              → data: [ {id,asset_id,reported_by,issue,status}, ... ]
POST /api/maintenance              Request: { "asset_id":1, "issue":"Projector lamp flickering" }
PUT  /api/maintenance/:id/status   (admin/maintenance)  Request: { "status":"In Progress" }
```

**Dashboard (1) / Reports (1)**
```http
GET /api/dashboard/summary
  → data: { "totalResources":3, "activeBookings":1, "pendingApprovals":0, "totalAssets":3, "openTickets":2 }

GET /api/reports/overview
  → data: {
      "bookingsByStatus":      [ {"status":"Approved","count":5}, {"status":"Pending","count":2} ],
      "assetsByCondition":     [ {"condition":"Available","count":4}, {"condition":"Assigned","count":3} ],
      "maintenanceByStatus":   [ {"status":"Open","count":1}, {"status":"Resolved","count":2} ],
      "resourceUtilization":   [ {"name":"Room 101","bookingCount":7} ]
    }
```

**Total: 3 + 1 + 1 + 5 + 5 + 4 + 3 + 1 + 1 = 24 endpoints** — inside the 20–25 constraint.

## 7.3 `DB_SCHEMA.sql`

The exact script is the one specified in Phase 3.4 (all 6 `CREATE TABLE` statements + the 9 indexes). It should be saved verbatim as `backend/database/DB_SCHEMA.sql` and executed by `initDatabase.js` — never paraphrased or regenerated by an AI assistant mid-project, which is precisely the drift this file exists to prevent.

## 7.4 How These Three Files Prevent Context Loss

1. **Start of every new AI session:** paste `PROJECT_BRAIN.md` first. It tells the assistant exactly which phase is active and which decisions are already closed — preventing it from re-proposing a `notifications` table or a different JWT payload shape, the way the early drafts in this very project drifted from each other.
2. **Any time the AI is asked to write a frontend service call or a new backend route:** paste the relevant block of `API_CONTRACTS.md` so field names match exactly — this is what stops `assigned_to` vs `assigned_resource_id` vs `assigned_location` naming drift (an inconsistency this consolidation pass had to resolve manually across the source drafts).
3. **Any time the AI touches the database layer:** `DB_SCHEMA.sql` is supplied verbatim, not described in prose — prose descriptions are exactly how the 6th-table conflict (`notifications` vs `activity_logs` vs `roles`) crept into the earlier drafts in the first place.
4. **End of every session:** update the "Next Session Resume Point" and "Decisions Log" in `PROJECT_BRAIN.md` before closing — a 30-second habit that eliminates the single biggest time sink in AI-assisted solo development: re-explaining the project from scratch.

---

# PHASE 8 — ACADEMIC TECHNICAL REPORT STRUCTURE

Target length: **20–25 pages**, 14 chapters. Every directive below is scoped to the lean 7-module MVP — none of these chapters should reference HR, Library, Payroll, or any other deferred module except inside "Future Scope."

| # | Chapter | Pages | Content Directives |
|---|---|---|---|
| 1 | Abstract | 1 | State the problem (manual/fragmented institutional resource management) in 2 sentences; name the proposed solution (centralized booking + asset + maintenance platform); list the exact stack (React/Tailwind, Node/Express, SQLite, JWT, Recharts); state the methodology (modular monolith, RESTful, 72-hour single-developer cycle); summarize results (RBAC, conflict-free booking, asset tracking, maintenance ticketing, dashboard analytics all functional); 1-sentence conclusion. Include a 10–12 term keyword list. |
| 2 | Problem Statement | 1 | Open with institutional context (rooms/labs/equipment shared across many users). List 4 concrete pain points: double-booking, manual asset tracking, delayed maintenance, no centralized visibility. Close with one formal problem-statement paragraph and one research-motivation paragraph — do not introduce HR/Library pain points, since the MVP doesn't address them. |
| 3 | Objectives | 1 | 5 primary objectives (centralize resource mgmt, RBAC, conflict-free booking, asset visibility, maintenance workflow) + 3 secondary (analytics, reduced manual effort, operational transparency). Include the success-metric table mapping each objective to a measurable outcome (e.g., "Booking System → Conflict Detection Enabled"). |
| 4 | Existing System Analysis | 1 | Cover 3 existing approaches: manual/paper-based, spreadsheet tracking, legacy ERP (and why legacy ERP is too heavy for this context). Include a Limitation→Impact table and a Gap Analysis table (Requirement vs. Existing System vs. Proposed RMS) scoped to the 6 in-scope modules only. |
| 5 | Proposed System Analysis | 2 | Justify the MVP reduction explicitly: state the scope decision (6 modules, not 14) and the architecture simplification (6 tables / 7 screens / 24 APIs). Include an Existing-vs-Proposed comparison table (Scheduling: Manual→Automated; Assets: Spreadsheet→Centralized; Maintenance: Manual→Ticket-based; Reporting: Limited→Dashboard). |
| 6 | Requirements Analysis | 2 | Reproduce the FR table (Phase 1.3) and NFR table (Phase 1.4) verbatim from this blueprint. Include the RBAC matrix from Phase 4.5 as the "User Role Matrix." |
| 7 | System Architecture | 1 | Reproduce the 3-tier narrative (React ↔ REST API ↔ SQLite) and the data-flow diagram from Phase 3.5. Figure captions: "System Architecture Diagram," "Deployment Diagram." |
| 8 | Database Design | 2 | List exactly 6 tables (Roles, Users, Resources, Bookings, Assets, Maintenance Requests) with a one-line description, PK, FKs per table. Include the ER diagram from Phase 3.4. State the booking-conflict-prevention mechanism in one paragraph (overlap query, not UNIQUE constraint). |
| 9 | UI & Screenshots | 4–5 | One sub-section per screen (Login, Dashboard, Resources, Bookings, Assets, Maintenance, Reports) — for each: purpose, key components, user actions, screenshot placeholder with figure caption ("Figure 9.N – <Screen> Module"). |
| 10 | Testing & Validation | 2 | Reproduce the QA test matrix (Phase 6.5) as the functional test table with Pass/Fail column filled from actual test runs. Add one short Integration Testing paragraph (Frontend↔API, API↔SQLite) and one User Acceptance Testing paragraph describing the institutional demo scenario walked. |
| 11 | Results & Discussion | 1 | State observed performance (API latency under demo load), then a Functional Coverage table (module → Completed), then 1 paragraph of discussion tying back to the Phase 2.8 lifecycle-continuity narrative. |
| 12 | Conclusion | 1 | One paragraph restating problem→solution→outcome. Bullet list of 4–5 technical achievements (JWT auth, RBAC, conflict-free booking, dashboard analytics, responsive UI). |
| 13 | Future Scope | 1 | Reproduce the Phase 1.3 / 5.4 deferred-module list verbatim (HR, Library, Payroll, multi-campus, AI scheduling, predictive maintenance, PostgreSQL migration, mobile app) — each with a one-line "why it's future, not MVP" justification. |
| 14 | References | 1 | IEEE-numbered, cited in order of first appearance: React docs, Node.js docs, Express.js docs, SQLite docs, JWT/Auth0 docs, Tailwind CSS docs, Recharts docs — 7 references minimum, all official documentation sources (no blog aggregators). |

**Demo script (for the Results/UAT chapters and the live viva):**
```
Login → Dashboard → Add Room → Book Room → Approve Booking →
Add Asset → Create Maintenance Ticket → View Report
```
Target demo time: 5–7 minutes.

---

## CLOSING VALIDATION SUMMARY

| Fixed Constraint | Status |
|---|---|
| Exactly 6 tables (`roles, users, resources, bookings, assets, maintenance_requests`) | ✅ |
| Exactly 7 screens | ✅ |
| 20–25 APIs | ✅ (24) |
| React / Tailwind / Node / Express / SQLite / JWT / Recharts only | ✅ |
| No Kafka / RabbitMQ / Redis / Docker / microservices | ✅ |
| Single developer / 72 hours | ✅ |
| Full resource lifecycle (allocate→book→equip→maintain→report) preserved | ✅ |
| All prior draft conflicts (schema, naming, RBAC matrix) reconciled to one canonical version | ✅ |

This blueprint is the single document that should now drive the build — every other file in this upload (`resources_project.txt`, `phase2.txt`–`phase7.txt`) has been superseded by it and can be archived once the team confirms no further deviations are needed.

