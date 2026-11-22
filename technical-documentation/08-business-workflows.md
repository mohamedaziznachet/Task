# 08. Detailed Business Workflows & State Machines

## 1. Workflow 1: User Onboarding & Interactive 3D Authentication

### Process Narrative
1. **Sign-Up Stage:** Visitor navigates to `/login`, toggles to "Inscription", fills name, email, and password. Client POSTs to `/api/auth/register`. Backend checks email uniqueness, hashes password with Bcrypt (10 rounds), forces `role: 'Employé'` (RG-03), and returns user document with signed JWT.
2. **Interactive 3D Stage:** As visitor types in password field, `LoginPage.jsx` sets `visualMode = 'password'`. `Guardian3D.jsx` accelerates rotation and turns neon purple.
3. **Authentication Stage:** Visitor submits login. Client POSTs to `/api/auth/login`. Backend finds user, verifies password hash via `bcrypt.compare()`, generates JWT token.
4. **Completion:** On 200 OK, `Guardian3D` triggers green radial pulse, `localStorage` persists session, and user is redirected to `/dashboard`. On 401 error, `Guardian3D` triggers erratic red vibration.

---

## 2. Workflow 2: Project Portfolio Creation & Date Safeguard (RG-01, RG-02)

### Process Narrative & Logic
1. **Initiation:** Chef de projet clicks "+ Nouveau Projet" on `ProjectsPage.jsx`.
2. **Date Constraint Validation (RG-01):** Backend validates that `new Date(endDate) > new Date(startDate)`. If false, returns HTTP 400 error.
3. **Uniqueness Validation:** Backend checks `Project.findOne({ name: name.trim() })`. If exists, returns HTTP 400 error.
4. **Persistence:** Project saved with `status: 'Non commencé'`. Activity logged (`PROJECT_CREATED`).
5. **Real-Time Notification:** Socket.io emits `project:created`.
6. **Deletion Guard (RG-02):** When deletion requested, backend executes `Task.countDocuments({ project: projectId })`. If count > 0, deletion is blocked with HTTP 400.

```
[ Chef de Projet ]
        │
        ▼
Saisie Formulaire Projet (Nom, Description, Date Début, Date Fin)
        │
        ▼
   Date Fin > Date Début ? (RG-01)
     ├── [Non] ──► Erreur HTTP 400 : "Date de fin antérieure à date de début"
     └── [Oui]
           │
           ▼
     Nom de projet unique ?
       ├── [Non] ──► Erreur HTTP 400 : "Nom de projet déjà existant"
       └── [Oui]
             │
             ▼
        Persistance en Base MongoDB (Statut initial: 'Non commencé')
             │
             ▼
        Enregistrement Journal d'Audit + Émission Socket.io ('project:created')
```

---

## 3. Workflow 3: Task Creation & Delegation (RG-06, RG-07)

### Process Narrative & Logic
1. **Initiation:** Chef de projet opens task creation modal.
2. **Project Date Boundary Validation (RG-07):** Backend loads parent project and verifies that:
   $$\text{parentProject.startDate} \le \text{task.dueDate} \le \text{parentProject.endDate}$$
   If outside boundaries, returns HTTP 400.
3. **Single Employee Assignment (RG-06):** Task assigned strictly to one employee ID.
4. **State Initialization:** Task saved with `status: 'Non commencée'`.
5. **Auto-Recalculation (RG-08):** `recalculateProjectStatus(projectId)` runs immediately.
6. **Real-Time Push:** Emits `kanban:task_created` globally; sends targeted `notification:new` to assigned member.

---

## 4. Workflow 4: Kanban Drag & Drop Status Transition & Automated Recalculation (RG-08)

This is the central operational workflow of the application:

```
[ Collaborateur ]
        │  1. Glisser-déposer carte sur Kanban (ex: "En cours" -> "Terminée")
        ▼
[ Interface React ]
        │  2. Mise à jour optimiste UI
        │  3. Requête HTTP PATCH /api/tasks/:id { status: 'Terminée' }
        ▼
[ Backend Express ]
        │  4. Vérification Token JWT & Contrôle RBAC
        ▼
[ Modèle Task ]
        │  5. Mise à jour du document Task en base MongoDB
        ▼
[ Helper projectStatusHelper ]
        │  6. Évaluation des statuts de toutes les tâches du projet :
        │     - Si toutes les tâches sont 'Non commencée'  ==> Projet = 'Non commencé'
        │     - Si toutes les tâches sont 'Terminée'       ==> Projet = 'Terminé'
        │     - Sinon                                      ==> Projet = 'En cours'
        ▼
[ Modèle Project ]
        │  7. Mise à jour du statut du projet parent (RG-08)
        ▼
[ Audit & WebSockets ]
        │  8. Enregistrement de l'action dans la collection 'activities'
        │  9. Diffusion Socket.io ('kanban:task_updated') à tous les clients connectés
        ▼
[ Tous les Navigateurs ]
        10. Synchronisation automatique des colonnes Kanban et jauges Dashboard
```

---

## 5. Workflow 5: Subtask Checklist Lifecycle

1. **Add Step:** User enters subtask label on task details modal (`POST /api/tasks/:id/subtasks`). Subtask appended to `task.subtasks` array with `completed: false`.
2. **Toggle Step:** User clicks checkbox (`PATCH /api/tasks/:id/subtasks/:subtaskId`). Completed flag inverted. Socket event `kanban:task_updated` dispatched.
3. **Delete Step:** User clicks trash icon (`DELETE /api/tasks/:id/subtasks/:subtaskId`). Item pulled from array.

---

## 6. Workflow 6: Document Attachment Upload & Unlinking

1. **Upload Initiation:** User selects file (≤10 MB). Frontend submits `FormData` to `POST /api/tasks/:id/attachments`.
2. **Multer Processing:** Validates file size; generates unique filename (`timestamp-random.ext`); writes binary to `backend/uploads/`.
3. **Database Linking:** New `Attachment` sub-document pushed to `task.attachments`. Activity logged (`ATTACHMENT_ADDED`).
4. **File Deletion:** User clicks delete attachment. Controller calls `fs.unlinkSync()` to delete physical file from disk, then removes metadata from MongoDB.

---

## 7. Workflow 7: User Administration & Protected Deletion (RG-15, RG-16)

```
[ Administrateur ]
        │
        ▼
Clique sur "Supprimer l'employé" dans UsersPage
        │
        ▼
Requête DELETE /api/auth/users/:id
        │
        ▼
L'employé a-t-il des tâches au statut 'En cours' ? (RG-15)
  ├── [Oui (count > 0)] ──► Erreur HTTP 400 : "Impossible de supprimer cet employé"
  └── [Non (count == 0)]
        │
        ▼
   Découplage des tâches restantes : Task.updateMany({ assignedTo: id }, { assignedTo: null })
        │
        ▼
   Suppression physique du document User dans MongoDB
        │
        ▼
   Actualisation annuaire et confirmation succès
```
