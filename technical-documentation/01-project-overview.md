# 01. Project Overview & Technical Identity

## 1. Executive Summary

**TaskFlow** is an enterprise-grade, collaborative Project and Task Management web platform developed as an academic capstone engineering project for the **Licence 3 GLSI** (Génie Logiciel et Systèmes d'Information) curriculum at the **Institut Supérieur des Sciences Appliquées et de Technologie de Kasserine (ISSAT Kasserine)** under the academic supervision of **Mme A. Yengui**.

The platform provides a centralized, real-time environment designed to eliminate operational friction caused by scattered productivity tools (spreadsheets, emails, paper forms). It delivers end-to-end task delegation, multidimensional scheduling (Kanban, Calendar, Gantt, List), an automated project progress calculation engine, biometric/3D interactive authentication feedback, live WebSocket event synchronization, file attachment handling, and audit trail compliance.

---

## 2. Academic Context & Governance

| Attribute | Specification |
| :--- | :--- |
| **Institution** | Institut Supérieur des Sciences Appliquées et de Technologie de Kasserine (ISSAT Kasserine) |
| **Department** | Département d'Informatique & Génie Logiciel |
| **Academic Degree** | Licence en Sciences et Technologies de l'Information et des Communications (3 GLSI) |
| **Course Unit** | Génie Logiciel, Modélisation UML & Développement Web Avancé |
| **Supervising Professor** | Mme A. Yengui |
| **Methodology** | Agile Scrum (Product Backlog, Sprints, User Stories with Acceptance Criteria) |
| **Project Codebase State** | Production-ready prototype with 30 passing automated tests |

---

## 3. Complete Technology Stack & Version Matrix

The platform is engineered upon a decoupled **MERN 3-Tiers (Model-View-Controller / Single Page Application)** architecture:

```
[ Client: Web Browser ]  <--- HTTPS / WSS --->  [ Server: Node.js / Express ]  <--- TCP / Wire --->  [ Database: MongoDB Engine ]
  • React 19.3.1 SPA                               • Express 4.19.2 REST API                           • MongoDB 7.x (issat_project_management)
  • Tailwind CSS 3.4.19                            • Socket.io 4.8.4 WebSocket Engine                  • Mongoose 8.3.1 ODM
  • Three.js 0.186.1 WebGL                         • Multer 2.5.0 Multipart Engine                     • Local File Storage (/uploads)
```

### 3.1 Frontend Dependencies (`frontend/package.json`)
- **Runtime Core:** `react` (^19.3.1), `react-dom` (^19.3.1)
- **Routing Engine:** `react-router-dom` (^7.18.5)
- **HTTP Client:** `axios` (^1.20.0) with custom Bearer token and 401 interception
- **Real-Time WebSocket Client:** `socket.io-client` (^4.8.4)
- **3D Graphics Engine:** `three` (^0.186.1) - WebGL Shaders, dynamic lighting, particle systems
- **UI Iconography:** `lucide-react` (^1.61.0)
- **Build Tool & Bundler:** `vite` (^8.3.4), `@vitejs/plugin-react` (^6.1.2)
- **Styling Utility:** `tailwindcss` (^3.4.19), `postcss` (^8.5.31), `autoprefixer` (^10.6.1)
- **Linter & Code Quality:** `oxlint` (^1.88.0)

### 3.2 Backend Dependencies (`backend/package.json`)
- **Application Server:** `express` (^4.19.2), `node` (v20+)
- **Database ODM:** `mongoose` (^8.3.1)
- **Real-Time Communication:** `socket.io` (^4.8.4)
- **Authentication & Security:** `jsonwebtoken` (^9.0.2), `bcryptjs` (^2.4.3)
- **File Ingestion:** `multer` (^2.5.0)
- **Cross-Origin Handling:** `cors` (^2.8.5)
- **Environment Management:** `dotenv` (^16.4.5)
- **Testing Harness:** `jest` (^29.7.0), `supertest` (^6.3.4)
- **Development Tooling:** `nodemon` (^3.1.0)

---

## 4. Source Tree & Physical Layout

The repository is organized cleanly into root workspace artifacts, a Node.js Express backend, and a Vite React frontend:

```
c:\Users\DELL\Desktop\tasks\Task
├── dev.js                                # Unified orchestrator running backend (:5000) & frontend (:5173)
├── package.json                          # Workspace root package config (scripts: dev, test, install:all)
├── README.md                             # Academic and developer setup documentation
├── Cahier_Des_Charges_TaskFlow_3GLSI.pdf # Official 6-page University Cahier des Charges (PDF)
├── Cahier_Des_Charges_TaskFlow_3GLSI.docx# Official 6-page University Cahier des Charges (Word)
├── diagramme_cas_utilisation.drawio     # Native Draw.io XML for Use Case Model
├── diagramme_cas_utilisation.png        # High-res rendered Use Case Diagram vector
├── diagramme_sequence_principal.drawio  # Native Draw.io XML for Sequence Models (Global + Auth)
├── diagramme_sequence.png               # High-res rendered Sequence Diagram vector
│
├── backend/                              # Backend Node.js / Express Service
│   ├── .env                              # Environment configuration (PORT, MONGO_URI, JWT_SECRET)
│   ├── .env.example                      # Template for environment configuration
│   ├── package.json                      # Backend dependencies, Jest scripts, seed script
│   ├── server.js                         # Application entrypoint, HTTP/WebSocket bootstrap, route mounting
│   ├── socket.js                         # Socket.io initialization, room assignment (`user:${id}`)
│   ├── seed.js                           # Database seeding script (Admin, Chef, Employé demo datasets)
│   ├── uploads/                          # Physical storage directory for uploaded task files
│   │
│   ├── middleware/
│   │   └── auth.js                       # JWT Bearer verification (`protect`) & RBAC guard (`authorize`)
│   │
│   ├── models/
│   │   ├── User.js                       # Mongoose model: User entity with hashed password & role enum
│   │   ├── Project.js                    # Mongoose model: Project entity with dates & createdBy reference
│   │   ├── Task.js                       # Mongoose model: Task entity + embedded Subtasks, Attachments, Comments
│   │   └── Activity.js                   # Mongoose model: Audit trail log entry with polymorphic target
│   │
│   ├── routes/
│   │   ├── authRoutes.js                 # Endpoints: /register, /login, /profile, /users (CRUD & RBAC)
│   │   ├── projectRoutes.js              # Endpoints: / (CRUD, date consistency check, delete integrity)
│   │   ├── taskRoutes.js                 # Endpoints: / (CRUD, Kanban drag/drop, subtasks, files, comments)
│   │   ├── dashboardRoutes.js            # Endpoints: /stats (Aggregation of 7 operational KPIs)
│   │   └── activityRoutes.js             # Endpoints: / (Audit trail stream with user population)
│   │
│   ├── utils/
│   │   ├── activityHelper.js             # Helper: Persists audit record & broadcasts via WebSocket
│   │   └── projectStatusHelper.js        # Helper: Evaluates RG-08 and updates project status
│   │
│   └── tests/
│       ├── setup.js                      # In-memory MongoDB testing harness
│       ├── auth.test.js                  # Automated test suite for registration, login, profile, user admin
│       ├── projects.test.js              # Automated test suite for project CRUD, dates check, cascade delete
│       ├── tasks.test.js                 # Automated test suite for task delegation, status transition, subtasks
│       └── dashboard.test.js             # Automated test suite for 7 KPI calculations & overdue metrics
│
└── frontend/                             # Frontend React 19 Single Page Application
    ├── index.html                        # HTML5 host document with Google Inter & JetBrains Mono typography
    ├── vite.config.js                    # Vite bundler configuration with React plugin
    ├── tailwind.config.js                # Custom design system tokens (slate-950, sky, indigo, emerald)
    ├── package.json                      # Frontend dependencies and dev scripts
    │
    ├── src/
    │   ├── main.jsx                      # React 19 DOM root mounting
    │   ├── App.jsx                       # Master workspace routing, responsive sidebar drawer, guard
    │   ├── index.css                     # Global Tailwind directives & dark-mode scrollbars
    │   │
    │   ├── services/
    │   │   └── api.js                    # Axios instance with Bearer interceptor & 401 expiration dispatcher
    │   │
    │   ├── context/
    │   │   ├── AuthContext.jsx           # Global user state, JWT persistence, login, register, logout
    │   │   ├── SocketContext.jsx         # Live WebSocket connection, notification badge, room listener
    │   │   └── ToastContext.jsx          # Toast dispatching system (success, error, info alerts)
    │   │
    │   ├── components/
    │   │   ├── Logo.jsx                  # Brand SVG emblem with customizable sizes
    │   │   ├── Sidebar.jsx               # Navigation bar, user role badge, collapse controls, logout
    │   │   ├── NotificationBell.jsx      # Header dropdown displaying real-time Socket.io notification stack
    │   │   ├── ProfileModal.jsx          # Modal for updating username and Bcrypt-verified password
    │   │   ├── Guardian3D.jsx            # WebGL Three.js interactive 3D particle core (Login visual cue)
    │   │   ├── CalendarView.jsx          # Interactive monthly/weekly task scheduler view
    │   │   └── GanttView.jsx             # Chronogram Gantt timeline visualizing task overlapping
    │   │
    │   └── pages/
    │       ├── LoginPage.jsx             # Auth portal: Login/Register tabs paired with Guardian3D WebGL
    │       ├── DashboardPage.jsx         # Analytics view: 7 KPI counters, completion gauges, CSV exporter
    │       ├── ProjectsPage.jsx          # Project portfolio: CRUD modals, progress bars, date checks
    │       ├── TasksPage.jsx             # Task operational center: Kanban Drag/Drop, Calendar, Gantt, List, Modals
    │       ├── UsersPage.jsx             # Admin-only: Personnel directory, role promotion, delete guard
    │       └── ActivityPage.jsx          # Real-time audit log: Event categorization and member filtering
```
