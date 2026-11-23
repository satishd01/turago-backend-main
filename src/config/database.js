/**
 * MongoDB connection management using Mongoose.
 * Handles connection, reconnection, and graceful disconnect.
 */

import mongoose from 'mongoose';
import env from './env.js';
import logger from './logger.js';

// ─── Connection options ───────────────────────────────────────────────────────

const MONGOOSE_OPTIONS = {
  // Use the new URL parser and unified topology
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 2,
};

// ─── Connection lifecycle ─────────────────────────────────────────────────────

mongoose.connection.on('connected', () => {
  logger.info({ event: 'mongodb_connected', uri: sanitizeUri(env.mongodb.uri) }, 'MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  logger.error({ event: 'mongodb_error', error: err.message }, 'MongoDB connection error');
});

mongoose.connection.on('disconnected', () => {
  logger.warn({ event: 'mongodb_disconnected' }, 'MongoDB disconnected');
});

/**
 * Strips credentials from a MongoDB URI for safe logging.
 * @param {string} uri
 * @returns {string}
 */
function sanitizeUri(uri) {
  try {
    const url = new URL(uri);
    url.password = url.password ? '***' : '';
    url.username = url.username ? '***' : '';
    return url.toString();
  } catch {
    return '[invalid-uri]';
  }
}

/**
 * Connects to MongoDB.
 * Exits the process if connection fails (fail-fast on startup).
 * @returns {Promise<void>}
 */
export async function connectDatabase() {
  try {
    await mongoose.connect(env.mongodb.uri, MONGOOSE_OPTIONS);
  } catch (err) {
    logger.fatal({ event: 'mongodb_startup_failure', error: err.message }, 'Failed to connect to MongoDB');
    process.exit(1);
  }
}

/**
 * Gracefully disconnects from MongoDB.
 * Call this during application shutdown.
 * @returns {Promise<void>}
 */
export async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    logger.info({ event: 'mongodb_disconnected_gracefully' }, 'MongoDB disconnected gracefully');
  } catch (err) {
    logger.error({ event: 'mongodb_disconnect_error', error: err.message }, 'Error disconnecting from MongoDB');
  }
}

/**
 * Returns the current Mongoose connection state.
 * @returns {'connected' | 'disconnected' | 'connecting' | 'disconnecting'}
 */
export function getConnectionState() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] ?? 'unknown';
}

export default mongoose;
