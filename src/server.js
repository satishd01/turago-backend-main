/**
 * Application entry point.
 * Connects to MongoDB and starts the HTTP server.
 * Handles graceful shutdown on SIGTERM/SIGINT.
 */

import 'dotenv/config';
import app from './app/app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import logger from './config/logger.js';
import env from './config/env.js';

let server;

async function startServer() {
  // Connect to MongoDB before accepting requests
  await connectDatabase();

  server = app.listen(env.PORT, () => {
    logger.info(
      {
        event: 'server_started',
        port: env.PORT,
        environment: env.NODE_ENV,
        docs: `http://localhost:${env.PORT}/api-docs`,
        health: `http://localhost:${env.PORT}/health`,
      },
      `🚀 Turago backend running on port ${env.PORT}`
    );
  });

  server.on('error', (err) => {
    logger.fatal({ event: 'server_error', error: err.message }, 'HTTP server error');
    process.exit(1);
  });
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────

async function gracefulShutdown(signal) {
  logger.info({ event: 'shutdown_initiated', signal }, `${signal} received — shutting down gracefully`);

  if (server) {
    server.close(async () => {
      logger.info({ event: 'http_server_closed' }, 'HTTP server closed');
      await disconnectDatabase();
      logger.info({ event: 'shutdown_complete' }, 'Graceful shutdown complete');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.warn({ event: 'shutdown_forced' }, 'Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    await disconnectDatabase();
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─── Unhandled errors ─────────────────────────────────────────────────────────

process.on('unhandledRejection', (reason, promise) => {
  logger.error(
    { event: 'unhandled_rejection', reason: String(reason), promise: String(promise) },
    'Unhandled promise rejection'
  );
  // Do not exit — let the request fail gracefully
});

process.on('uncaughtException', (err) => {
  logger.fatal(
    { event: 'uncaught_exception', error: err.message, stack: err.stack },
    'Uncaught exception — process will exit'
  );
  process.exit(1);
});

// ─── Start ────────────────────────────────────────────────────────────────────

startServer().catch((err) => {
  logger.fatal({ event: 'startup_failure', error: err.message }, 'Failed to start server');
  process.exit(1);
});
