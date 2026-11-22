# 06. Authentication & Security Analysis

## 1. Authentication Architecture

The TaskFlow platform implements a **stateless token-based authentication mechanism** utilizing **JSON Web Tokens (JWT)** and **Bcrypt.js password hashing**.

```
[ User Agent (React) ]                      [ Express Server ]                     [ MongoDB ]
          │                                         │                                   │
          │ ── 1. POST /api/auth/login ───────────► │                                   │
          │    { email, password }                  │ ── 2. findOne({ email }) ───────► │
          │                                         │ ◄─ 3. Returns User + Hash ─────── │
          │                                         │                                   │
          │                                         │ ── 4. bcrypt.compare(pwd, hash)   │
          │                                         │ ── 5. jwt.sign({ id }, secret)    │
          │ ◄─ 6. 200 OK { token, user } ────────── │                                   │
          │                                         │                                   │
          │ ── 7. Subsequent Requests ────────────► │                                   │
          │    Header: "Bearer <token>"             │ ── 8. jwt.verify(token)           │
          │                                         │ ── 9. User.findById(decoded.id)   │
          │ ◄─ 10. Processed Response ───────────── │                                   │
```

---

## 2. Security Mechanisms Implemented in Code

### 2.1 Password Hashing (`bcryptjs`)
- **Algorithm:** Blowfish-based adaptive one-way hashing function (`bcrypt`).
- **Salt Rounds:** `10` rounds of cryptographic salting dynamically generated.
- **Enforcement Points:**
  - Registration: [authRoutes.js:L25](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/authRoutes.js#L25) -> `await bcrypt.hash(password, 10)`.
  - Profile Password Change: [authRoutes.js:L107](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/authRoutes.js#L107) -> `await bcrypt.hash(newPassword, 10)`.
  - Credential Verification: [authRoutes.js:L68](file:///c:/Users/DELL/Desktop/tasks/Task/backend/routes/authRoutes.js#L68) -> `await bcrypt.compare(password, user.password)`.

### 2.2 Token Formulation & Lifecycle (`jsonwebtoken`)
- **Payload:** Strictly minimal: `{ id: user._id }`. Zero sensitive information (no passwords, emails, or roles are stored inside the unencrypted token body).
- **Signing Algorithm:** Default HMAC-SHA256 (`HS256`).
- **Token Validity / Expiration:** `7d` (7 days).
- **Secret Management:** Retrieved via `process.env.JWT_SECRET` with fallback to `'super_secret_jwt_key_issat_2026'`.

### 2.3 Role-Based Access Control (RBAC) Middleware (`backend/middleware/auth.js`)
Access is gated at the HTTP router level via two composable Express middleware functions:
1. `protect`:
   - Extracts the Bearer token from the `Authorization` header.
   - Decodes and verifies the signature using `jwt.verify()`.
   - Fetches the active user from MongoDB while stripping the password field: `User.findById(decoded.id).select('-password')`.
   - Injects the authenticated Mongoose document into `req.user`.
   - Returns `401 Unauthorized` if token is missing, invalid, or expired.
2. `authorize(...roles)`:
   - Validates that `req.user.role` matches one of the authorized roles passed as arguments.
   - Returns `403 Forbidden` if role is insufficient: `{ "message": "Le rôle (Employé) n'est pas autorisé à effectuer cette action" }`.

### 2.4 Client-Side Session & Axios Interceptors (`frontend/src/services/api.js`)
- **Token Persistence:** Stored in browser `localStorage` under the key `'issat_user'`.
- **Request Interceptor:** Automatically appends `Authorization: Bearer <token>` to every outgoing Axios request.
- **Response Interceptor:** Detects `401 Unauthorized` responses (excluding login failures), purges `localStorage`, and emits a custom DOM event (`auth:expired`) that resets React's global authentication state.

### 2.5 File Upload Safeguards (`Multer`)
- **Payload Size Restriction:** Capped strictly at 10 MB (`limits: { fileSize: 10 * 1024 * 1024 }`).
- **Filename Randomization:** Prevents path traversal and filename collisions via timestamp and random entropy suffix: `Date.now() + '-' + Math.round(Math.random() * 1e9) + ext`.

---

## 3. Implemented vs Unimplemented / Planned Features

| Security Feature | Implementation Status | Technical Assessment |
| :--- | :---: | :--- |
| **Password Hashing (Bcrypt 10 rounds)** | ✅ Implemented | Production grade. Plaintext never touches database. |
| **JWT Bearer Authentication** | ✅ Implemented | Fully functional stateless session handling. |
| **RBAC Route Guarding** | ✅ Implemented | Granular role isolation across controllers. |
| **Zero Password Database Output** | ✅ Implemented | Enforced via `.select('-password')` on queries. |
| **Input Sanitization (Trim / Lowercase)**| ✅ Implemented | Handled in Mongoose schema definitions. |
| **File Upload Size Cap (10 MB)** | ✅ Implemented | Handled via Multer limits. |
| **Cascade Deletion Integrity Guards** | ✅ Implemented | Enforces RG-02, RG-15, and RG-16. |
| **Refresh Token Rotation** | ❌ Not Implemented | Only single long-lived access token (7 days). |
| **HttpOnly Secure Cookie Storage** | ❌ Not Implemented | Tokens currently stored in browser `localStorage`. |
| **Strict MIME Type Whitelisting** | ⚠️ Partial | Multer accepts any file type if under 10 MB. |
| **Rate Limiting / Brute Force Guard** | ❌ Not Implemented | No `express-rate-limit` active on `/api/auth/login`. |
| **CORS Origin Lockdown** | ⚠️ Partial | `cors()` initialized with wildcard (`*`) for local development. |

---

## 4. Security Recommendations for Production Deployment

1. **Adopt Refresh Token Rotation & HttpOnly Cookies:**  
   Transition from storing JWTs in `localStorage` (which is accessible to XSS attacks) to storing short-lived access tokens (15 minutes) in memory and long-lived refresh tokens in `SameSite=Strict; HttpOnly; Secure` cookies.
2. **Implement Rate Limiting:**  
   Mount `express-rate-limit` on `/api/auth/login` to prevent credential stuffing (e.g., maximum 5 attempts per IP per 15 minutes).
3. **MIME Type Validation & Magic Number Verification:**  
   Configure Multer's `fileFilter` to accept only authorized extensions (`.pdf`, `.png`, `.jpg`, `.docx`, `.zip`) and verify file magic numbers using `file-type` to prevent executable upload exploits.
4. **Environment Secret Hardening:**  
   Ensure `JWT_SECRET` is never committed to version control and throw a fatal startup error if `process.env.JWT_SECRET` is unset in production.
