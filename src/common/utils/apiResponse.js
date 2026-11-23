/**
 * Standardized API response helpers.
 * All controllers must use these helpers to ensure consistent response shape.
 */

/**
 * Sends a successful API response.
 *
 * @param {import('express').Response} res
 * @param {object} options
 * @param {string} options.message - Success message
 * @param {*} [options.data] - Response payload
 * @param {object} [options.meta] - Pagination or extra metadata
 * @param {number} [options.statusCode=200] - HTTP status code
 */
export function sendSuccess(res, { message, data, meta, statusCode = 200 }) {
  const body = {
    success: true,
    message,
  };

  if (data !== undefined) {
    body.data = data;
  }

  if (meta !== undefined) {
    body.meta = meta;
  }

  return res.status(statusCode).json(body);
}

/**
 * Sends an error API response.
 *
 * @param {import('express').Response} res
 * @param {object} options
 * @param {string} options.message - Error message
 * @param {string} [options.code] - Machine-readable error code
 * @param {Array} [options.details] - Validation error details
 * @param {number} [options.statusCode=500] - HTTP status code
 */
export function sendError(res, { message, code = 'INTERNAL_ERROR', details, statusCode = 500 }) {
  const body = {
    success: false,
    message,
    code,
  };

  if (details && details.length > 0) {
    body.details = details;
  }

  return res.status(statusCode).json(body);
}
