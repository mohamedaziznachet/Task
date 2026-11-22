# 10. Technical Decisions, Inconsistencies & Limitations

## 1. Architectural Justifications

### 1.1 Why MERN (MongoDB, Express, React, Node.js)?
- **Unified Language Stack (JavaScript/JSON):** Using JavaScript across frontend, backend, and database queries drastically eliminates impedance mismatch and serialization friction.
- **Academic Standard:** Perfectly aligns with the 3 GLSI curriculum at ISSAT Kasserine, demonstrating mastery of modern asynchronous event-driven paradigms.

### 1.2 Why MongoDB (Document-Oriented NoSQL) over MySQL?
- **Hierarchical Domain Modeling:** Tasks naturally contain subtasks, attachments, and comments. In a relational database, retrieving a task with its checklist and files requires 4 joined tables. In MongoDB, these are embedded sub-documents retrieved in a single indexed read.
- **Schema Evolution:** Rapid prototyping allowed agile addition of fields (e.g., `visualMode`, `mimetype`, `targetType`) without complex migration scripts.

### 1.3 Why Socket.io over HTTP Long-Polling?
- **Instantaneous Real-Time Synchronization:** HTTP polling would generate excessive server overhead (thousands of redundant GET requests). Socket.io establishes a single persistent TCP connection, broadcasting changes only when state mutates.

### 1.4 Why React Context API over Redux Toolkit?
- **Zero Boilerplate Overhead:** For an application with three primary state domains (Authentication, WebSocket events, Toast alerts), React Context provides complete reactive coverage without the heavy configuration overhead of Redux reducers, thunks, or actions.

### 1.5 Why Three.js on Authentication?
- **Differentiating User Experience:** Beyond standard form validation, rendering a 3D WebGL core provides biometric visual feedback, demonstrating advanced frontend graphics capabilities for academic evaluation.

---

## 2. Inconsistencies & Partial Implementations Identified in Source Code

During the technical code inspection, the following technical discrepancies and partial implementations were identified between the frontend and backend:

### Inconsistency 1: Missing Comment Deletion & Edit Endpoints
- **Observed Code:** [taskRoutes.js:L253](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/taskRoutes.js#L253) defines `POST /api/tasks/:id/comments`. However, there are **no corresponding `DELETE` or `PUT` endpoints** for comments.
- **Impact:** Once a comment is submitted, users cannot edit or delete it.

### Inconsistency 2: Client-Side vs Server-Side Activity Search
- **Observed Code:** [ActivityPage.jsx](file:///c:/Users/DELL/Desktop/tasks/Task/frontend/src/pages/ActivityPage.jsx) includes a search bar for filtering audit entries. However, [activityRoutes.js](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/activityRoutes.js) only accepts a `limit` query parameter without search query support. Filtering is performed purely in client memory on the loaded subset.

### Inconsistency 3: Unassigned Task Ownership Check for Employees
- **Observed Code:** In [taskRoutes.js:L145](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/taskRoutes.js#L145):
  ```javascript
  if (existingTask.assignedTo && existingTask.assignedTo.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Accès refusé' });
  }
  ```
- **Nuance:** If `assignedTo` is `null` (an unassigned task), an employee can technically claim or move it. This is practically advantageous for self-assigning teams but should be formalized in the business rules.

### Inconsistency 4: Hardcoded Fallback Secret in Source Code
- **Observed Code:** In [auth.js:L4](file:///c:/Users/DELL/Desktop/tasks/Task/backend/middleware/auth.js#L4) and [authRoutes.js:L11](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/authRoutes.js#L11):
  ```javascript
  const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_issat_2026';
  ```
- **Risk:** If the `.env` file is accidentally omitted, the server falls back to a known hardcoded string rather than terminating execution with a configuration error.

---

## 3. Scalability & Performance Bottlenecks

1. **Local Filesystem Attachment Storage (`/backend/uploads`):**  
   Files are stored on the local node's hard drive. In a horizontally scaled production cluster with multiple server instances behind a load balancer, uploaded files would not be shared across nodes.  
   *Recommendation:* Migrate to an S3-compatible object store (MinIO, Google Cloud Storage, AWS S3).
2. **Unindexed Regex Search on Tasks:**  
   [taskRoutes.js:L53](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/taskRoutes.js#L53) executes `query.title = { $regex: search, $options: 'i' }`. On large collections (>100,000 tasks), case-insensitive unanchored regex queries trigger full collection scans ($O(N)$).  
   *Recommendation:* Create a MongoDB text index (`taskSchema.index({ title: 'text', description: 'text' })`).
3. **Single-Node In-Memory Socket.io Adapter:**  
   The current Socket.io engine runs in-memory. Multi-process clustering (PM2) or multi-server scaling would prevent cross-node socket broadcasting.  
   *Recommendation:* Plug in the `@socket.io/redis-adapter` for production clustering.
