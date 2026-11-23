/**
 * Authentication and authorization middleware.
 *
 * authenticate  — verifies JWT access token and attaches req.user
 * authorize     — enforces role-based access control
 */

import jwt from 'jsonwebtoken';
import env from '../../config/env.js';
import { AuthenticationError, AuthorizationError } from '../errors/AppError.js';
import { ROLES } from '../constants/index.js';

/**
 * Verifies the JWT Bearer token from the Authorization header.
 * On success, attaches the decoded payload to req.user.
 *
 * @type {import('express').RequestHandler}
 */
export async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authorization token is required');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AuthenticationError('Authorization token is required');
    }

    const decoded = jwt.verify(token, env.jwt.secret);

    // Attach user context to the request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      phone: decoded.phone,
    };

    next();
  } catch (err) {
    next(err instanceof AuthenticationError ? err : new AuthenticationError(err.message));
  }
}

/**
 * Role-based access control middleware factory.
 * Must be used AFTER authenticate.
 *
 * @param {...string} allowedRoles - One or more roles from ROLES constant
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.get('/admin-only', authenticate, authorize(ROLES.ADMIN), handler);
 * router.get('/drivers', authenticate, authorize(ROLES.DRIVER, ROLES.ADMIN), handler);
 */
export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    const validRoles = Object.values(ROLES);
    const invalid = allowedRoles.filter((r) => !validRoles.includes(r));
    if (invalid.length > 0) {
      // Programmer error — log and fail securely
      return next(new Error(`authorize() called with unknown roles: ${invalid.join(', ')}`));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AuthorizationError(
          `Role '${req.user.role}' is not permitted to access this resource`
        )
      );
    }

    return next();
  };
}
