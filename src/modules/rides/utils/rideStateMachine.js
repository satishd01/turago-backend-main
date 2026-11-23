/**
 * Ride state machine.
 *
 * The single source of truth for allowed state transitions.
 * All transition validation goes through this module.
 *
 * This is intentionally decoupled from the Ride model and service
 * so the state machine can be unit-tested independently.
 */

import { RIDE_STATUS, RIDE_STATUS_TRANSITIONS } from '../../../common/constants/index.js';
import { BusinessRuleError } from '../../../common/errors/AppError.js';

/**
 * Checks whether a state transition is allowed.
 *
 * @param {string} currentStatus - Current ride status
 * @param {string} targetStatus - Desired next status
 * @returns {boolean}
 */
export function isTransitionAllowed(currentStatus, targetStatus) {
  const allowed = RIDE_STATUS_TRANSITIONS[currentStatus];
  return Array.isArray(allowed) && allowed.includes(targetStatus);
}

/**
 * Asserts that a transition is allowed, throwing a BusinessRuleError if not.
 *
 * @param {string} currentStatus
 * @param {string} targetStatus
 * @throws {BusinessRuleError}
 */
export function assertTransitionAllowed(currentStatus, targetStatus) {
  if (!isTransitionAllowed(currentStatus, targetStatus)) {
    throw new BusinessRuleError(
      `Ride cannot transition from '${currentStatus}' to '${targetStatus}'`,
      'INVALID_RIDE_STATE_TRANSITION'
    );
  }
}

/**
 * Returns the timestamp field name for a given ride status.
 * Used to stamp the exact time of each transition.
 *
 * @param {string} status
 * @returns {string | null}
 */
export function getTransitionTimestampField(status) {
  const map = {
    [RIDE_STATUS.REQUESTED]: 'requestedAt',
    [RIDE_STATUS.SEARCHING_DRIVER]: 'searchingDriverAt',
    [RIDE_STATUS.DRIVER_ASSIGNED]: 'assignedAt',
    [RIDE_STATUS.DRIVER_ARRIVING]: 'driverArrivingAt',
    [RIDE_STATUS.DRIVER_ARRIVED]: 'driverArrivedAt',
    [RIDE_STATUS.RIDE_STARTED]: 'startedAt',
    [RIDE_STATUS.RIDE_COMPLETED]: 'completedAt',
    [RIDE_STATUS.CANCELLED]: 'cancelledAt',
  };
  return map[status] ?? null;
}

/**
 * Returns the set of statuses from which a ride can be cancelled.
 * @returns {string[]}
 */
export function getCancellableStatuses() {
  return Object.entries(RIDE_STATUS_TRANSITIONS)
    .filter(([, targets]) => targets.includes(RIDE_STATUS.CANCELLED))
    .map(([status]) => status);
}
