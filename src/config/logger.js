/**
 * Structured logger using Pino.
 * Use this logger throughout the application — never use console.log directly.
 *
 * Security rules (enforced at call-site by convention):
 *  - NEVER log OTP values
 *  - NEVER log JWT secrets or tokens
 *  - NEVER log payment credentials
 *  - NEVER log raw passwords or hashes
 */

import pino from 'pino';
import env from './env.js';

const isDev = env.NODE_ENV !== 'production' && env.NODE_ENV !== 'test';

const logger = pino({
  level: env.logging.level,
  // Pretty-print in development; structured JSON in production
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  // Redact sensitive fields from logs
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.password',
      'body.otp',
      'body.token',
      'body.refreshToken',
      'body.cardNumber',
      'body.cvv',
    ],
    censor: '[REDACTED]',
  },
  base: {
    app: env.APP_NAME,
    env: env.NODE_ENV,
  },
});

export default logger;
