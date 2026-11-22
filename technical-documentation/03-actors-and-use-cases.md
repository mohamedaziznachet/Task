# 03. Actors & Use Cases Specification

## 1. Actor Taxonomy & Role-Based Access Control (RBAC)

The TaskFlow system recognizes **4 human actors** (structured in a strict generalization hierarchy) and **2 secondary system actors**:

```
[ Visiteur (Unauthenticated) ]
        ▲
        │  (logs in / gets authenticated)
[ Employé (Operational User) ]
        ▲
        │  (inherits all rights + management)
[ Chef de projet (Project Manager) ]
        ▲
        │  (inherits all rights + administration)
[ Administrateur (System Admin) ]
```

### 1.1 Human Actors Definition
1. **Visiteur (External Unauthenticated Actor):**
   - Any user accessing the application without an active session.
   - Allowed operations: Public landing, registration (`Employé` role assigned by default), login submission.
2. **Employé (Operational Base Actor):**
   - Standard organization member executing assigned tasks.
   - Allowed operations: View assigned tasks, update task execution status (`Non commencée`, `En cours`, `Terminée`), manipulate Kanban board, check/uncheck subtasks, upload task attachments, write task comments, view Gantt and Calendar schedules, view KPIs, export CSV reports.
3. **Chef de projet (Managerial Actor):**
   - **Inherits all privileges of `Employé`**.
   - Exclusive operations: Create, update, and delete projects (with RG-01 and RG-02 validation); create and delete tasks (RG-13); assign tasks to specific employees (RG-06); adjust task milestones.
4. **Administrateur (System Supervisor Actor):**
   - **Inherits all privileges of `Chef de projet`**.
   - Exclusive operations: Manage personnel directory; elevate or demote user roles (`Administrateur`, `Chef de projet`, `Employé`); delete user accounts under strict integrity validation (RG-15, RG-16); oversee system-wide audit logs.

### 1.2 Secondary System Actors
1. **Service Temps Réel (Socket.io Engine):**
   - Secondary automated daemon. Listens for backend state transitions and broadcasts events (`kanban:task_updated`, `activity:new`, `notification:new`) to connected client sockets.
2. **Service de Fichiers (Multer / Local FS):**
   - Secondary infrastructure service. Intercepts `multipart/form-data` uploads, validates file constraints (≤10 MB), generates disk filenames, and performs unlinking upon deletion.

---

## 2. Complete Use Case Inventory

| ID | Use Case Name | Primary Actor | Secondary Actor | UML Dependencies | Trigger & Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UC-01** | S'inscrire (Sign Up) | Visiteur | - | - | Visitor fills name, email, password. Account created with default `Employé` role. |
| **UC-02** | S'authentifier (Login) | Visiteur | - | `<..` Interagir 3D `<<extend>>` | Credentials verified via Bcrypt; JWT token returned and stored in `localStorage`. |
| **UC-03** | Gérer son profil | Employé | - | `-->` S'authentifier `<<include>>` | User changes display name or updates password with current password verification. |
| **UC-04** | Se déconnecter | Employé | - | - | Token purged, socket disconnected, redirection to login view. |
| **UC-05** | Consulter l'annuaire | Administrateur | - | `-->` S'authentifier `<<include>>` | Inspects full user table with emails, creation dates, and roles. |
| **UC-06** | Modifier le rôle | Administrateur | Socket.io | `-->` S'authentifier `<<include>>` | Modifies user role (RBAC). Emits real-time notification to affected user. |
| **UC-07** | Supprimer un utilisateur | Administrateur | - | `-->` Vérif RG-15/16 `<<include>>` | Deletes user if no active tasks in progress (RG-15) and no active managed projects (RG-16). |
| **UC-08** | Consulter les projets | Employé | - | `-->` S'authentifier `<<include>>` | Lists all projects with auto-computed progress gauges and deadlines. |
| **UC-09** | Créer un projet | Chef de projet | Socket.io | `-->` Valider dates RG-01 `<<include>>` | Registers new project with unique name. Validates `startDate < endDate`. |
| **UC-10** | Modifier un projet | Chef de projet | Socket.io | `-->` Valider dates RG-01 `<<include>>` | Edits project details and verifies that child task dates remain valid. |
| **UC-11** | Supprimer un projet | Chef de projet | Socket.io | `-->` Vérif tâches RG-02 `<<include>>` | Interdicted if tasks exist. Deletes empty project and records audit trail. |
| **UC-12** | Créer & affecter tâche | Chef de projet | Socket.io | `-->` Valider dates RG-07 `<<include>>`<br>`-->` Recalcul RG-08 `<<include>>`<br>`<..` Checklist/Upload `<<extend>>` | Creates task, binds to project, assigns to 1 employee (RG-06). Re-evaluates project status. |
| **UC-13** | Mettre à jour état tâche | Employé | Socket.io | `-->` Recalcul RG-08 `<<include>>`<br>`<..` Broadcast WS `<<extend>>` | Updates status (`Non commencée`, `En cours`, `Terminée`). Auto-recalculates project progress. |
| **UC-14** | Gérer sous-tâches | Employé | Socket.io | `<..` de UC-12 / UC-13 `<<extend>>` | Adds, toggles, or deletes checklist items within a task. |
| **UC-15** | Gérer pièces jointes | Employé | Service Fichiers | `-->` Multer Service `<<include>>`<br>`<..` de UC-12 `<<extend>>` | Uploads or deletes documents (PDF, PNG, etc., up to 10 MB) attached to task. |
| **UC-16** | Consulter vue Liste | Employé | - | `<..` Filtrer & Rechercher `<<extend>>` | Tabular display of all tasks with sorting and keyword filtering. |
| **UC-17** | Piloter Kanban interactif | Employé | Socket.io | `<..` Filtrer & Rechercher `<<extend>>` | 3-column drag & drop visual task board with optimistic UI updates. |
| **UC-18** | Consulter Calendrier | Employé | - | `<..` Filtrer & Rechercher `<<extend>>` | Monthly calendar displaying tasks positioned on their due dates. |
| **UC-19** | Suivre chronogramme Gantt | Employé | - | `<..` Filtrer & Rechercher `<<extend>>` | Horizontal bar schedule timeline showing task durations and overlaps. |
| **UC-20** | Consulter Dashboard | Employé | - | `-->` S'authentifier `<<include>>` | Real-time display of 7 operational KPIs, completion rates, and delay alerts. |
| **UC-21** | Exporter rapport CSV | Employé | - | `<..` de UC-20 `<<extend>>` | Downloads formatted `.csv` file summarizing metrics for reporting. |
| **UC-22** | Consulter Journal d'Audit | Employé | Socket.io | `-->` S'authentifier `<<include>>` | Real-time activity log showing the last 50 system operations with live streaming. |

---

## 3. Actor vs Feature Access Matrix (RBAC Enforcement)

| Functional Capability | Visiteur | Employé | Chef de projet | Administrateur | Code Enforcement |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Inscription / Connexion** | ✅ | ✅ | ✅ | ✅ | Public routes `/register`, `/login` |
| **Modifier son propre profil** | ❌ | ✅ | ✅ | ✅ | Protected route `PUT /api/auth/profile` |
| **Consulter le Dashboard & KPIs** | ❌ | ✅ | ✅ | ✅ | Protected route `GET /api/dashboard/stats` |
| **Consulter Projets & Tâches** | ❌ | ✅ | ✅ | ✅ | Protected routes `GET /projects`, `GET /tasks` |
| **Modifier l'état de ses tâches** | ❌ | ✅ | ✅ | ✅ | `PUT /api/tasks/:id` (Employee restricted to status) |
| **Ajouter checklist & pièces jointes** | ❌ | ✅ | ✅ | ✅ | `POST /tasks/:id/subtasks`, `POST /tasks/:id/attachments` |
| **Écrire un commentaire** | ❌ | ✅ | ✅ | ✅ | `POST /api/tasks/:id/comments` |
| **Créer / Modifier un projet** | ❌ | ❌ | ✅ | ✅ | `authorize('Administrateur', 'Chef de projet')` |
| **Supprimer un projet** | ❌ | ❌ | ✅ | ✅ | `authorize('Administrateur', 'Chef de projet')` + RG-02 |
| **Créer & assigner une tâche** | ❌ | ❌ | ✅ | ✅ | `authorize('Administrateur', 'Chef de projet')` |
| **Supprimer une tâche** | ❌ | ❌ | ✅ | ✅ | `authorize('Administrateur', 'Chef de projet')` |
| **Consulter l'annuaire utilisateurs** | ❌ | ❌ | ❌ | ✅ | `UsersPage.jsx` restricted via `user.role === 'Administrateur'` |
| **Modifier le rôle d'un membre** | ❌ | ❌ | ❌ | ✅ | `PUT /api/auth/users/:id` checks `req.user.role === 'Administrateur'` |
| **Supprimer un compte utilisateur** | ❌ | ❌ | ❌ | ✅ | `DELETE /api/auth/users/:id` + `authorize('Administrateur')` |

---

## 4. Formal Cockburn Specification of Critical Use Cases

### UC-12: Create and Assign Task
- **Primary Actor:** Chef de projet (or Administrateur).
- **Secondary Actor:** Service Temps Réel (Socket.io).
- **Preconditions:** Caller authenticated with management role; target Project exists; target Employee exists.
- **Postconditions:** Task entity persisted with status `Non commencée`; project status recalculated (RG-08); live event broadcast.
- **Main Success Scenario:**
  1. Actor clicks "+ Nouvelle Tâche".
  2. Modal prompts for Title, Description, Priority, Due Date, Project, and Assignee.
  3. System validates that Due Date is within `[Project.startDate, Project.endDate]` (RG-07).
  4. System validates that Assignee exists and is unique (RG-06).
  5. System persists task in MongoDB.
  6. System triggers `recalculateProjectStatus()` for parent project.
  7. System records activity `TASK_CREATED` in audit trail.
  8. System emits `kanban:task_created` via WebSocket to all clients.
  9. Modal closes and task appears on all active boards.

### UC-13: Update Task Status via Kanban Drag & Drop
- **Primary Actor:** Employé (or Chef / Admin).
- **Secondary Actor:** Service Temps Réel (Socket.io).
- **Preconditions:** Task is visible on board; user has permission.
- **Postconditions:** Task status updated in database; parent project status recalculated; all user screens synchronized.
- **Main Success Scenario:**
  1. Employee drags card from "En cours" to "Terminée".
  2. Frontend applies optimistic state update.
  3. Frontend sends `PUT /api/tasks/:id` with payload `{ status: 'Terminée' }`.
  4. Backend verifies JWT and checks if Employee owns the task.
  5. Backend persists new status and runs `recalculateProjectStatus(projectId)`.
  6. Backend records `TASK_STATUS_CHANGED` in audit collection.
  7. Socket.io emits `kanban:task_updated` to all connected clients.
  8. Other users' screens update card position and dashboard gauges automatically.
