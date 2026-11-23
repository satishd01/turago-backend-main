/**
 * Shared application constants.
 * Business-specific constants are kept in their own module's constants folder.
 */

// ─── User/Auth roles ──────────────────────────────────────────────────────────

/** @enum {string} */
export const ROLES = Object.freeze({
  CUSTOMER: 'CUSTOMER',
  DRIVER: 'DRIVER',
  ADMIN: 'ADMIN',
});

// ─── Driver approval states ───────────────────────────────────────────────────

/** @enum {string} */
export const DRIVER_APPROVAL_STATUS = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
});

// ─── Driver availability states ───────────────────────────────────────────────

/** @enum {string} */
export const DRIVER_AVAILABILITY = Object.freeze({
  OFFLINE: 'OFFLINE',
  ONLINE: 'ONLINE',
  BUSY: 'BUSY',
});

// ─── Vehicle types ────────────────────────────────────────────────────────────

/** @enum {string} */
export const VEHICLE_TYPE = Object.freeze({
  BIKE: 'BIKE',
  AUTO: 'AUTO',
  CAR: 'CAR',
  CAB: 'CAB',
});

// ─── Vehicle status ───────────────────────────────────────────────────────────

/** @enum {string} */
export const VEHICLE_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  UNDER_REVIEW: 'UNDER_REVIEW',
});

// ─── Ride states ──────────────────────────────────────────────────────────────

/** @enum {string} */
export const RIDE_STATUS = Object.freeze({
  REQUESTED: 'REQUESTED',
  SEARCHING_DRIVER: 'SEARCHING_DRIVER',
  DRIVER_ASSIGNED: 'DRIVER_ASSIGNED',
  DRIVER_ARRIVING: 'DRIVER_ARRIVING',
  DRIVER_ARRIVED: 'DRIVER_ARRIVED',
  RIDE_STARTED: 'RIDE_STARTED',
  RIDE_COMPLETED: 'RIDE_COMPLETED',
  CANCELLED: 'CANCELLED',
});

// ─── Allowed ride state transitions ──────────────────────────────────────────

/**
 * Maps each ride status to the set of statuses it can legally transition into.
 * The state machine is the single source of truth.
 *
 * @type {Record<string, string[]>}
 */
export const RIDE_STATUS_TRANSITIONS = Object.freeze({
  [RIDE_STATUS.REQUESTED]: [RIDE_STATUS.SEARCHING_DRIVER, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.SEARCHING_DRIVER]: [RIDE_STATUS.DRIVER_ASSIGNED, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.DRIVER_ASSIGNED]: [RIDE_STATUS.DRIVER_ARRIVING, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.DRIVER_ARRIVING]: [RIDE_STATUS.DRIVER_ARRIVED, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.DRIVER_ARRIVED]: [RIDE_STATUS.RIDE_STARTED, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.RIDE_STARTED]: [RIDE_STATUS.RIDE_COMPLETED],
  [RIDE_STATUS.RIDE_COMPLETED]: [],
  [RIDE_STATUS.CANCELLED]: [],
});

// ─── Payment states ───────────────────────────────────────────────────────────

/** @enum {string} */
export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  AUTHORIZED: 'AUTHORIZED',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
});

// ─── Driver document types ────────────────────────────────────────────────────

/** @enum {string} */
export const DOCUMENT_TYPE = Object.freeze({
  IDENTITY_PROOF: 'IDENTITY_PROOF',
  DRIVING_LICENSE: 'DRIVING_LICENSE',
  VEHICLE_RC: 'VEHICLE_RC',
  INSURANCE: 'INSURANCE',
  PROFILE_PHOTO: 'PROFILE_PHOTO',
});

// ─── Driver onboarding step ───────────────────────────────────────────────────

/** @enum {number} */
export const DRIVER_ONBOARDING_STEP = Object.freeze({
  WELCOME: 1,
  ACCOUNT: 2,
  VERIFY: 3,
  VEHICLE: 4,
  DOCUMENTS: 5,
  COMPLETED: 6,
});

// ─── Driver document review status ───────────────────────────────────────────

/** @enum {string} */
export const DOCUMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

// ─── Notification channels ────────────────────────────────────────────────────

/** @enum {string} */
export const NOTIFICATION_CHANNEL = Object.freeze({
  PUSH: 'PUSH',
  SMS: 'SMS',
  EMAIL: 'EMAIL',
});

// ─── GeoJSON ──────────────────────────────────────────────────────────────────

export const GEO_JSON_TYPE = Object.freeze({
  POINT: 'Point',
});
