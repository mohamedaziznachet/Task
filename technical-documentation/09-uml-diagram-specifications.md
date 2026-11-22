# 09. UML Diagram Specifications for Draw.io (diagrams.net)

This document provides formal, exact specifications for an AI assistant or software engineer to generate standardized, fully styled UML diagrams in **Draw.io XML (`.drawio`) format**.

---

## 1. Use Case Diagram Specification

### 1.1 Diagram Header & Boundaries
- **System Boundary Box:** `Plateforme Web TaskFlow (3 GLSI)`
- **Packages / Sub-systems (6 Modules):**
  1. `Module 1 : Authentification & Sécurité`
  2. `Module 2 : Administration Système & Rôles`
  3. `Module 3 : Gestion des Projets`
  4. `Module 4 : Gestion des Tâches & Affectations`
  5. `Module 5 : Vues Multidimensionnelles & Planification`
  6. `Module 6 : Tableau de Bord, Reporting & Audit`

### 1.2 Actors Specifications
- `Visiteur` (Human Actor - Unauthenticated)
- `Employé` (Human Actor - Base Role)
- `Chef de projet` (Human Actor - Specialization of `Employé`)
- `Administrateur` (Human Actor - Specialization of `Chef de projet`)
- `Service WebSocket (Socket.io)` (Secondary System Actor)
- `Service Fichiers (Multer)` (Secondary System Actor)

### 1.3 Actor Generalization Links
- `Chef de projet` $\longrightarrow$ `Employé` (Generalization triangle: `endArrow=block;endFill=0`)
- `Administrateur` $\longrightarrow$ `Chef de projet` (Generalization triangle: `endArrow=block;endFill=0`)

### 1.4 Use Cases & Stereotypes Mapping
- **Module 1:**
  - `UC-01 : S'inscrire` (Associated with `Visiteur`)
  - `UC-02 : S'authentifier` (Associated with `Visiteur`, `Employé`)
  - `Interagir avec le Gardien 3D` (Extends `UC-02` via `<.. <<extend>>`)
  - `UC-03 : Gérer son profil` (Associated with `Employé`)
  - `UC-04 : Se déconnecter` (Associated with `Employé`)
- **Module 2:**
  - `UC-05 : Consulter annuaire des utilisateurs` (Associated with `Administrateur`)
  - `UC-06 : Modifier rôles (RBAC)` (Associated with `Administrateur`)
  - `UC-07 : Supprimer un compte utilisateur` (Associated with `Administrateur`)
  - `Vérifier absence tâches/projets (RG-15, RG-16)` (Included in `UC-07` via `--> <<include>>`)
- **Module 3:**
  - `UC-08 : Consulter la liste des projets` (Associated with `Employé`)
  - `UC-09 : Créer un projet` (Associated with `Chef de projet`)
  - `Valider dates chronologiques (RG-01)` (Included in `UC-09` via `--> <<include>>`)
  - `UC-10 : Modifier un projet` (Associated with `Chef de projet`)
  - `UC-11 : Supprimer un projet` (Associated with `Chef de projet`)
  - `Vérifier absence tâches actives (RG-02)` (Included in `UC-11` via `--> <<include>>`)
- **Module 4:**
  - `UC-12 : Créer & affecter une tâche` (Associated with `Chef de projet`)
  - `Valider dates dans projet (RG-07)` (Included in `UC-12` via `--> <<include>>`)
  - `Recalculer avancement projet (RG-08)` (Included in `UC-12` and `UC-13` via `--> <<include>>`)
  - `UC-13 : Modifier l'état d'une tâche` (Associated with `Employé`)
  - `UC-14 : Gérer checklist sous-tâches` (Extends `UC-12` and `UC-13` via `<.. <<extend>>`)
  - `UC-15 : Gérer pièces jointes (Upload)` (Extends `UC-12` via `<.. <<extend>>`; triggers `Service Fichiers`)
  - Event `kanban:task_updated` dispatched to `Service WebSocket`
- **Module 5:**
  - `UC-16 : Vue Liste tabulaire`, `UC-17 : Kanban Drag & Drop`, `UC-18 : Vue Calendrier`, `UC-19 : Chronogramme Gantt` (Associated with `Employé`)
  - `Filtrer & rechercher en direct` (Extends all 4 views via `<.. <<extend>>`)
- **Module 6:**
  - `UC-20 : Consulter Dashboard (7 KPIs)` (Associated with `Employé`)
  - `UC-21 : Exporter rapport en CSV` (Extends `UC-20` via `<.. <<extend>>`)
  - `UC-22 : Consulter Journal d'Audit` (Associated with `Employé`, triggers `Service WebSocket`)

---

## 2. Class Diagram Specification (UML Structural)

### 2.1 Classes & Attributes
```
┌──────────────────────────────────────┐
│                 User                 │
├──────────────────────────────────────┤
│ - _id: ObjectId                      │
│ - name: String                       │
│ - email: String                      │
│ - password: String (Hash)            │
│ - role: String                       │
│ - createdAt: Date                    │
│ - updatedAt: Date                    │
├──────────────────────────────────────┤
│ + comparePassword(plaintext): Boolean│
│ + generateToken(): String            │
└──────────────────────────────────────┘
                  │ 1
                  │ createdBy
                  ▼ *
┌──────────────────────────────────────┐
│               Project                │
├──────────────────────────────────────┤
│ - _id: ObjectId                      │
│ - name: String                       │
│ - description: String                │
│ - startDate: Date                    │
│ - endDate: Date                      │
│ - status: String                     │
│ - createdBy: ObjectId                │
│ - createdAt: Date                    │
│ - updatedAt: Date                    │
├──────────────────────────────────────┤
│ + recalculateStatus(): String        │
└──────────────────────────────────────┘
                  │ 1
                  │ project
                  ▼ *
┌──────────────────────────────────────┐
│                 Task                 │
├──────────────────────────────────────┤
│ - _id: ObjectId                      │
│ - title: String                      │
│ - description: String                │
│ - status: String                     │
│ - priority: String                   │
│ - dueDate: Date                      │
│ - project: ObjectId                  │
│ - assignedTo: ObjectId               │
│ - createdAt: Date                    │
│ - updatedAt: Date                    │
├──────────────────────────────────────┤
│ + addSubtask(title): Subtask         │
│ + toggleSubtask(id): Boolean         │
│ + addAttachment(file): Attachment    │
│ + addComment(user, text): Comment    │
└──────────────────┬───────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │ 1            │ 1            │ 1
    ▼ *            ▼ *            ▼ * (Compositions: Solid Diamond)
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Subtask    │ │  Attachment  │ │   Comment    │
├──────────────┤ ├──────────────┤ ├──────────────┤
│ - _id: ObjId │ │ - _id: ObjId │ │ - _id: ObjId │
│ - title: Str │ │ - origName   │ │ - user: ObjId│
│ - completed  │ │ - filename   │ │ - text: Str  │
│ - createdAt  │ │ - path       │ │ - createdAt  │
└──────────────┘ │ - size: Num  │ └──────────────┘
                 │ - uploadedBy │
                 └──────────────┘
```

### 2.2 Associations & Multiplicities
- `User "1"` $\longrightarrow$ `Project "*"` (Label: `createdBy`)
- `User "0..1"` $\longrightarrow$ `Task "*"` (Label: `assignedTo`)
- `Project "1"` $\blacklozenge\longrightarrow$ `Task "*"` (Aggregation / Container)
- `Task "1"` $\blacklozenge\longrightarrow$ `Subtask "*"` (Composition: `Task` owns lifecycle)
- `Task "1"` $\blacklozenge\longrightarrow$ `Attachment "*"` (Composition: `Task` owns lifecycle)
- `Task "1"` $\blacklozenge\longrightarrow$ `Comment "*"` (Composition: `Task` owns lifecycle)
- `User "1"` $\longrightarrow$ `Activity "*"` (Label: `loggedBy`)

---

## 3. Sequence Diagram Specification (Workflow Nominal)

### Participants (Lifelines in Left-to-Right Order)
1. `User : Collaborateur` (Actor)
2. `Front : Interface React` (Boundary)
3. `API : Serveur Express` (Control)
4. `DB : Base MongoDB` (Entity)
5. `WS : Service Socket.io` (System Service)

### Message Flow (Task Status Drag & Drop with RG-08)
1. `User -> Front`: Glisser carte tâche vers "Terminée"
2. `Front -> API`: `PATCH /api/tasks/:id { status: 'Terminée' }` (Bearer Token)
3. `API -> API`: Validation Token JWT & Droits RBAC
4. `API -> DB`: `updateOne({ _id: taskId }, { status: 'Terminée' })`
5. `DB --> API`: Confirmation persistance tâche
6. `API -> DB`: Requête recalcul avancement projet parent (RG-08)
7. `DB --> API`: Nouveau statut projet sauvegardé
8. `API -> WS`: Diffuser événement `kanban:task_updated`
9. `API --> Front`: `200 OK { task, projectStatus }`
10. `WS --> Front`: Broadcast temps réel aux autres navigateurs connectés
11. `Front --> User`: Notification toast succès & actualisation des indicateurs

---

## 4. Component Diagram Specification

- **Frontend Subsystem:**
  - Component: `React UI Engine`
  - Component: `Three.js 3D Canvas Subsystem`
  - Component: `Axios Client Interceptor`
  - Component: `Socket.io WebSocket Client`
- **Backend Subsystem:**
  - Component: `Express REST Router Gateway`
  - Component: `JWT / Bcrypt Security Middleware`
  - Component: `Task & Project Business Controllers`
  - Component: `Socket.io Real-Time Dispatcher`
  - Component: `Multer File Upload Middleware`
  - Component: `Mongoose ODM Layer`
- **Persistence Subsystem:**
  - Component: `MongoDB Wire Protocol Service (:27017)`
  - Component: `Local File Storage (/uploads)`

---

## 5. Deployment Diagram Specification

- **Client Execution Node:**
  - Node: `Poste Client (Navigateur Web Chrome / Brave / Edge)`
  - Artifact: `React 19 SPA Bundle` (HTML5, JS ES2024, CSS Tailwind, WebGL Three.js)
- **Application Server Node:**
  - Node: `Serveur d'Application (Node.js v20+ Runtime)`
  - Artifact: `Express REST API & Socket.io Server (:5000)`
  - Protocol: HTTPS / WSS
- **Database Server Node:**
  - Node: `Serveur de Persistance (MongoDB Server Daemon)`
  - Artifact: `Database Engine (:27017)`
  - Storage Volume: `Local Disk Volume (/uploads & /data/db)`
  - Protocol: TCP / MongoDB Wire Protocol
