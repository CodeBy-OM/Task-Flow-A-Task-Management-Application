require('dotenv').config();
const app = require('./app');
const { initializeDatabase, closeDb } = require('./config/database');
const { cleanExpiredTokens } = require('./utils/tokenUtils');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized');

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });

    // Clean expired tokens every 6 hours
    const tokenCleanupInterval = setInterval(async () => {
      try {
        await cleanExpiredTokens();
      } catch (err) {
        logger.error('Token cleanup failed:', err);
      }
    }, 6 * 60 * 60 * 1000);

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      clearInterval(tokenCleanupInterval);
      server.close(() => {
        closeDb();
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      process.exit(1);
    });

    return server;
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
