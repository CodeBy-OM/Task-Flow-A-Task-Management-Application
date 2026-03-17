const { v4: uuidv4 } = require('uuid');
const { run, get, query } = require('../config/database');
const { encryptFields, decryptFields } = require('../utils/encryption');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');
const logger = require('../utils/logger');

// Fields to encrypt in task description (sensitive payload field)
const ENCRYPTED_FIELDS = ['description'];

const decryptTask = (task) => {
  if (!task) return null;
  try {
    return decryptFields(task, ENCRYPTED_FIELDS);
  } catch {
    return task; // Return as-is if decryption fails (e.g. legacy unencrypted)
  }
};

// GET /api/tasks
const getTasks = async (req, res) => {
  const userId = req.user.id;
  const {
    page = 1,
    limit = 10,
    status,
    priority,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = req.query;

  const offset = (page - 1) * limit;

  // Build dynamic WHERE clause (parameterized to prevent SQL injection)
  const conditions = ['user_id = ?'];
  const params = [userId];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  if (priority) {
    conditions.push('priority = ?');
    params.push(priority);
  }

  if (search && search.trim()) {
    conditions.push('title LIKE ?');
    params.push(`%${search.trim()}%`);
  }

  const whereClause = conditions.join(' AND ');

  // Whitelist sort fields and order
  const allowedSortFields = ['created_at', 'updated_at', 'due_date', 'title', 'priority'];
  const allowedSortOrders = ['asc', 'desc'];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  const safeSortOrder = allowedSortOrders.includes(sortOrder?.toLowerCase()) ? sortOrder : 'desc';

  // Get total count
  const countRow = await get(
    `SELECT COUNT(*) as total FROM tasks WHERE ${whereClause}`,
    params
  );
  const total = countRow?.total || 0;

  // Get paginated tasks
  const tasks = await query(
    `SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
     FROM tasks
     WHERE ${whereClause}
     ORDER BY ${safeSortBy} ${safeSortOrder}
     LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), parseInt(offset)]
  );

  // Decrypt descriptions
  const decryptedTasks = tasks.map(decryptTask);

  return paginatedResponse(res, decryptedTasks, total, page, limit, 'Tasks retrieved');
};

// GET /api/tasks/:id
const getTask = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const task = await get(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
    [id, userId]
  );

  if (!task) {
    return errorResponse(res, 'Task not found.', 404);
  }

  return successResponse(res, decryptTask(task), 'Task retrieved');
};

// POST /api/tasks
const createTask = async (req, res) => {
  const userId = req.user.id;
  const { title, description, status = 'pending', priority = 'medium', due_date } = req.body;

  const id = uuidv4();
  const encryptedDescription = description ? encryptFields({ description }, ENCRYPTED_FIELDS).description : null;

  await run(
    `INSERT INTO tasks (id, user_id, title, description, status, priority, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, title, encryptedDescription, status, priority, due_date || null]
  );

  const task = await get('SELECT * FROM tasks WHERE id = ?', [id]);

  logger.info(`Task created: ${id} by user: ${userId}`);
  return successResponse(res, decryptTask(task), 'Task created successfully', 201);
};

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const existing = await get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
  if (!existing) {
    return errorResponse(res, 'Task not found.', 404);
  }

  const allowedFields = ['title', 'description', 'status', 'priority', 'due_date'];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return errorResponse(res, 'No valid fields provided for update.', 400);
  }

  // Encrypt description if present
  if (updates.description !== undefined) {
    updates.description = updates.description
      ? encryptFields({ description: updates.description }, ENCRYPTED_FIELDS).description
      : null;
  }

  updates.updated_at = new Date().toISOString();

  const setClauses = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), id, userId];

  await run(
    `UPDATE tasks SET ${setClauses} WHERE id = ? AND user_id = ?`,
    values
  );

  const updatedTask = await get('SELECT * FROM tasks WHERE id = ?', [id]);

  logger.info(`Task updated: ${id} by user: ${userId}`);
  return successResponse(res, decryptTask(updatedTask), 'Task updated successfully');
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const existing = await get('SELECT id FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
  if (!existing) {
    return errorResponse(res, 'Task not found.', 404);
  }

  await run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);

  logger.info(`Task deleted: ${id} by user: ${userId}`);
  return successResponse(res, null, 'Task deleted successfully');
};

// PATCH /api/tasks/:id/status
const updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return errorResponse(res, 'Invalid status value.', 422);
  }

  const existing = await get('SELECT id FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
  if (!existing) {
    return errorResponse(res, 'Task not found.', 404);
  }

  await run(
    'UPDATE tasks SET status = ?, updated_at = datetime("now") WHERE id = ? AND user_id = ?',
    [status, id, userId]
  );

  const updatedTask = await get('SELECT * FROM tasks WHERE id = ?', [id]);
  return successResponse(res, decryptTask(updatedTask), 'Task status updated');
};

// GET /api/tasks/stats
const getTaskStats = async (req, res) => {
  const userId = req.user.id;

  const stats = await query(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
       SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
       SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority,
       SUM(CASE WHEN due_date < datetime('now') AND status NOT IN ('completed','cancelled') THEN 1 ELSE 0 END) as overdue
     FROM tasks WHERE user_id = ?`,
    [userId]
  );

  return successResponse(res, stats[0], 'Task statistics retrieved');
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, updateTaskStatus, getTaskStats };
