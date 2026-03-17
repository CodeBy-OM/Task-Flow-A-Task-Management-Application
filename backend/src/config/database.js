const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const DB_PATH = process.env.DB_PATH || './data/taskapp.db';
const dbDir = path.dirname(path.resolve(DB_PATH));

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db;

const getDb = () => {
  if (!db) {
    db = new sqlite3.Database(path.resolve(DB_PATH), (err) => {
      if (err) {
        logger.error('Database connection error:', err);
        throw err;
      }
      logger.info(`Connected to SQLite database at ${DB_PATH}`);
    });

    // Enable WAL mode for better performance
    db.run('PRAGMA journal_mode=WAL');
    db.run('PRAGMA foreign_keys=ON');
  }
  return db;
};

// Promisified query helpers
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) {
        logger.error('DB Query Error:', { sql, params, error: err.message });
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function (err) {
      if (err) {
        logger.error('DB Run Error:', { sql, params, error: err.message });
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) {
        logger.error('DB Get Error:', { sql, params, error: err.message });
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Initialize database schema
const initializeDatabase = async () => {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1,
      last_login DATETIME
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed','cancelled')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
      due_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_revoked INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
  `;

  const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);

  for (const statement of statements) {
    await run(statement);
  }

  logger.info('Database schema initialized successfully');
};

const closeDb = () => {
  if (db) {
    db.close((err) => {
      if (err) logger.error('Error closing database:', err);
      else logger.info('Database connection closed');
    });
  }
};

module.exports = { getDb, query, run, get, initializeDatabase, closeDb };
