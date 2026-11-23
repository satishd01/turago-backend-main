/**
 * Request validation middleware factory using Joi.
 *
 * Usage:
 *   router.post('/path', validate({ body: schema }), handler);
 *
 * Validates body, query, and/or params.
 * On failure, passes a ValidationError to next() for the global error handler.
 */

import { ValidationError } from '../errors/AppError.js';

/**
 * @typedef {Object} ValidationSchemas
 * @property {import('joi').Schema} [body]
 * @property {import('joi').Schema} [query]
 * @property {import('joi').Schema} [params]
 */

/**
 * Creates an Express middleware that validates the request against Joi schemas.
 *
 * @param {ValidationSchemas} schemas
 * @returns {import('express').RequestHandler}
 */
export function validate(schemas) {
  return (req, _res, next) => {
    const errors = [];

    for (const [part, schema] of Object.entries(schemas)) {
      if (!schema) {
        continue;
      }

      const { error, value } = schema.validate(req[part], {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        const fieldErrors = error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message.replace(/"/g, ''),
        }));
        errors.push(...fieldErrors);
      } else {
        // Replace with sanitized / coerced values
        req[part] = value;
      }
    }

    if (errors.length > 0) {
      return next(new ValidationError('Request validation failed', errors));
    }

    return next();
  };
}
