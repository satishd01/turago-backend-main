/**
 * Express application factory.
 * Sets up middleware, mounts routes, and attaches error handlers.
 * Separated from server.js so tests can import the app without starting the server.
 */

import path from 'path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import env from '../config/env.js';
import logger from '../config/logger.js';
import { getConnectionState } from '../config/database.js';
import swaggerSpec from '../docs/swagger.js';

import { requestId } from '../common/middleware/requestId.js';
import { globalErrorHandler, notFoundHandler } from '../common/middleware/errorHandler.js';
import { sendSuccess } from '../common/utils/apiResponse.js';

// Module routes
import authRoutes from '../modules/auth/routes/auth.routes.js';
import userRoutes from '../modules/users/routes/user.routes.js';
import driverRoutes from '../modules/drivers/routes/driver.routes.js';
import rideRoutes from '../modules/rides/routes/ride.routes.js';
import adminRoutes from '../modules/admin/routes/admin.routes.js';
import adminWebRoutes from '../modules/admin/routes/admin.web.routes.js';
import locationRoutes from '../modules/locations/routes/location.routes.js';

const app = express();

// ─── View Engine (EJS for Admin Dashboard) ────────────────────────────────────

app.set('view engine', 'ejs');
app.set('views', path.resolve(process.cwd(), 'src/views'));

// ─── Security headers ─────────────────────────────────────────────────────────

// Disable CSP so Tailwind CDN and Google Fonts render cleanly on Admin SSR pages
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin, 'null' (file://, sandboxed redirects, webviews), or any web client
      return callback(null, true);
    },
    credentials: true,
  })
);

// ─── Request ID ───────────────────────────────────────────────────────────────

app.use(requestId);

// ─── Structured HTTP logging ──────────────────────────────────────────────────

if (!env.isTest) {
  app.use(
    pinoHttp({
      logger,
      customProps: (req) => ({ requestId: req.id }),
      // Don't log health checks
      autoLogging: {
        ignore: (req) => req.url === '/health',
      },
    })
  );
}

// ─── Body parsing ─────────────────────────────────────────────────────────────

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Global rate limiting ─────────────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMinutes * 60 * 1000,
  max: env.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  skip: () => env.isTest, // Disable rate limiting in tests
});

app.use(globalLimiter);

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  const dbState = getConnectionState();
  const isHealthy = dbState === 'connected';

  return sendSuccess(res, {
    statusCode: isHealthy ? 200 : 503,
    message: isHealthy ? 'Service is healthy' : 'Service is degraded',
    data: {
      status: isHealthy ? 'ok' : 'degraded',
      database: dbState,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
});

// ─── API Documentation ────────────────────────────────────────────────────────

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Turago API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// ─── Static files (Uploads) ───────────────────────────────────────────────────
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// ─── Web Admin Dashboard (EJS) ────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.redirect('/admin');
});
app.use('/admin', adminWebRoutes);

// ─── API v1 routes ────────────────────────────────────────────────────────────

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/drivers', driverRoutes);
app.use('/api/v1/rides', rideRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/locations', locationRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────

app.use(notFoundHandler);

// ─── Global error handler (must be last) ──────────────────────────────────────

app.use(globalErrorHandler);

export default app;
