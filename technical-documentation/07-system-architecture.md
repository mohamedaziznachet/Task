# 07. System Architecture & Technical Design

## 1. High-Level Architectural Pattern

TaskFlow conforms to a decoupled **3-Tier Client-Server Architecture** utilizing the **MERN** technology stack (MongoDB, Express, React, Node.js). Communication between tiers is purely network-driven over HTTP/REST (stateless data interchange) and WebSocket (stateful bidirectional push).

```
┌────────────────────────────────────────────────────────────────────────┐
│                   TIER 1 : CLIENT PRESENTATION LAYER                    │
│                      (Single Page Application - SPA)                    │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     React 19 Core Framework                      │  │
│  │                                                                  │  │
│  │  ┌────────────────────────┐  ┌────────────────────────────────┐  │  │
│  │  │   Routing (Router v7)  │  │  Global State (Context API)    │  │  │
│  │  │   /dashboard, /tasks,  │  │  • AuthContext (JWT/User)      │  │  │
│  │  │   /projects, /users    │  │  • SocketContext (WS Stream)   │  │  │
│  │  └────────────────────────┘  │  • ToastContext (Alerts)       │  │  │
│  │                              └────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │           View Components & Rendering Subsystems           │  │  │
│  │  │  • Kanban Board (Drag & Drop)   • Calendar View (Monthly)  │  │  │
│  │  │  • Gantt Chronogram (Timeline)  • Three.js 3D Orb Canvas   │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────┬────────────────────────────────▲───────────────────┘
                    │ HTTPS REST (Axios)             │ WSS (Socket.io-client)
                    ▼ JSON Payloads / Bearer Token   │ Real-time Events
┌────────────────────────────────────────────────────┴───────────────────┐
│                    TIER 2 : APPLICATION SERVER LAYER                    │
│                     (Node.js & Express.js REST API)                    │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      Express HTTP Gateway                        │  │
│  │  • CORS Handler   • Body Parser (JSON)   • Static Files (/uploads)│  │
│  └──────────────────┬───────────────────────────────────────────────┘  │
│                     ▼                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                 Security & Authentication Layer                  │  │
│  │  • protect (JWT Bearer Verification)  • authorize (RBAC Guard)   │  │
│  └──────────────────┬───────────────────────────────────────────────┘  │
│                     ▼                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                       API Route Controllers                      │  │
│  │  • /api/auth       • /api/projects     • /api/tasks              │  │
│  │  • /api/dashboard  • /api/activities                             │  │
│  └────────┬─────────────────────────────────────────┬───────────────┘  │
│           │                                         │                  │
│           ▼                                         ▼                  │
│  ┌───────────────────────────────┐     ┌────────────────────────────┐  │
│  │   Business Logic & Helpers    │     │   Real-Time Server Engine  │  │
│  │  • recalculateProjectStatus() │     │   (Socket.io Engine)       │  │
│  │  • recordActivity() & Audit   │────►│   • Room: user:${userId}   │  │
│  │  • Multer File Storage Service│     │   • Broadcast: kanban:*    │  │
│  └────────┬──────────────────────┘     └────────────────────────────┘  │
└───────────┼────────────────────────────────────────────────────────────┘
            │ Mongoose ODM Wire Protocol
            ▼ TCP :27017
┌────────────────────────────────────────────────────────────────────────┐
│                     TIER 3 : PERSISTENCE DATA LAYER                    │
│                    (MongoDB NoSQL Document Database)                   │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │               Database: issat_project_management                 │  │
│  │  • users Collection           • projects Collection              │  │
│  │  • tasks Collection (with embedded subtasks, files, comments)    │  │
│  │  • activities Collection (Persistent Audit Trail)                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │               Filesystem: /backend/uploads (10MB Max)            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Subsystem Architecture (`/frontend/src`)

### 2.1 State Management via React Context API
Rather than introducing heavy third-party state managers (Redux, MobX), TaskFlow achieves optimal reactive decoupling through three scoped Context Providers mounted at the root:
1. `AuthContext` ([AuthContext.jsx](file:///c:/Users/DELL/Desktop/tasks/Task/frontend/src/context/AuthContext.jsx)):
   - Stores current user object (`{ _id, name, email, role, token }`).
   - Manages login, registration, profile update, and logout operations.
   - Synchronizes credentials with browser `localStorage`.
2. `SocketContext` ([SocketContext.jsx](file:///c:/Users/DELL/Desktop/tasks/Task/frontend/src/context/SocketContext.jsx)):
   - Initializes and manages the singleton Socket.io client instance.
   - Automatically joins user-specific room (`user:${userId}`).
   - Maintains real-time unread notification stack and dispatches alerts.
3. `ToastContext` ([ToastContext.jsx](file:///c:/Users/DELL/Desktop/tasks/Task/frontend/src/context/ToastContext.jsx)):
   - Exposes imperative alert methods (`showSuccess`, `showError`, `showInfo`).

### 2.2 Component Hierarchy & Routing Map
```
App.jsx (Root)
 ├── AuthProvider
 │    ├── ToastProvider
 │    │    └── SocketProvider
 │    │         └── MainWorkspace
 │    │              ├── Responsive Header (Mobile)
 │    │              ├── Sidebar (Navigation, Role badge, Collapse)
 │    │              └── Main View Container (React Router Routes)
 │    │                   ├── /login      -> LoginPage + Guardian3D Canvas
 │    │                   ├── /dashboard  -> DashboardPage (7 KPIs + CSV Export)
 │    │                   ├── /projects   -> ProjectsPage (Portfolio + Modals)
 │    │                   ├── /tasks      -> TasksPage (Kanban / Calendar / Gantt)
 │    │                   ├── /users      -> UsersPage (Admin-only RBAC Guard)
 │    │                   └── /activity   -> ActivityPage (Real-time Audit Trail)
```

### 2.3 3D Graphics Subsystem (`Guardian3D.jsx`)
- Powered by `three` (^0.186.1).
- Initializes a dynamic WebGL canvas rendering a central icosahedron/orb surrounded by orbiting particle rings.
- Subscribes to form input events on `LoginPage.jsx` via the `visualMode` prop:
  - `'idle'`: Slow rotation, cyan luminescence (`#38bdf8`).
  - `'password'`: Accelerated rotation, color shift to neon purple (`#a855f7`).
  - `'success'`: Green glow (`#22c55e`), radial particle expansion.
  - `'error'`: Erratic vibration, red flare (`#ef4444`).

---

## 3. Backend Subsystem Architecture (`/backend`)

### 3.1 Layered Modular Structure
- **Entrypoint ([server.js](file:///c:/Users/DELL/Desktop/tasks/Task/backend/server.js)):**
  Instantiates the Express application, wraps it inside an `http.Server`, binds the Socket.io server, applies global middleware (`cors`, `express.json`), serves the `/uploads` directory statically, connects to MongoDB via Mongoose, and registers API routers.
- **WebSocket Engine ([socket.js](file:///c:/Users/DELL/Desktop/tasks/Task/backend/socket.js)):**
  Exports `initSocket(server)` and `getIO()` to decouple WebSocket event dispatching from route handlers.
- **Security Middlewares ([auth.js](file:///c:/Users/DELL/Desktop/tasks/Task/backend/middleware/auth.js)):**
  Interprets JWT tokens and executes RBAC authorization guards before controller code execution.
- **Domain Utilities ([utils/](file:///c:/Users/DELL/Desktop/tasks/Task/backend/utils)):**
  Encapsulates cross-cutting business rules (project status recalculation and audit trail logging).

---

## 4. Real-Time Event Communication Topology

WebSocket communication operates over an event-driven architecture powered by Socket.io:

| Event Name | Direction | Payload Structure | Scope / Target | Description |
| :--- | :---: | :--- | :--- | :--- |
| `join_user` | Client $\rightarrow$ Server | `userId: String` | Server Socket | Assigns client socket to private room `user:${userId}` |
| `kanban:task_created` | Server $\rightarrow$ Client | Full Populated `Task` | Global (`io.emit`) | Live adds card to all open Kanban and Calendar views |
| `kanban:task_updated` | Server $\rightarrow$ Client | Full Populated `Task` | Global (`io.emit`) | Moves card column, updates details, refreshes subtasks |
| `kanban:task_deleted` | Server $\rightarrow$ Client | `{ id, projectId }` | Global (`io.emit`) | Removes card from all client views and triggers refresh |
| `project:created` | Server $\rightarrow$ Client | Full `Project` | Global (`io.emit`) | Adds project to project lists |
| `project:updated` | Server $\rightarrow$ Client | Full `Project` | Global (`io.emit`) | Updates project parameters across clients |
| `project:deleted` | Server $\rightarrow$ Client | `{ id }` | Global (`io.emit`) | Purges project from client views |
| `activity:new` | Server $\rightarrow$ Client | Full Populated `Activity` | Global (`io.emit`) | Appends record to live audit log in `ActivityPage` |
| `notification:new` | Server $\rightarrow$ Client | `{ id, action, details, from }`| Private (`to(user:id)`) | Increments bell counter and triggers toast on target user |
