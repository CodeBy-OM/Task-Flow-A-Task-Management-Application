process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_minimum_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_min_32_chars!!';
process.env.COOKIE_SECRET = 'test_cookie_secret';
process.env.DB_PATH = ':memory:';
process.env.ENCRYPTION_KEY = 'test_32char_encryptionkey_here123';
process.env.FRONTEND_URL = 'http://localhost:3000';

const request = require('supertest');
const app = require('../src/app');
const { initializeDatabase } = require('../src/config/database');

let accessToken;
let taskId;

beforeAll(async () => {
  await initializeDatabase();
});

// ── Auth Tests ──────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test1234',
        full_name: 'Test User',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.accessToken).toBeDefined();
    accessToken = res.body.data.accessToken;
  });

  it('should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser2',
        email: 'test@example.com',
        password: 'Test1234',
      });
    expect(res.status).toBe(409);
  });

  it('should reject weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'user3', email: 'user3@example.com', password: 'weak' });
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });
});

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Test1234' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    accessToken = res.body.data.accessToken;
  });

  it('should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'WrongPass1' });
    expect(res.status).toBe(401);
  });

  it('should reject non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Test1234' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('should return user profile when authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('test@example.com');
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

// ── Task Tests ──────────────────────────────────────────────

describe('POST /api/tasks', () => {
  it('should create a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Test Task',
        description: 'A test task description',
        status: 'pending',
        priority: 'high',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Test Task');
    expect(res.body.data.priority).toBe('high');
    taskId = res.body.data.id;
  });

  it('should reject task with empty title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: '' });
    expect(res.status).toBe(422);
  });

  it('should require authentication', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Unauth Task' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/tasks', () => {
  it('should return paginated tasks', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBeGreaterThan(0);
  });

  it('should filter by status', async () => {
    const res = await request(app)
      .get('/api/tasks?status=pending')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((t) => expect(t.status).toBe('pending'));
  });

  it('should search by title', async () => {
    const res = await request(app)
      .get('/api/tasks?search=Test')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe('GET /api/tasks/stats', () => {
  it('should return statistics', async () => {
    const res = await request(app)
      .get('/api/tasks/stats')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeDefined();
    expect(res.body.data.pending).toBeDefined();
  });
});

describe('GET /api/tasks/:id', () => {
  it('should return a single task', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(taskId);
  });

  it('should return 404 for non-existent task', async () => {
    const res = await request(app)
      .get('/api/tasks/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/tasks/:id', () => {
  it('should update a task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Updated Task Title', status: 'in_progress' });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Task Title');
    expect(res.body.data.status).toBe('in_progress');
  });
});

describe('PATCH /api/tasks/:id/status', () => {
  it('should update task status', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('should delete a task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 after deletion', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(404);
  });
});

// ── Health Check ────────────────────────────────────────────

describe('GET /health', () => {
  it('should return healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});

describe('404 handler', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.status).toBe(404);
  });
});
