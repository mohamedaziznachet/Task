# 05. REST API Inventory & Endpoint Specifications

## 1. API Architecture & Standard Conventions

- **Base URL:** `http://localhost:5000/api` (configurable via `process.env.PORT` and `VITE_API_URL`).
- **Data Exchange Format:** `application/json` (except `/api/tasks/:id/attachments` which consumes `multipart/form-data`).
- **Authentication Scheme:** HTTP Authorization Header with Bearer Token (`Authorization: Bearer <JWT>`).
- **Standard Error Responses:**
  - `400 Bad Request`: Payload validation failed or business rule violated.
  - `401 Unauthorized`: Token missing, malformed, or expired.
  - `403 Forbidden`: Authenticated user lacks required role (RBAC violation).
  - `404 Not Found`: Target entity ID does not exist in MongoDB.
  - `500 Internal Server Error`: Unhandled server exception with `{ message: err.message }`.

---

## 2. Authentication & User Management Endpoints (`/api/auth`)

### 2.1 `POST /api/auth/register`
- **Description:** Registers a new user account.
- **Access Level:** Public (or Admin-authenticated for role assignment).
- **Required Role:** Any visitor. If caller is `Administrateur`, `role` in body is respected; otherwise defaults to `Employé` (RG-03).
- **Request Headers:** `Content-Type: application/json`, optional `Authorization: Bearer <token>`.
- **Request Body:**
  ```json
  {
    "name": "Ahmed Ben Ali",
    "email": "ahmed@issat.tn",
    "password": "Password123",
    "role": "Chef de projet" // Optional, Admin caller only
  }
  ```
- **Responses:**
  - `201 Created`:
    ```json
    {
      "_id": "672901a012...",
      "name": "Ahmed Ben Ali",
      "email": "ahmed@issat.tn",
      "role": "Employé",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
  - `400 Bad Request`: `{ "message": "Cet email est déjà utilisé" }`
- **File Reference:** [authRoutes.js:L18-L61](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/authRoutes.js#L18-L61)
- **Database Models:** `User`

### 2.2 `POST /api/auth/login`
- **Description:** Authenticates user via email and password; returns JWT token.
- **Access Level:** Public.
- **Request Body:**
  ```json
  {
    "email": "admin@issat.tn",
    "password": "AdminPassword123"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "_id": "672901a011...",
      "name": "Administrateur Principal",
      "email": "admin@issat.tn",
      "role": "Administrateur",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
  - `401 Unauthorized`: `{ "message": "Email ou mot de passe incorrect" }`
- **File Reference:** [authRoutes.js:L64-L81](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/authRoutes.js#L64-L81)
- **Database Models:** `User`

### 2.3 `PUT /api/auth/profile`
- **Description:** Updates caller's display name and/or password.
- **Access Level:** Protected (`protect`).
- **Required Role:** Any authenticated user (`Employé`, `Chef de projet`, `Administrateur`).
- **Request Body:**
  ```json
  {
    "name": "Ahmed Ben Ali Updated",
    "currentPassword": "OldPassword123", // Required if newPassword is provided
    "newPassword": "NewPassword456"      // Min 6 characters
  }
  ```
- **Responses:**
  - `200 OK`: Updated user profile with fresh JWT.
  - `400 Bad Request`: Current password incorrect or new password too short.
  - `404 Not Found`: User not found.
- **File Reference:** [authRoutes.js:L84-L122](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/authRoutes.js#L84-L122)
- **Database Models:** `User`

### 2.4 `GET /api/auth/users`
- **Description:** Retrieves all platform users sorted by creation date descending.
- **Access Level:** Protected (`protect`).
- **Required Role:** Any authenticated user (passwords excluded via `.select('-password')`).
- **Responses:**
  - `200 OK`: Array of User documents.
- **File Reference:** [authRoutes.js:L125-L132](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/authRoutes.js#L125-L132)
- **Database Models:** `User`

### 2.5 `PUT /api/auth/users/:id`
- **Description:** Updates user details or modifies user role (RBAC).
- **Access Level:** Protected (`protect`).
- **Required Role:** `Administrateur` to change roles or modify other users; users can edit own name.
- **Request Body:** `{ "name": "...", "email": "...", "role": "Chef de projet" }`.
- **Side Effects:** Records `ROLE_UPDATED` in `activities` and emits private Socket notification to target.
- **Responses:**
  - `200 OK`: Updated User document.
  - `403 Forbidden`: Non-admin attempting to modify role.
- **File Reference:** [authRoutes.js:L135-L190](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/authRoutes.js#L135-L190)
- **Database Models:** `User`, `Activity`

### 2.6 `DELETE /api/auth/users/:id`
- **Description:** Deletes a user account after verifying integrity safeguards (RG-15).
- **Access Level:** Protected (`protect`, `authorize('Administrateur')`).
- **Required Role:** `Administrateur`.
- **Integrity Checks:** Checks `Task.countDocuments({ assignedTo: id, status: 'En cours' })`. If `> 0`, aborts. Otherwise decouples tasks (`assignedTo: null`).
- **Responses:**
  - `200 OK`: `{ "message": "Utilisateur supprimé avec succès" }`
  - `400 Bad Request`: Cannot delete user with active tasks in progress.
- **File Reference:** [authRoutes.js:L193-L213](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/authRoutes.js#L193-L213)
- **Database Models:** `User`, `Task`

---

## 3. Project Management Endpoints (`/api/projects`)

### 3.1 `GET /api/projects`
- **Description:** Lists all projects populated with creator name and email.
- **Access Level:** Protected (`protect`).
- **Responses:** `200 OK` with Array of Project objects.
- **File Reference:** [projectRoutes.js:L11-L18](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/projectRoutes.js#L11-L18)

### 3.2 `POST /api/projects`
- **Description:** Creates a new project portfolio.
- **Access Level:** Protected (`protect`, `authorize('Administrateur', 'Chef de projet')`).
- **Request Body:**
  ```json
  {
    "name": "Refonte Portail Étudiant",
    "description": "Migration vers architecture React/Node",
    "startDate": "2026-11-01T00:00:00.000Z",
    "endDate": "2026-12-31T23:59:59.999Z"
  }
  ```
- **Validations:** Uniqueness of `name`; `startDate < endDate` (RG-01).
- **Side Effects:** Records `PROJECT_CREATED` in `activities`; emits `project:created` via Socket.io.
- **Responses:** `201 Created` with Project document.
- **File Reference:** [projectRoutes.js:L21-L63](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/projectRoutes.js#L21-L63)

### 3.3 `PUT /api/projects/:id`
- **Description:** Updates project metadata and validates date conflict with existing child tasks.
- **Access Level:** Protected (`protect`, `authorize('Administrateur', 'Chef de projet')`).
- **Validations:** Checks that no existing child task has a `dueDate` outside the new start/end interval.
- **Side Effects:** Records `PROJECT_UPDATED` in `activities`; emits `project:updated` via Socket.io.
- **Responses:** `200 OK` with updated Project.
- **File Reference:** [projectRoutes.js:L66-L135](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/projectRoutes.js#L66-L135)

### 3.4 `DELETE /api/projects/:id`
- **Description:** Deletes a project only if it contains zero child tasks (RG-02).
- **Access Level:** Protected (`protect`, `authorize('Administrateur', 'Chef de projet')`).
- **Responses:**
  - `200 OK`: `{ "message": "Projet supprimé avec succès" }`
  - `400 Bad Request`: Project contains active tasks.
- **File Reference:** [projectRoutes.js:L138-L170](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/projectRoutes.js#L138-L170)

---

## 4. Task Management Endpoints (`/api/tasks`)

### 4.1 `GET /api/tasks`
- **Description:** Retrieves tasks with populated project, assignee, and comments. Supports query filters.
- **Query Parameters:** `search`, `project`, `assignedTo`, `status`, `priority`, `dueDate`.
- **Responses:** `200 OK` with Array of Task objects sorted by `dueDate: 1`.
- **File Reference:** [taskRoutes.js:L46-L70](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/taskRoutes.js#L46-L70)

### 4.2 `POST /api/tasks`
- **Description:** Creates and assigns a new task.
- **Access Level:** Protected (`protect`, `authorize('Administrateur', 'Chef de projet')`).
- **Request Body:** `{ "title": "...", "description": "...", "dueDate": "...", "project": "...", "assignedTo": "...", "priority": "Haute" }`.
- **Validations:** `dueDate` inside parent project bounds (RG-07); single employee existence (RG-06).
- **Side Effects:** Calls `recalculateProjectStatus()`; records `TASK_CREATED`; emits `kanban:task_created`.
- **Responses:** `201 Created` with populated Task document.
- **File Reference:** [taskRoutes.js:L73-L133](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/taskRoutes.js#L73-L133)

### 4.3 `PUT /api/tasks/:id`
- **Description:** Updates task details or status.
- **Access Level:** Protected (`protect`).
- **Role Scoping:** If `req.user.role === 'Employé'`, user can ONLY update the `status` of their own task.
- **Side Effects:** Runs `recalculateProjectStatus()`; emits `kanban:task_updated`.
- **Responses:** `200 OK` with updated populated Task.
- **File Reference:** [taskRoutes.js:L136-L250](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/taskRoutes.js#L136-L250)

### 4.4 `DELETE /api/tasks/:id`
- **Description:** Permanently removes a task.
- **Access Level:** Protected (`protect`, `authorize('Administrateur', 'Chef de projet')`).
- **Side Effects:** Runs `recalculateProjectStatus()`; records `TASK_DELETED`; emits `kanban:task_deleted`.
- **Responses:** `200 OK`.
- **File Reference:** [taskRoutes.js:L444-L471](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/taskRoutes.js#L444-L471)

### 4.5 `POST /api/tasks/:id/comments`
- **Description:** Appends a discussion comment to a task.
- **Access Level:** Protected (`protect`).
- **Request Body:** `{ "text": "Le rapport d'audit est validé." }`.
- **Responses:** `201 Created` with updated Task.
- **File Reference:** [taskRoutes.js:L253-L291](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/taskRoutes.js#L253-L291)

### 4.6 Subtasks Endpoints
- `POST /api/tasks/:id/subtasks`: Adds subtask `{ "title": "..." }` (`201 Created`).
- `PATCH /api/tasks/:id/subtasks/:subtaskId`: Toggles `{ "completed": true/false }` (`200 OK`).
- `DELETE /api/tasks/:id/subtasks/:subtaskId`: Pulls subtask from array (`200 OK`).
- **File Reference:** [taskRoutes.js:L296-L370](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/taskRoutes.js#L296-L370)

### 4.7 Attachments Endpoints
- `POST /api/tasks/:id/attachments`: Consumes `multipart/form-data` with field `file` (Max 10 MB). Stores in `/uploads` (`201 Created`).
- `DELETE /api/tasks/:id/attachments/:attachmentId`: Removes attachment metadata and unlinks physical file (`200 OK`).
- **File Reference:** [taskRoutes.js:L374-L441](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/taskRoutes.js#L374-L441)

---

## 5. Analytics & Audit Endpoints

### 5.1 `GET /api/dashboard/stats`
- **Description:** Computes 7 core KPIs using parallel MongoDB `countDocuments()` queries.
- **Access Level:** Protected (`protect`).
- **Response Structure (`200 OK`):**
  ```json
  {
    "totalProjects": 8,
    "completedProjects": 3,
    "totalTasks": 24,
    "completedTasks": 12,
    "inProgressTasks": 8,
    "notStartedTasks": 4,
    "overdueTasks": 2
  }
  ```
- **File Reference:** [dashboardRoutes.js:L8-L45](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/dashboardRoutes.js#L8-L45)

### 5.2 `GET /api/activities`
- **Description:** Returns the persistent audit trail with populated user info.
- **Query Parameter:** `limit` (default: 50).
- **Response Structure (`200 OK`):** Array of Activity documents sorted by `createdAt: -1`.
- **File Reference:** [activityRoutes.js:L9-L21](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/activityRoutes.js#L9-L21)
