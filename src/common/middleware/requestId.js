/**
 * Request ID middleware.
 * Attaches a unique request ID to each incoming request for tracing.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Adds a unique req.id to every request.
 * Uses X-Request-ID header if provided, otherwise generates a UUID v4.
 *
 * @type {import('express').RequestHandler}
 */
export function requestId(req, res, next) {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
}
