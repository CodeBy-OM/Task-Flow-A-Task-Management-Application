# TaskFlow — Full-Stack Task Management Application

A production-ready task management application built with **Node.js/Express** (backend) and **React** (frontend), featuring JWT authentication, AES encryption, role-based authorization, and a clean dark-themed UI.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | SQLite (via `sqlite3`) |
| Auth | JWT (access + refresh tokens), bcrypt |
| Security | Helmet, CORS, express-rate-limit, express-validator |
| Encryption | CryptoJS (AES-256) |
| Frontend | React 18, React Router v6 |
| State/Data | TanStack Query (React Query) |
| HTTP Client | Axios |
| Styling | Custom CSS with CSS variables |
| Containerization | Docker, Docker Compose |

---

## Project Structure

```
taskapp/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js       # SQLite init, schema, query helpers
│   │   ├── controllers/
│   │   │   ├── authController.js # Register, login, refresh, logout
│   │   │   └── taskController.js # CRUD + stats + pagination
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT authentication middleware
│   │   │   ├── validation.js     # Input validation rules
│   │   │   ├── errorHandler.js   # Global error + 404 handler
│   │   │   └── rateLimiter.js    # API + auth rate limiters
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   └── taskRoutes.js
│   │   ├── utils/
│   │   │   ├── encryption.js     # AES-256 encrypt/decrypt helpers
│   │   │   ├── tokenUtils.js     # JWT generate/verify/rotate
│   │   │   ├── responseHelper.js # Standardized API responses
│   │   │   └── logger.js         # Winston logger
│   │   ├── app.js                # Express app setup
│   │   └── server.js             # Entry point + graceful shutdown
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx        # Sidebar navigation layout
│   │   │   ├── UI.jsx            # Button, Input, Modal, Pagination...
│   │   │   ├── TaskCard.jsx      # Task card with inline actions
│   │   │   ├── TaskForm.jsx      # Create/edit form
│   │   │   └── StatsCard.jsx     # Dashboard stat widget
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global auth state
│   │   ├── hooks/
│   │   │   └── useTasks.js       # React Query hooks for tasks
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TasksPage.jsx
│   │   │   └── TaskDetailPage.jsx
│   │   ├── services/
│   │   │   ├── api.js            # Axios instance + auto-refresh interceptor
│   │   │   ├── authService.js
│   │   │   └── taskService.js
│   │   └── App.jsx               # Router + protected routes
│   ├── .env.example
│   └── package.json
├── docs/
│   └── API.md                    # Full API reference
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Quick Start (Local Development)

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your secrets

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your API URL
```

**Required backend `.env` values:**
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=<min 32 chars, random string>
JWT_REFRESH_SECRET=<min 32 chars, different random string>
COOKIE_SECRET=<random string>
ENCRYPTION_KEY=<exactly 32 chars>
DB_PATH=./data/taskapp.db
FRONTEND_URL=http://localhost:3000
```

### 3. Run both servers

```bash
# From project root (runs both concurrently)
npm run dev

# Or separately:
npm run dev:backend   # http://localhost:5000
npm run dev:frontend  # http://localhost:3000
```

---

## Docker Deployment

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

Create a `.env` file in the project root for Docker Compose:
```env
JWT_SECRET=your_production_jwt_secret_here_min_32_chars
JWT_REFRESH_SECRET=your_production_refresh_secret_here
COOKIE_SECRET=your_production_cookie_secret
ENCRYPTION_KEY=your_32_char_encryption_key_here!
FRONTEND_URL=https://yourdomain.com
```

---

## Features

### Authentication & Security
- ✅ User registration with email/username uniqueness checks
- ✅ bcrypt password hashing (cost factor 12)
- ✅ JWT access tokens (7d) + refresh tokens (30d) with rotation
- ✅ Tokens stored in **HTTP-only cookies** (XSS-safe)
- ✅ Automatic token refresh via Axios interceptor
- ✅ Logout (single device) + logout-all (all devices)

### Task Management
- ✅ Full CRUD for tasks with title, description, status, priority, due date
- ✅ **Pagination** — configurable page size, page count, navigation
- ✅ **Filter** by status and priority
- ✅ **Search** by title (partial match, debounced)
- ✅ **Sort** by any field, asc/desc
- ✅ Task statistics (total, by status, overdue count)
- ✅ Quick status transitions from card and detail view

### Security
- ✅ AES-256 encryption of task descriptions at rest
- ✅ Parameterized SQL queries (zero raw string interpolation)
- ✅ Input validation + sanitization on all endpoints
- ✅ Helmet (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- ✅ CORS restricted to configured frontend origin
- ✅ Rate limiting (100 req/15min general, 10 req/15min auth)
- ✅ Strict user-scoped authorization (users access only their own tasks)

### Frontend
- ✅ Protected routes (redirect to login if unauthenticated)
- ✅ Responsive layout with collapsible sidebar
- ✅ Dark theme with consistent design system
- ✅ Loading skeletons, toasts, confirmation dialogs
- ✅ React Query for efficient caching and background refetching

---

## API Documentation

Full request/response documentation: [`docs/API.md`](docs/API.md)

Health check: `GET /health`

---

## Environment Variables Reference

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment |
| `PORT` | No | `5000` | Server port |
| `JWT_SECRET` | **Yes** | — | JWT signing secret (32+ chars) |
| `JWT_EXPIRES_IN` | No | `7d` | Access token TTL |
| `JWT_REFRESH_SECRET` | **Yes** | — | Refresh token secret |
| `JWT_REFRESH_EXPIRES_IN` | No | `30d` | Refresh token TTL |
| `COOKIE_SECRET` | **Yes** | — | Cookie signing secret |
| `DB_PATH` | No | `./data/taskapp.db` | SQLite file path |
| `ENCRYPTION_KEY` | **Yes** | — | AES key (32 chars exactly) |
| `FRONTEND_URL` | No | `http://localhost:3000` | CORS allowed origin |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per window |

### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REACT_APP_API_URL` | No | `http://localhost:5000/api` | Backend API URL |
| `REACT_APP_ENCRYPTION_KEY` | No | — | Must match backend `ENCRYPTION_KEY` |

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,           -- UUID v4
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,        -- bcrypt hash
  full_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1,
  last_login DATETIME
);

-- Tasks
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,           -- UUID v4
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,              -- AES-256 encrypted
  status TEXT NOT NULL DEFAULT 'pending',  -- pending|in_progress|completed|cancelled
  priority TEXT NOT NULL DEFAULT 'medium', -- low|medium|high
  due_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Refresh Tokens
CREATE TABLE refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_revoked INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
