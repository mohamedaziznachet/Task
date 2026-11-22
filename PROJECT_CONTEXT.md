# MASTER PROJECT CONTEXT: TaskFlow Web Platform
> **DOCUMENT PURPOSE:** This master context document contains all technical, functional, architectural, and data modeling information necessary for an external AI assistant or software engineer to understand, analyze, or generate comprehensive UML diagrams (Draw.io XML) without direct access to the source code repository.

---

## 1. Executive Summary & Identity

- **Project Name:** TaskFlow
- **Domain:** Collaborative Web Platform for Project Portfolio, Task Delegation, and Real-Time Team Management
- **Academic Context:** Licence 3 GLSI (Génie Logiciel & Systèmes d'Information), ISSAT Kasserine, Department of Computer Science
- **Supervising Professor:** Mme A. Yengui
- **Development Methodology:** Agile Scrum (Sprint iterations, User Stories, Product Backlog, Acceptance Criteria)
- **Architecture Pattern:** Decoupled 3-Tier Architecture (SPA Frontend + REST/WebSocket Backend + NoSQL Document Store)
- **Quality Status:** Fully implemented production-ready codebase with 30 passing automated tests under Jest/Supertest.

---

## 2. Technology Stack & Environment Specifications

### Frontend (SPA Client)
- **Framework:** React 19 (`19.3.1`) with React DOM (`19.3.1`)
- **Routing:** React Router v7 (`react-router-dom: ^7.18.5`)
- **Build Engine & Bundler:** Vite 8 (`8.3.4`)
- **Styling & Design System:** Tailwind CSS 3 (`3.4.19`), PostCSS, Autoprefixer (Custom dark palette `#060913`, `slate-950`, `slate-900`, `sky-400`, `indigo-500`)
- **HTTP Client:** Axios (`1.20.0`) configured with request Authorization header interceptor and response 401 session expiration handler
- **Real-Time Client:** Socket.io Client (`socket.io-client: 4.8.4`)
- **3D Graphics Engine:** Three.js (`three: 0.186.1`) with WebGL dynamic orb and particle systems
- **Iconography:** Lucide React (`lucide-react: 1.61.0`)

### Backend (REST API & Real-Time Server)
- **Runtime Environment:** Node.js (v20+ LTS)
- **Web Application Framework:** Express.js (`4.19.2`)
- **WebSocket Engine:** Socket.io (`4.8.4`) with room-based socket isolation (`user:${userId}`)
- **Database Object Modeling (ODM):** Mongoose (`8.3.1`)
- **Authentication & Security:** JSON Web Token (`jsonwebtoken: 9.0.2`), Bcrypt (`bcryptjs: 2.4.3`, 10 salt rounds)
- **File Ingestion:** Multer (`2.5.0`) with disk storage and 10 MB payload restrictions
- **Cross-Origin Security:** CORS (`cors: 2.8.5`)
- **Automated Testing:** Jest (`29.7.0`), Supertest (`6.3.4`)

### Persistence Tier
- **Database Engine:** MongoDB NoSQL Document Store (`mongodb://127.0.0.1:27017/issat_project_management`)
- **File System Storage:** Local disk volume at `backend/uploads/`

---

## 3. Actor Taxonomy & Role-Based Access Control (RBAC)

The system enforces a hierarchical RBAC model across 4 human actors and 2 secondary system actors:

```
[ Visiteur (Unauthenticated Visitor) ]
          ▲
          │ (registers or authenticates)
[ Employé (Standard Operational User) ]
          ▲
          │ (specialization / inherits all Employé rights)
[ Chef de projet (Project Manager) ]
          ▲
          │ (specialization / inherits all Chef de projet rights)
[ Administrateur (System Administrator) ]
```

### 3.1 Actor Rights & Responsibilities
1. **Visiteur:**
   - Unauthenticated access to `/login`.
   - Can register (automatically assigned the `Employé` role; cannot self-assign higher roles).
   - Can log in with valid email and password.
2. **Employé:**
   - Base operational user.
   - Views tasks assigned to them or belonging to team projects.
   - Modifies the execution status of their own tasks (`Non commencée`, `En cours`, `Terminée`) via form or Drag & Drop on the Kanban board.
   - Manages subtasks (checklist), uploads task attachments, posts comments.
   - Explores tasks through List View, Kanban View, Calendar View, and Gantt View.
   - Consults the 7-KPI Dashboard and exports CSV reports.
   - Modifies own profile (name, password verification).
3. **Chef de projet:**
   - **Inherits 100% of `Employé` capabilities.**
   - Creates, modifies, and deletes Projects (under RG-01 and RG-02 validation).
   - Creates, updates, and deletes Tasks (RG-13).
   - Assigns tasks strictly to an individual employee (RG-06).
   - Enforces task due date containment within project boundaries (RG-07).
4. **Administrateur:**
   - **Inherits 100% of `Chef de projet` capabilities.**
   - Accesses `/users` (Personnel Directory).
   - Modifies user details and promotes/demotes roles (`Administrateur`, `Chef de projet`, `Employé`).
   - Deletes user accounts with active task verification (RG-15) and automatic task decoupling (RG-16).
5. **Secondary System Actors:**
   - **Service WebSocket (Socket.io):** Broadcasts real-time events (`kanban:*`, `project:*`, `activity:new`, `notification:new`).
   - **Service Fichiers (Multer / FS):** Handles file persistence in `backend/uploads/` and physical file deletion.

---

## 4. Business Rules Inventory (Règles de Gestion)

- **RG-01:** A Project's start date must strictly precede its end date (`startDate < endDate`).
- **RG-02:** A Project cannot be deleted if it has one or more associated child tasks.
- **RG-03:** Any public user registration strictly assigns the `Employé` role.
- **RG-04:** All protected routes require a valid HTTP Bearer JWT token.
- **RG-05:** All passwords must be stored as one-way Bcrypt hashes with 10 salt rounds.
- **RG-06:** A task is assigned to at most ONE employee (`assignedTo: ObjectId`).
- **RG-07:** A task's due date must strictly fall within its parent project's date interval:
  $$\text{project.startDate} \le \text{task.dueDate} \le \text{project.endDate}$$
- **RG-08:** A project's operational status is automatically re-evaluated whenever child tasks are created, deleted, or updated:
  - If all tasks are `Non commencée` $\implies$ Project is `Non commencé`.
  - If all tasks are `Terminée` $\implies$ Project is `Terminé`.
  - Otherwise $\implies$ Project is `En cours`.
- **RG-09:** A task must belong strictly to one valid project (`project: ObjectId`, `required: true`).
- **RG-10:** Task status is restricted to `['Non commencée', 'En cours', 'Terminée']`.
- **RG-11:** Task priority is restricted to `['Faible', 'Moyenne', 'Haute']`.
- **RG-12:** Project creation, update, and deletion are restricted to `Chef de projet` and `Administrateur`.
- **RG-13:** Task creation and deletion are restricted to `Chef de projet` and `Administrateur`.
- **RG-14:** User role elevation or demotion is restricted strictly to `Administrateur`.
- **RG-15:** An employee cannot be deleted if they currently hold tasks with status `En cours`.
- **RG-16:** When an employee is deleted, remaining tasks are decoupled (`assignedTo: null`).

---

## 5. Database Schema & Data Models

### 5.1 Entities and Collections

#### `User` (`backend/models/User.js`)
- `_id: ObjectId` (PK)
- `name: String` (Required, Trim)
- `email: String` (Required, Unique, Lowercase, Trim)
- `password: String` (Required, Bcrypt Hash)
- `role: String` (Enum: `['Administrateur', 'Chef de projet', 'Employé']`, Default: `'Employé'`)
- `createdAt: Date`, `updatedAt: Date`

#### `Project` (`backend/models/Project.js`)
- `_id: ObjectId` (PK)
- `name: String` (Required, Unique, Trim)
- `description: String` (Default: `''`)
- `startDate: Date` (Required)
- `endDate: Date` (Required, must be `> startDate`)
- `status: String` (Enum: `['Non commencé', 'En cours', 'Terminé']`, Default: `'Non commencé'`)
- `createdBy: ObjectId` (Ref: `User`, FK)
- `createdAt: Date`, `updatedAt: Date`

#### `Task` (`backend/models/Task.js`)
- `_id: ObjectId` (PK)
- `title: String` (Required, Trim)
- `description: String` (Default: `''`)
- `status: String` (Enum: `['Non commencée', 'En cours', 'Terminée']`, Default: `'Non commencée'`)
- `priority: String` (Enum: `['Faible', 'Moyenne', 'Haute']`, Default: `'Moyenne'`)
- `dueDate: Date` (Required)
- `project: ObjectId` (Ref: `Project`, Required, FK)
- `assignedTo: ObjectId` (Ref: `User`, Default: `null`, FK)
- `subtasks: Array[Subtask]` (Embedded Sub-document Schema)
- `attachments: Array[Attachment]` (Embedded Sub-document Schema)
- `comments: Array[Comment]` (Embedded Sub-document Schema)
- `createdAt: Date`, `updatedAt: Date`

#### Embedded: `Subtask`
- `_id: ObjectId` (PK)
- `title: String` (Required, Trim)
- `completed: Boolean` (Default: `false`)
- `createdAt: Date`, `updatedAt: Date`

#### Embedded: `Attachment`
- `_id: ObjectId` (PK)
- `originalName: String` (Required)
- `filename: String` (Required, Unique disk name)
- `path: String` (Required, Public URL `/uploads/:filename`)
- `mimetype: String`
- `size: Number` (Bytes, max 10 MB)
- `uploadedBy: ObjectId` (Ref: `User`, FK)
- `uploadedAt: Date` (Default: `Date.now`)

#### Embedded: `Comment`
- `_id: ObjectId` (PK)
- `user: ObjectId` (Ref: `User`, Required, FK)
- `text: String` (Required, Trim)
- `createdAt: Date` (Default: `Date.now`)

#### `Activity` (`backend/models/Activity.js`)
- `_id: ObjectId` (PK)
- `user: ObjectId` (Ref: `User`, Required, FK)
- `action: String` (Required, Enum: `TASK_CREATED`, `TASK_UPDATED`, `TASK_STATUS_CHANGED`, `TASK_DELETED`, `SUBTASK_TOGGLED`, `ATTACHMENT_ADDED`, `COMMENT_ADDED`, `PROJECT_CREATED`, `PROJECT_UPDATED`, `PROJECT_DELETED`, `ROLE_UPDATED`)
- `targetType: String` (Required, Enum: `['Task', 'Project', 'User']`)
- `targetTitle: String` (Default: `''`)
- `targetId: ObjectId`
- `details: String` (Default: `''`)
- `createdAt: Date`, `updatedAt: Date`

### 5.2 Multiplicities & Cardinalities
- `User (1) ---> (0..*) Project` (Field: `Project.createdBy`)
- `User (1) ---> (0..*) Task` (Field: `Task.assignedTo`)
- `User (1) ---> (0..*) Activity` (Field: `Activity.user`)
- `Project (1) ---> (0..*) Task` (Field: `Task.project`)
- `Task (1) *---> (0..*) Subtask` (Composition: embedded array)
- `Task (1) *---> (0..*) Attachment` (Composition: embedded array)
- `Task (1) *---> (0..*) Comment` (Composition: embedded array)

---

## 6. Complete API Endpoint Inventory

| HTTP Method | Route URL | Access & Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Registers visitor with default role `Employé` (or role in body if Admin). |
| `POST` | `/api/auth/login` | Public | Authenticates credentials; returns user object + signed JWT. |
| `PUT` | `/api/auth/profile` | Protected (`protect`) | Updates authenticated user's name and/or password. |
| `GET` | `/api/auth/users` | Protected (`protect`) | Retrieves all users sorted by creation date descending. |
| `PUT` | `/api/auth/users/:id` | Protected (`Admin` for role) | Updates user profile or modifies RBAC role. |
| `DELETE`| `/api/auth/users/:id` | Protected (`Admin` only) | Deletes user under RG-15 constraint; decouples tasks. |
| `GET` | `/api/projects` | Protected (`protect`) | Retrieves all projects with creator population. |
| `POST` | `/api/projects` | Protected (`Chef`, `Admin`) | Creates project; validates dates (RG-01); logs activity. |
| `PUT` | `/api/projects/:id` | Protected (`Chef`, `Admin`) | Updates project details; verifies child task dates. |
| `DELETE`| `/api/projects/:id` | Protected (`Chef`, `Admin`) | Deletes empty project (fails if tasks exist - RG-02). |
| `GET` | `/api/tasks` | Protected (`protect`) | Lists tasks; supports `search`, `project`, `assignedTo`, `status`, etc. |
| `POST` | `/api/tasks` | Protected (`Chef`, `Admin`) | Creates and assigns task; checks project date bounds (RG-07). |
| `PUT` | `/api/tasks/:id` | Protected (`protect`) | Updates task. Employees restricted to modifying status of owned tasks. |
| `DELETE`| `/api/tasks/:id` | Protected (`Chef`, `Admin`) | Deletes task; triggers project status recalculation (RG-08). |
| `POST` | `/api/tasks/:id/comments` | Protected (`protect`) | Appends comment to task discussion thread. |
| `POST` | `/api/tasks/:id/subtasks` | Protected (`protect`) | Adds new checklist step to task. |
| `PATCH`| `/api/tasks/:id/subtasks/:subId` | Protected (`protect`) | Inverts subtask completed state (`true`/`false`). |
| `DELETE`| `/api/tasks/:id/subtasks/:subId` | Protected (`protect`) | Removes subtask from checklist. |
| `POST` | `/api/tasks/:id/attachments` | Protected (`protect`) | Uploads file (Multer, max 10 MB) and appends metadata. |
| `DELETE`| `/api/tasks/:id/attachments/:attId`| Protected (`protect`) | Unlinks physical file and removes attachment metadata. |
| `GET` | `/api/dashboard/stats` | Protected (`protect`) | Computes 7 core KPIs (projects, tasks, completed, overdue). |
| `GET` | `/api/activities` | Protected (`protect`) | Returns recent audit log entries (default limit: 50). |

---

## 7. Real-Time WebSockets Architecture (`Socket.io`)

- **Connection Protocol:** Persistent WebSocket with automatic polling fallback.
- **Client Bootstrap:** In [SocketContext.jsx](file:///c:/Users/DELL/Desktop/tasks/Task/frontend/src/context/SocketContext.jsx), connects to `VITE_API_URL` and emits `join_user(user._id)` upon authentication.
- **Event Catalog:**
  - `kanban:task_created` (Broadcast): Emits full task document when added.
  - `kanban:task_updated` (Broadcast): Emits full task document on status or detail updates.
  - `kanban:task_deleted` (Broadcast): Emits `{ id, projectId }`.
  - `project:created`, `project:updated`, `project:deleted` (Broadcast).
  - `activity:new` (Broadcast): Appends new audit log entry.
  - `notification:new` (Targeted): Sent specifically to `user:${notifyUser}` when assigned a task or updated.

---

## 8. UML Diagram Specifications for Draw.io Generation

### 8.1 Use Case Diagram (Draw.io Elements)
- **Subject / Boundary:** `Système Web TaskFlow`
- **Packages:**
  - `1. Authentification & Sécurité` (UC-01, UC-02, UC-03, UC-04, UC-3D)
  - `2. Administration Système` (UC-05, UC-06, UC-07, RG-15/16)
  - `3. Gestion des Projets` (UC-08, UC-09, UC-10, UC-11, RG-01, RG-02)
  - `4. Gestion des Tâches` (UC-12, UC-13, UC-14, UC-15, RG-07, RG-08)
  - `5. Vues Multidimensionnelles` (UC-16, UC-17, UC-18, UC-19, UC-Filter)
  - `6. Pilotage & Audit` (UC-20, UC-21, UC-22)
- **Stereotypes:**
  - `UC-02 <.. UC-3D : <<extend>>`
  - `UC-07 ..> RG-15/16 : <<include>>`
  - `UC-09 ..> RG-01 : <<include>>`
  - `UC-11 ..> RG-02 : <<include>>`
  - `UC-12 ..> RG-07 : <<include>>`
  - `UC-12 ..> RG-08 : <<include>>`
  - `UC-13 ..> RG-08 : <<include>>`
  - `UC-12 <.. UC-14 : <<extend>>`
  - `UC-12 <.. UC-15 : <<extend>>`
  - `UC-Views <.. UC-Filter : <<extend>>`
  - `UC-20 <.. UC-21 : <<extend>>`

### 8.2 Sequence Diagram: Kanban Drag & Drop with Recalculation (RG-08)
- **Lifelines:**
  1. `User (Employé)`
  2. `Front (React Kanban)`
  3. `API (Express REST)`
  4. `DB (MongoDB)`
  5. `Socket (Socket.io Engine)`
- **Messages:**
  1. `User -> Front`: Drag card to 'Terminée'
  2. `Front -> API`: `PATCH /api/tasks/:id { status: 'Terminée' }` (Bearer Token)
  3. `API -> API`: Verify JWT & RBAC permission
  4. `API -> DB`: `updateOne({ _id }, { status: 'Terminée' })`
  5. `DB --> API`: Task updated
  6. `API -> DB`: Query all tasks for project & recalculate status (RG-08)
  7. `DB --> API`: Project status updated
  8. `API -> Socket`: `emit('kanban:task_updated', populatedTask)`
  9. `API --> Front`: `200 OK { task, projectStatus }`
  10. `Socket --> Front`: Live broadcast to all team members
  11. `Front --> User`: Toast notification & KPI gauges refreshed

---

## 9. Technical Caveats & Implementation Realities

1. **Comments Modification:** `POST /api/tasks/:id/comments` is implemented, but there are no `PUT` or `DELETE` endpoints for comments.
2. **Activity Search:** `ActivityPage.jsx` has a search input that filters activities in-memory on the frontend. The backend endpoint `/api/activities` only accepts a `limit` parameter.
3. **Unassigned Tasks:** In `taskRoutes.js`, if a task has `assignedTo == null`, an `Employé` can update its status because the ownership check only triggers if `existingTask.assignedTo` is truthy.
4. **Token Storage:** Tokens are stored in browser `localStorage`. No refresh token rotation is present; tokens are valid for 7 days.
5. **Static Uploads:** Files are stored on the local disk at `backend/uploads/` and served statically via Express.
