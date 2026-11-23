/**
 * Centralized application error classes.
 * All custom errors extend AppError, enabling a single instanceof check
 * in the global error handler.
 */

/**
 * Base application error.
 * @extends Error
 */
export class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Machine-readable error code (e.g. 'RIDE_NOT_FOUND')
   * @param {boolean} [isOperational=true] - True = expected error; False = programmer error
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Capture stack trace (V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * 400 — Bad Request.
 */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request', code = 'BAD_REQUEST') {
    super(message, 400, code);
  }
}

/**
 * 400 — Invalid request input (validation failures).
 */
export class ValidationError extends AppError {
  /**
   * @param {string} message
   * @param {Array<{field: string, message: string}>} [details]
   */
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

/**
 * 401 — Missing or invalid authentication credentials.
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * 403 — Authenticated but not authorized for the resource.
 */
export class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * 404 — Resource not found.
 * @param {string} [resource] - e.g. 'Ride', 'User'
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.resource = resource;
  }
}

/**
 * 409 — Resource conflict (e.g. duplicate phone number).
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * 422 — Business rule violation (e.g. invalid ride state transition).
 */
export class BusinessRuleError extends AppError {
  constructor(message, code = 'BUSINESS_RULE_VIOLATION') {
    super(message, 422, code);
  }
}

/**
 * 429 — Too many requests.
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * 503 — Failure in an external service (SMS, maps, payment, etc.).
 */
export class ExternalServiceError extends AppError {
  /**
   * @param {string} serviceName - Name of the failing external service
   * @param {string} [detail]
   */
  constructor(serviceName, detail = '') {
    super(
      `External service error: ${serviceName}${detail ? ` — ${detail}` : ''}`,
      503,
      'EXTERNAL_SERVICE_ERROR'
    );
    this.serviceName = serviceName;
  }
}
