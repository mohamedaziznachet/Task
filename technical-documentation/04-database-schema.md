# 04. Database Schema & Data Models (MongoDB / Mongoose)

## 1. Database Architecture Overview

The persistence tier relies on **MongoDB** (NoSQL Document Store) hosted by default at `mongodb://127.0.0.1:27017/issat_project_management`.

The data architecture utilizes a **hybrid relational-document design**:
- **Top-Level Collections (Normalized references via `ObjectId`):** `users`, `projects`, `tasks`, and `activities`.
- **Embedded Sub-Document Collections (Compositions inside `tasks`):** `subtasks`, `attachments`, and `comments` are embedded directly within the parent `Task` document to guarantee atomic updates and zero join overhead for task details.

```
                    ┌─────────────────────────┐
                    │          User           │
                    ├─────────────────────────┤
                    │ _id (PK)                │◄────────────┐
                    │ name                    │             │
                    │ email (Unique)          │             │
                    │ password (Bcrypt Hash)  │             │
                    │ role (Enum)             │             │
                    └───────────┬─────────────┘             │
                                │ 1                         │ 1
                                │                           │
               ┌────────────────┼────────────────────────┐  │
               │ 1              │ 1                      │  │
               ▼ *              ▼ *                      ▼  │ *
      ┌─────────────────┐ ┌────────────────┐ ┌──────────────────┐
      │     Project     │ │    Activity    │ │       Task       │
      ├─────────────────┤ ├────────────────┤ ├──────────────────┤
      │ _id (PK)        │ │ _id (PK)       │ │ _id (PK)         │
      │ name (Unique)   │ │ user (FK)──────┼─┤ project (FK)     │
      │ description     │ │ action (Enum)  │ │ assignedTo (FK)──┘
      │ startDate       │ │ targetType     │ │ title            │
      │ endDate         │ │ targetTitle    │ │ description      │
      │ status (Enum)   │ │ targetId       │ │ status (Enum)    │
      │ createdBy (FK)──┘ │ details        │ │ priority (Enum)  │
      └────────┬────────┘ └────────────────┘ │ dueDate          │
               │ 1                           └────────┬─────────┘
               │                                      │ 1 (Composed)
               └───────────────────┐                  │
                                 * ▼                  ├───────────────────┬───────────────────┐
                          (Parent Project)            ▼ *                 ▼ *                 ▼ *
                                              ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
                                              │    Subtask    │   │  Attachment   │   │    Comment    │
                                              ├───────────────┤   ├───────────────┤   ├───────────────┤
                                              │ _id (PK)      │   │ _id (PK)      │   │ _id (PK)      │
                                              │ title         │   │ originalName  │   │ user (FK)     │
                                              │ completed     │   │ filename      │   │ text          │
                                              │ createdAt     │   │ path          │   │ createdAt     │
                                              │ updatedAt     │   │ mimetype      │   └───────────────┘
                                              └───────────────┘   │ size          │
                                                                  │ uploadedBy(FK)│
                                                                  │ uploadedAt    │
                                                                  └───────────────┘
```

---

## 2. Detailed Data Dictionary

### 2.1 Collection: `users` (`backend/models/User.js`)

Represents all human accounts across the three platform roles.

| Field Name | BSON Type | Constraints & Validations | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto-generated | Auto | Unique user identifier |
| `name` | `String` | `required: true`, `trim: true` | - | Full name of the user |
| `email` | `String` | `required: true`, `unique: true`, `lowercase: true`, `trim: true` | - | Corporate email (login identity) |
| `password` | `String` | `required: true` | - | One-way salted Bcrypt hash |
| `role` | `String` | `enum: ['Administrateur', 'Chef de projet', 'Employé']` | `'Employé'` | RBAC authorization level |
| `createdAt` | `Date` | Mongoose Timestamp | `Date.now` | Account creation timestamp |
| `updatedAt` | `Date` | Mongoose Timestamp | `Date.now` | Last update timestamp |

### 2.2 Collection: `projects` (`backend/models/Project.js`)

Represents organizational project portfolios with date boundaries.

| Field Name | BSON Type | Constraints & Validations | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto-generated | Auto | Unique project identifier |
| `name` | `String` | `required: true`, `unique: true`, `trim: true` | - | Project title (uniqueness enforced) |
| `description` | `String` | Optional | `''` | Long narrative or project scope |
| `startDate` | `Date` | `required: true` | - | Project kick-off milestone date |
| `endDate` | `Date` | `required: true`, must be `> startDate` (RG-01) | - | Target project delivery milestone |
| `status` | `String` | `enum: ['Non commencé', 'En cours', 'Terminé']` | `'Non commencé'` | Progress state computed via RG-08 |
| `createdBy` | `ObjectId` | `ref: 'User'` | `null` | Foreign reference to manager |
| `createdAt` | `Date` | Mongoose Timestamp | `Date.now` | Creation timestamp |
| `updatedAt` | `Date` | Mongoose Timestamp | `Date.now` | Last modification timestamp |

### 2.3 Collection: `tasks` (`backend/models/Task.js`)

Central operational unit with embedded sub-documents.

| Field Name | BSON Type | Constraints & Validations | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto-generated | Auto | Unique task identifier |
| `title` | `String` | `required: true`, `trim: true` | - | Task title |
| `description` | `String` | Optional | `''` | Detailed task instructions |
| `status` | `String` | `enum: ['Non commencée', 'En cours', 'Terminée']` | `'Non commencée'` | Execution lifecycle state |
| `priority` | `String` | `enum: ['Faible', 'Moyenne', 'Haute']` | `'Moyenne'` | Task urgency / criticality |
| `dueDate` | `Date` | `required: true`, within project interval (RG-07) | - | Hard deadline date |
| `project` | `ObjectId` | `ref: 'Project'`, `required: true` | - | Foreign Key to parent project |
| `assignedTo` | `ObjectId` | `ref: 'User'`, single member (RG-06) | `null` | Foreign Key to assigned employee |
| `subtasks` | `Array[Subtask]` | Embedded sub-document schema | `[]` | Checklist items |
| `attachments` | `Array[Attachment]` | Embedded sub-document schema | `[]` | Uploaded document references |
| `comments` | `Array[Comment]` | Embedded sub-document schema | `[]` | Discussion messages |
| `createdAt` | `Date` | Mongoose Timestamp | `Date.now` | Creation timestamp |
| `updatedAt` | `Date` | Mongoose Timestamp | `Date.now` | Last modification timestamp |

#### Embedded Schema: `subtasks`
| Field | BSON Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key | Auto | Subtask identifier |
| `title` | `String` | `required: true`, `trim: true` | - | Step/Item label |
| `completed` | `Boolean` | `required: true` | `false` | Checked/Unchecked flag |
| `createdAt` | `Date` | Mongoose Timestamp | `Date.now` | Creation timestamp |
| `updatedAt` | `Date` | Mongoose Timestamp | `Date.now` | Last toggle timestamp |

#### Embedded Schema: `attachments`
| Field | BSON Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key | Auto | Attachment identifier |
| `originalName`| `String` | `required: true` | - | File name as uploaded by user |
| `filename` | `String` | `required: true` | - | Unique physical file name on disk |
| `path` | `String` | `required: true` | - | Public URL path (`/uploads/...`) |
| `mimetype` | `String` | Optional | `''` | MIME type (e.g., `application/pdf`) |
| `size` | `Number` | Max 10,485,760 bytes (10 MB) | `0` | File size in bytes |
| `uploadedBy` | `ObjectId` | `ref: 'User'` | - | Foreign reference to uploader |
| `uploadedAt` | `Date` | `required: true` | `Date.now` | Upload timestamp |

#### Embedded Schema: `comments`
| Field | BSON Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key | Auto | Comment identifier |
| `user` | `ObjectId` | `ref: 'User'`, `required: true` | - | Foreign reference to commenter |
| `text` | `String` | `required: true`, `trim: true` | - | Comment body |
| `createdAt` | `Date` | `required: true` | `Date.now` | Timestamp of comment |

### 2.4 Collection: `activities` (`backend/models/Activity.js`)

Persistent audit trail tracking operational events across all platform resources.

| Field Name | BSON Type | Constraints & Validations | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto-generated | Auto | Unique log identifier |
| `user` | `ObjectId` | `ref: 'User'`, `required: true` | - | Actor who initiated the event |
| `action` | `String` | `required: true`, restricted enum (see below) | - | Event type descriptor |
| `targetType` | `String` | `enum: ['Task', 'Project', 'User']`, `required: true`| - | Polymorphic target classification |
| `targetTitle` | `String` | Optional | `''` | Snapshot of target name at event time |
| `targetId` | `ObjectId` | Optional | - | Direct reference to target entity |
| `details` | `String` | Optional | `''` | Human-readable explanation of delta |
| `createdAt` | `Date` | Mongoose Timestamp | `Date.now` | Event timestamp |
| `updatedAt` | `Date` | Mongoose Timestamp | `Date.now` | Update timestamp |

**Allowed Action Enum:**  
`'TASK_CREATED'`, `'TASK_UPDATED'`, `'TASK_STATUS_CHANGED'`, `'TASK_DELETED'`, `'SUBTASK_TOGGLED'`, `'ATTACHMENT_ADDED'`, `'COMMENT_ADDED'`, `'PROJECT_CREATED'`, `'PROJECT_UPDATED'`, `'PROJECT_DELETED'`, `'ROLE_UPDATED'`.

---

## 3. Data Integrity & Cardinality Rules

1. **User to Project (1:N):** One User (`Chef de projet`) can create multiple Projects. A Project has one creator (`createdBy: ObjectId`).
2. **User to Task (1:N):** One User (`Employé`) can have multiple Tasks assigned. Each Task is assigned to **at most ONE User** (`assignedTo: ObjectId`) conforming to **RG-06**.
3. **Project to Task (1:N):** One Project contains zero or many Tasks. A Task belongs strictly to **ONE Project** (`project: ObjectId`, `required: true`) conforming to **RG-09**.
4. **Task to Subtasks (1:N Composition):** Composed directly inside Task. If the parent Task is deleted, all embedded Subtasks are cascade-deleted automatically.
5. **Cascade Protection (RG-02):** A Project cannot be deleted while `Task.countDocuments({ project: projectId }) > 0`.
6. **User Deletion Protection (RG-15 & RG-16):** An Employé cannot be deleted while having tasks in `En cours` status. When an Employé is safely deleted, remaining tasks are decoupled (`assignedTo: null`).
