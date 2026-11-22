# 02. Functional & Non-Functional Requirements

## 1. Functional Decomposition by Module

The TaskFlow platform encompasses 10 functional modules directly implemented in the source code:

### Module 1: Authentication & User Profile Management
- **FR-01 (User Registration):** Allows unauthenticated visitors to register with a full name, valid email address, and password (minimum 6 characters). Role is strictly defaulted to `Employé` on public sign-up.
- **FR-02 (User Authentication):** Validates user credentials against Bcrypt password hashes, issues a signed JWT with 7-day validity, and stores user session in browser `localStorage`.
- **FR-03 (3D Biometric Visual Feedback):** Renders a Three.js interactive 3D orb that dynamically alters color and rotation speed based on user form interaction (idle cyan, password violet, success green, error shake red).
- **FR-04 (Profile Modification):** Authenticated users can modify their display name and change their password by verifying their existing password via `PUT /api/auth/profile`.
- **FR-05 (Session Invalidation / Logout):** Purges the JWT from `localStorage`, disconnects the user from private WebSocket channels, and routes back to `/login`.

### Module 2: User Administration & RBAC Management (Admin Only)
- **FR-06 (User Directory Inspection):** Lists all registered platform users with name, email, role, and registration date (`GET /api/auth/users`).
- **FR-07 (Role Promotion / Demotion):** Administrateurs can promote or demote any user between `Employé`, `Chef de projet`, and `Administrateur`.
- **FR-08 (User Account Deletion with Integrity Safeguard):** Administrateurs can permanently delete a user account only if the user has NO active tasks in `En cours` status (RG-15) and is not managing active projects (RG-16). Existing task assignments are safely decoupled (`assignedTo: null`).

### Module 3: Project Portfolio Management (Chef de projet & Admin)
- **FR-09 (Project Creation):** Requires a unique project name, description, start date, and end date. Validates that `startDate < endDate` (RG-01). Status initialized to `Non commencé`.
- **FR-10 (Project Portfolio Browsing):** Displays all projects with real-time completion percentages, date ranges, and creator metadata (`GET /api/projects`).
- **FR-11 (Project Modification & Conflict Validation):** Updates project metadata and dates. Re-evaluates all existing child tasks to ensure their due dates remain within the new project date boundaries.
- **FR-12 (Project Deletion with Cascade Safeguard):** Interdicts deletion of any project that contains one or more child tasks (RG-02). Only empty projects can be deleted.

### Module 4: Task Lifecycle & Assignment Management
- **FR-13 (Task Creation & Delegation):** Chef de projet / Admin creates a task linked to a project, specifies title, description, priority (`Faible`, `Moyenne`, `Haute`), due date, and assigns it to **one specific employee** (RG-06).
- **FR-14 (Task Due Date Boundary Validation):** Rejects any task creation or update if `dueDate` is strictly outside the parent project's `[startDate, endDate]` interval (RG-07).
- **FR-15 (Employee Status Updates):** Employees can modify the status of their assigned tasks (`Non commencée` -> `En cours` -> `Terminée`) through form dropdowns or Kanban Drag & Drop. Employees are forbidden from modifying task title, dates, project, or assigned member (RBAC enforcement).
- **FR-16 (Automated Project Status Recalculation):** Any task creation, deletion, or status update automatically recalculates the parent project's status and completion percentage (RG-08).

### Module 5: Multidimensional Scheduling Views
- **FR-17 (Tabular List View):** Renders all filtered tasks in a responsive table with column sorting (title, project, priority, assignee, due date, status).
- **FR-18 (Interactive Kanban Board):** Provides 3 drag-and-drop columns (`Non commencée`, `En cours`, `Terminée`). Dragging a card triggers an immediate optimistic UI update followed by a `PATCH /api/tasks/:id` request and real-time Socket.io broadcast.
- **FR-19 (Monthly Calendar View):** Projects tasks onto a calendar grid based on their `dueDate`, color-coded by priority with interactive click-to-edit modals.
- **FR-20 (Chronogram Gantt View):** Plots project and task timelines horizontally to visualize milestone overlaps and deadlines.
- **FR-21 (Dynamic Filtering & Live Search):** Instant search by keyword in title/description and multi-criteria filters (by Project, by Assignee, by Status, by Priority, by Due Date limit).

### Module 6: Subtasks & Granular Checklist Engine
- **FR-22 (Subtask Creation):** Allows adding granular checklist items to any task (`POST /api/tasks/:id/subtasks`).
- **FR-23 (Subtask Toggle):** Check/uncheck individual subtasks with real-time completion state updates (`PATCH /api/tasks/:id/subtasks/:subtaskId`).
- **FR-24 (Subtask Removal):** Deletes checklist items without impacting the parent task (`DELETE /api/tasks/:id/subtasks/:subtaskId`).

### Module 7: File Attachment & Document Management
- **FR-25 (Document Upload):** Uploads attachments (PDF, DOCX, PNG, JPG, ZIP) up to 10 MB per file, stored on the server filesystem (`/uploads`) and tracked as embedded sub-documents on the Task entity.
- **FR-26 (Document Download & Preview):** Direct retrieval of uploaded files via `/uploads/:filename`.
- **FR-27 (Document Deletion):** Deletes attachment metadata from MongoDB and unlinks the physical file from disk via `fs.unlinkSync()`.

### Module 8: Collaboration & Discussion Threads
- **FR-28 (Task Comments):** Team members post timestamped comments on any task to discuss blockers or provide status reports (`POST /api/tasks/:id/comments`).

### Module 9: Real-Time Audit Trail & Activity Logging
- **FR-29 (System-Wide Activity Logging):** Automatically records all key system actions (`TASK_CREATED`, `TASK_STATUS_CHANGED`, `PROJECT_CREATED`, `ROLE_UPDATED`, etc.) in the `activities` collection.
- **FR-30 (Live Notification Feed):** Streams real-time event toasts via WebSocket to team members when tasks are assigned or modified.

### Module 10: Executive Dashboard & CSV Reporting
- **FR-31 (7 Core Operational KPIs):** Aggregates real-time counts for Total Projects, Completed Projects, Total Tasks, Completed Tasks, In-Progress Tasks, Not-Started Tasks, and Overdue Tasks (`dueDate < now` AND `status != 'Terminée'`).
- **FR-32 (CSV Report Export):** Generates and downloads a client-side CSV spreadsheet file summarizing platform progress.

---

## 2. Formal Business Rules Inventory (Règles de Gestion)

The system enforces 16 strict business rules verified across backend controllers:

| Rule Code | Rule Statement | Enforcing File & Lines | Failure Handling |
| :--- | :--- | :--- | :--- |
| **RG-01** | `Project.startDate < Project.endDate` | [projectRoutes.js](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/projectRoutes.js#L34-L36) | HTTP 400: *"La date de fin doit être postérieure à la date de début."* |
| **RG-02** | Cannot delete project with existing child tasks | [projectRoutes.js](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/projectRoutes.js#L140-L145) | HTTP 400: *"Impossible de supprimer ce projet car il possède encore des tâches associées."* |
| **RG-03** | Public registration forces `role = 'Employé'` | [authRoutes.js](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/authRoutes.js#L27-L44) | Overrides any client-provided role unless caller is Admin |
| **RG-04** | All protected endpoints require valid JWT | [auth.js](file:///c:/Users/DELL/Desktop/tasks/Task/backend/middleware/auth.js#L6-L24) | HTTP 401: *"Non autorisé, token manquant"* / *"Token invalide"* |
| **RG-05** | Passwords hashed with Bcrypt (salt rounds 10) | [authRoutes.js](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/authRoutes.js#L25) | Plaintext never saved to database |
| **RG-06** | Task assigned to at most ONE employee | [Task.js](file:///c:/Users/DELL/Desktop/tasks/Task/backend/models/Task.js#L67-L71) | `assignedTo: ObjectId` reference (single cardinality) |
| **RG-07** | Task `dueDate` must fall within `[projStart, projEnd]` | [taskRoutes.js](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/taskRoutes.js#L88-L92) | HTTP 400: *"La date limite de la tâche doit être comprise entre le début et la fin du projet."* |
| **RG-08** | Project status & progress auto-calculated from child tasks | [projectStatusHelper.js](file:///c:/Users/DELL/Desktop/tasks/Task/backend/utils/projectStatusHelper.js#L4-L26) | Re-evaluates: All completed -> 'Terminé'; All not started -> 'Non commencé'; else -> 'En cours' |
| **RG-09** | Task must belong to a valid project | [Task.js](file:///c:/Users/DELL/Desktop/tasks/Task/backend/models/Task.js#L62-L66) | `project: { type: ObjectId, ref: 'Project', required: true }` |
| **RG-10** | Task status restricted to allowed enum | [Task.js](file:///c:/Users/DELL/Desktop/tasks/Task/backend/models/Task.js#L53) | Enum: `['Non commencée', 'En cours', 'Terminée']` |
| **RG-11** | Task priority restricted to allowed enum | [Task.js](file:///c:/Users/DELL/Desktop/tasks/Task/backend/models/Task.js#L58) | Enum: `['Faible', 'Moyenne', 'Haute']` |
| **RG-12** | Project CRUD restricted to Chef & Admin | [projectRoutes.js](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/projectRoutes.js#L21) | HTTP 403 via `authorize('Administrateur', 'Chef de projet')` |
| **RG-13** | Task creation/deletion restricted to Chef & Admin | [taskRoutes.js](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/taskRoutes.js#L73) | HTTP 403 via `authorize('Administrateur', 'Chef de projet')` |
| **RG-14** | Role modification restricted to Admin only | [authRoutes.js](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/authRoutes.js#L143-L148) | HTTP 403: *"Seul un Administrateur est autorisé à modifier le rôle d’un utilisateur."* |
| **RG-15** | Cannot delete employee with active tasks (`En cours`) | [authRoutes.js](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/authRoutes.js#L195-L204) | HTTP 400: *"Impossible de supprimer cet employé car il possède encore des tâches 'En cours'."* |
| **RG-16** | Unassigned tasks decoupled on user delete | [authRoutes.js](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/authRoutes.js#L206) | `Task.updateMany({ assignedTo: id }, { assignedTo: null })` |

---

## 3. Non-Functional Requirements (Exigences Non Fonctionnelles)

### NFR-01: Security & Confidentiality
- Passwords must be hashed using one-way cryptographic algorithms (`bcryptjs`, 10 rounds of salting).
- Stateless communication enforced through HMAC-SHA256 signed JSON Web Tokens transmitted via `Authorization: Bearer <token>`.
- Zero password leakage: all database queries exclude password hashes (`.select('-password')`).
- File ingestion restricted to 10 MB per payload with randomized filename prefixes.

### NFR-02: Performance & Latency
- Single Page Application architecture ensures zero page reloads during workflow execution.
- Optimistic UI updates on Kanban drag-and-drop guarantee perceived sub-50ms user interface responsiveness.
- Database index on `User.email` (unique) and indexed ObjectId lookups ensure sub-20ms query completion times.
- Three.js 3D Canvas capped at 60 FPS with low polygon geometry to prevent CPU/GPU throttling on standard student laptops.

### NFR-03: Availability & Fault Tolerance
- Frontend displays informative error toasts and fallback spinners if the backend API is unreachable.
- Socket.io client automatically downgrades to HTTP long-polling if WebSocket transport fails.
- Database operations wrapped in `try/catch` blocks returning explicit HTTP error payloads (`500 Internal Server Error`).

### NFR-04: Maintainability & Modularity
- Clean MVC separation: Models isolated in `/backend/models`, business workflows in `/backend/routes`, reusable calculations in `/backend/utils`.
- Frontend modularity: Context providers (`AuthContext`, `SocketContext`, `ToastContext`) isolate cross-cutting state concerns from visual components.

### NFR-05: Usability & Ergonomics
- Consistent dark-mode theme utilizing Tailwind CSS (`#060913`, `slate-900`, `slate-800`).
- Responsive layout adapting from mobile screens (collapsible overlay menu) to large desktop monitors.
- Visual status badges with color-coded cues (Green for Completed, Amber for In-Progress, Slate for Not Started, Red for Overdue).

### NFR-06: Testability & Quality Assurance
- Automated regression suite with 30 unit/integration tests running under Jest and Supertest (`npm test`).
