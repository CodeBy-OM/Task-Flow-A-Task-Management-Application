# TaskFlow API Documentation

**Base URL:** `http://localhost:5000/api`  
**Version:** 1.0.0  
**Auth:** JWT via HTTP-only cookies + `Authorization: Bearer <token>` header

---

## Authentication

All protected endpoints require a valid access token, sent automatically via HTTP-only cookie (`accessToken`) or as `Authorization: Bearer <token>` header.

---

## Auth Endpoints

### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "username": "janedoe",
  "email": "jane@example.com",
  "password": "Secret123",
  "full_name": "Jane Doe"
}
```

**Validation:**
- `username`: 3–30 chars, alphanumeric + underscores only
- `email`: valid email format
- `password`: 8–72 chars, must include uppercase, lowercase, digit
- `full_name`: optional, max 100 chars

**Success Response `201`:**
```json
{
  "success": true,
  "message": "Registration successful",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "janedoe",
      "email": "jane@example.com",
      "full_name": "Jane Doe"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response `409` (email taken):**
```json
{
  "success": false,
  "message": "An account with this email already exists.",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Error Response `422` (validation):**
```json
{
  "success": false,
  "message": "Validation failed",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "errors": [
    { "field": "password", "message": "Password must contain at least one uppercase, lowercase, and digit" }
  ]
}
```

---

### POST /auth/login

Authenticate and receive tokens.

**Request Body:**
```json
{
  "email": "jane@example.com",
  "password": "Secret123"
}
```

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Login successful",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "janedoe",
      "email": "jane@example.com",
      "full_name": "Jane Doe"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response `401`:**
```json
{
  "success": false,
  "message": "Invalid email or password.",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Cookies set:**
- `accessToken` — HttpOnly, Secure (prod), 7d expiry
- `refreshToken` — HttpOnly, Secure (prod), path `/api/auth/refresh`, 30d expiry

---

### POST /auth/refresh

Rotate refresh token and get new access token. Refresh token auto-read from cookie.

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": { "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
}
```

**Error Response `401`:**
```json
{
  "success": false,
  "message": "Invalid or expired refresh token."
}
```

---

### POST /auth/logout 🔒

Revoke current session. Clears both cookies.

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST /auth/logout-all 🔒

Revoke all sessions for the user across all devices.

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Logged out from all devices"
}
```

---

### GET /auth/me 🔒

Get current authenticated user's profile.

**Success Response `200`:**
```json
{
  "success": true,
  "message": "User profile retrieved",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "janedoe",
      "email": "jane@example.com",
      "full_name": "Jane Doe",
      "created_at": "2025-01-10T08:00:00.000Z",
      "last_login": "2025-01-15T10:30:00.000Z"
    }
  }
}
```

---

## Task Endpoints

> All task endpoints require authentication. Users can only access their own tasks.

---

### GET /tasks 🔒

List tasks with pagination, filtering, and search.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number (≥1) |
| `limit` | integer | 10 | Items per page (1–100) |
| `status` | string | — | Filter: `pending`, `in_progress`, `completed`, `cancelled` |
| `priority` | string | — | Filter: `low`, `medium`, `high` |
| `search` | string | — | Search in task title (partial match) |
| `sortBy` | string | `created_at` | Field: `created_at`, `updated_at`, `due_date`, `title`, `priority` |
| `sortOrder` | string | `desc` | `asc` or `desc` |

**Example:** `GET /tasks?page=1&limit=10&status=pending&search=review&sortBy=due_date&sortOrder=asc`

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Tasks retrieved",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Review pull request #42",
      "description": "Code review for the authentication module",
      "status": "pending",
      "priority": "high",
      "due_date": "2025-01-20T17:00:00.000Z",
      "created_at": "2025-01-15T09:00:00.000Z",
      "updated_at": "2025-01-15T09:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### GET /tasks/stats 🔒

Get task statistics for the authenticated user.

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Task statistics retrieved",
  "data": {
    "total": 25,
    "pending": 8,
    "in_progress": 5,
    "completed": 10,
    "cancelled": 2,
    "high_priority": 7,
    "overdue": 3
  }
}
```

---

### POST /tasks 🔒

Create a new task.

**Request Body:**
```json
{
  "title": "Implement login flow",
  "description": "Build the complete login and registration pages with validation and JWT integration.",
  "status": "pending",
  "priority": "high",
  "due_date": "2025-01-25T18:00:00.000Z"
}
```

**Validation:**
- `title`: required, 1–200 chars
- `description`: optional, max 2000 chars (stored AES-encrypted)
- `status`: optional, default `pending`
- `priority`: optional, default `medium`
- `due_date`: optional, ISO 8601

**Success Response `201`:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Implement login flow",
    "description": "Build the complete login and registration pages with validation and JWT integration.",
    "status": "pending",
    "priority": "high",
    "due_date": "2025-01-25T18:00:00.000Z",
    "created_at": "2025-01-15T10:30:00.000Z",
    "updated_at": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /tasks/:id 🔒

Get a single task by ID.

**URL Params:** `id` — UUID of the task

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Task retrieved",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Implement login flow",
    "description": "Build the complete login and registration pages.",
    "status": "in_progress",
    "priority": "high",
    "due_date": "2025-01-25T18:00:00.000Z",
    "created_at": "2025-01-15T10:30:00.000Z",
    "updated_at": "2025-01-16T08:00:00.000Z"
  }
}
```

**Error Response `404`:**
```json
{
  "success": false,
  "message": "Task not found."
}
```

---

### PUT /tasks/:id 🔒

Update a task (all fields optional).

**Request Body (all optional):**
```json
{
  "title": "Implement login & register flow",
  "description": "Updated description with OAuth integration details.",
  "status": "in_progress",
  "priority": "high",
  "due_date": "2025-01-28T18:00:00.000Z"
}
```

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": { "...updated task object..." }
}
```

---

### PATCH /tasks/:id/status 🔒

Quick status update endpoint.

**Request Body:**
```json
{ "status": "completed" }
```

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Task status updated",
  "data": { "...updated task object..." }
}
```

---

### DELETE /tasks/:id 🔒

Delete a task permanently.

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

**Error Response `404`:**
```json
{
  "success": false,
  "message": "Task not found."
}
```

---

## Error Reference

| HTTP Code | Meaning |
|-----------|---------|
| `200` | OK |
| `201` | Created |
| `400` | Bad Request |
| `401` | Unauthorized / Token expired |
| `403` | Forbidden |
| `404` | Not Found |
| `409` | Conflict (duplicate) |
| `422` | Validation Error |
| `429` | Rate Limited |
| `500` | Internal Server Error |

---

## Rate Limits

| Scope | Window | Max Requests |
|-------|--------|--------------|
| General API | 15 min | 100 |
| Auth endpoints | 15 min | 10 |

---

## Security Features

- **Passwords** hashed with bcrypt (cost factor 12)
- **JWT** signed with HS256, issuer/audience validated
- **Refresh token rotation** — old token invalidated on each refresh
- **HTTP-only cookies** prevent XSS token theft
- **Task descriptions** encrypted at rest with AES-256
- **SQL injection prevention** — all queries fully parameterized
- **Input validation** — express-validator on all inputs with escape/sanitize
- **Helmet** — secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
- **CORS** — restricted to configured frontend origin
- **Rate limiting** — per-IP, stricter on auth routes

---

## Health Check

### GET /health

```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600.123,
  "environment": "production"
}
```
