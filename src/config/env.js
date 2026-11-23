/**
 * Environment configuration loader.
 * Validates that all required environment variables are present at startup.
 * Use this module throughout the app instead of accessing process.env directly.
 */

import 'dotenv/config';

/**
 * Asserts that a required environment variable exists.
 * @param {string} key
 * @param {string} [fallback]
 * @returns {string}
 */
function required(key, fallback) {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    if (process.env.NODE_ENV === 'test') {
      return fallback ?? '';
    }
    throw new Error(`[Config] Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * @param {string} key
 * @param {string} fallback
 * @returns {string}
 */
function optional(key, fallback) {
  return process.env[key] ?? fallback;
}

/**
 * @param {string} key
 * @param {number} fallback
 * @returns {number}
 */
function optionalInt(key, fallback) {
  const val = process.env[key];
  return val !== undefined ? parseInt(val, 10) : fallback;
}

// ─── Exported config object ──────────────────────────────────────────────────

const env = {
  /** Current runtime environment */
  NODE_ENV: optional('NODE_ENV', 'development'),

  /** HTTP port */
  PORT: optionalInt('PORT', 3000),

  /** Application name */
  APP_NAME: optional('APP_NAME', 'turago-backend'),

  /** Is this a production environment? */
  isProduction: optional('NODE_ENV', 'development') === 'production',

  /** Is this a test environment? */
  isTest: optional('NODE_ENV', 'development') === 'test',

  /** Is this a development environment? */
  isDevelopment: optional('NODE_ENV', 'development') === 'development',

  // ── MongoDB ─────────────────────────────────────────────────────────────
  mongodb: {
    uri: required('MONGODB_URI', 'mongodb://localhost:27017/turago'),
  },

  // ── JWT ─────────────────────────────────────────────────────────────────
  jwt: {
    secret: required('JWT_SECRET', 'dev_jwt_secret_change_in_production_xxxxx'),
    expiresIn: optional('JWT_EXPIRES_IN', '15m'),
    refreshSecret: required(
      'JWT_REFRESH_SECRET',
      'dev_refresh_secret_change_in_production_xxxxx'
    ),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  // ── OTP ─────────────────────────────────────────────────────────────────
  otp: {
    expirySeconds: optionalInt('OTP_EXPIRY_SECONDS', 300),
    maxAttempts: optionalInt('OTP_MAX_ATTEMPTS', 5),
    rateLimitMax: optionalInt('OTP_RATE_LIMIT_MAX', 3),
    rateLimitWindowMinutes: optionalInt('OTP_RATE_LIMIT_WINDOW_MINUTES', 10),
  },

  // ── Providers ────────────────────────────────────────────────────────────
  providers: {
    sms: optional('SMS_PROVIDER', 'mock'),
    payment: optional('PAYMENT_PROVIDER', 'mock'),
    maps: optional('MAP_PROVIDER', 'mock'),
    storage: optional('STORAGE_PROVIDER', 'local'),
    pushNotification: optional('PUSH_NOTIFICATION_PROVIDER', 'mock'),
  },

  // ── External provider credentials ────────────────────────────────────────
  twilio: {
    accountSid: optional('TWILIO_ACCOUNT_SID', ''),
    authToken: optional('TWILIO_AUTH_TOKEN', ''),
    fromNumber: optional('TWILIO_FROM_NUMBER', ''),
  },

  google: {
    mapsApiKey: optional('GOOGLE_MAPS_API_KEY', ''),
  },

  osrm: {
    baseUrl: optional('OSRM_BASE_URL', 'http://router.project-osrm.org'),
  },

  storage: {
    localPath: optional('STORAGE_LOCAL_PATH', './uploads'),
    s3Bucket: optional('AWS_S3_BUCKET', ''),
    s3Region: optional('AWS_REGION', ''),
    awsAccessKeyId: optional('AWS_ACCESS_KEY_ID', ''),
    awsSecretAccessKey: optional('AWS_SECRET_ACCESS_KEY', ''),
  },

  fcm: {
    projectId: optional('FCM_PROJECT_ID', ''),
    privateKey: optional('FCM_PRIVATE_KEY', ''),
    clientEmail: optional('FCM_CLIENT_EMAIL', ''),
  },

  // ── Driver Matching ──────────────────────────────────────────────────────
  driverMatching: {
    searchRadiusMeters: optionalInt('DRIVER_SEARCH_RADIUS_METERS', 5000),
    maxCandidates: optionalInt('DRIVER_MAX_CANDIDATES', 10),
    acceptTimeoutSeconds: optionalInt('DRIVER_ACCEPT_TIMEOUT_SECONDS', 30),
  },

  // ── Rate Limiting ────────────────────────────────────────────────────────
  rateLimit: {
    windowMinutes: optionalInt('RATE_LIMIT_WINDOW_MINUTES', 15),
    maxRequests: optionalInt('RATE_LIMIT_MAX_REQUESTS', 100),
  },

  // ── CORS ─────────────────────────────────────────────────────────────────
  cors: {
    origins: optional('CORS_ORIGINS', 'http://localhost:3000').split(',').map((o) => o.trim()),
  },

  // ── Logging ──────────────────────────────────────────────────────────────
  logging: {
    level: optional('LOG_LEVEL', 'info'),
  },
};

export default env;
