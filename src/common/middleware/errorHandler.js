/**
 * Global error-handling middleware.
 * Must be registered LAST in the Express middleware chain.
 *
 * Converts any thrown error (AppError subclasses or unexpected errors)
 * into a consistent JSON response.
 */

import { AppError, ValidationError } from '../errors/AppError.js';
import { sendError } from '../utils/apiResponse.js';
import logger from '../../config/logger.js';
import env from '../../config/env.js';

/**
 * Handles Mongoose validation errors.
 * @param {import('mongoose').Error.ValidationError} err
 * @returns {AppError}
 */
function handleMongooseValidationError(err) {
  const details = Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));
  return new ValidationError('Validation failed', details);
}

/**
 * Handles invalid Mongoose ObjectId cast errors.
 * @param {import('mongoose').Error.CastError} err
 * @returns {AppError}
 */
function handleMongoCastError(err) {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400, 'INVALID_ID');
}

/**
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
export function globalErrorHandler(err, req, res, _next) {
  let error = err;

  // ── Mongoose-specific error normalization ──────────────────────────────────
  if (err.name === 'ValidationError' && err.errors) {
    error = handleMongooseValidationError(err);
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] ?? 'field';
    error = new AppError(`Duplicate value for ${field}`, 409, 'CONFLICT');
  } else if (err.name === 'CastError') {
    error = handleMongoCastError(err);
  } else if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401, 'INVALID_TOKEN');
  } else if (err.name === 'TokenExpiredError') {
    error = new AppError('Token has expired', 401, 'TOKEN_EXPIRED');
  }

  // ── Determine operational vs unexpected ────────────────────────────────────
  const isOperational = error instanceof AppError && error.isOperational;
  const statusCode = error.statusCode ?? 500;

  // ── Logging ────────────────────────────────────────────────────────────────
  if (statusCode >= 500) {
    logger.error(
      {
        event: 'unhandled_error',
        statusCode,
        code: error.code,
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        stack: env.isProduction ? undefined : error.stack,
      },
      error.message
    );
  } else {
    logger.warn(
      {
        event: 'operational_error',
        statusCode,
        code: error.code,
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
      },
      error.message
    );
  }

  // ── Response ───────────────────────────────────────────────────────────────
  const message = isOperational
    ? error.message
    : env.isProduction
      ? 'Something went wrong. Please try again later.'
      : error.message;

  return sendError(res, {
    message,
    code: error.code ?? 'INTERNAL_ERROR',
    details: error.details,
    statusCode,
  });
}

/**
 * 404 handler — must be registered before globalErrorHandler.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function notFoundHandler(req, res, next) {
  const error = new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND');
  next(error);
}
