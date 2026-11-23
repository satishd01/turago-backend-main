/**
 * Ride state machine unit tests.
 * Tests the state transition rules without requiring a database.
 */

import {
  isTransitionAllowed,
  assertTransitionAllowed,
  getCancellableStatuses,
  getTransitionTimestampField,
} from '../src/modules/rides/utils/rideStateMachine.js';

import { RIDE_STATUS } from '../src/common/constants/index.js';
import { BusinessRuleError } from '../src/common/errors/AppError.js';

describe('Ride State Machine — isTransitionAllowed', () => {
  it('should allow REQUESTED → SEARCHING_DRIVER', () => {
    expect(isTransitionAllowed(RIDE_STATUS.REQUESTED, RIDE_STATUS.SEARCHING_DRIVER)).toBe(true);
  });

  it('should allow REQUESTED → CANCELLED', () => {
    expect(isTransitionAllowed(RIDE_STATUS.REQUESTED, RIDE_STATUS.CANCELLED)).toBe(true);
  });

  it('should allow RIDE_STARTED → RIDE_COMPLETED', () => {
    expect(isTransitionAllowed(RIDE_STATUS.RIDE_STARTED, RIDE_STATUS.RIDE_COMPLETED)).toBe(true);
  });

  it('should NOT allow RIDE_COMPLETED → any status', () => {
    Object.values(RIDE_STATUS).forEach((status) => {
      expect(isTransitionAllowed(RIDE_STATUS.RIDE_COMPLETED, status)).toBe(false);
    });
  });

  it('should NOT allow CANCELLED → any status', () => {
    Object.values(RIDE_STATUS).forEach((status) => {
      expect(isTransitionAllowed(RIDE_STATUS.CANCELLED, status)).toBe(false);
    });
  });

  it('should NOT allow RIDE_STARTED → CANCELLED', () => {
    expect(isTransitionAllowed(RIDE_STATUS.RIDE_STARTED, RIDE_STATUS.CANCELLED)).toBe(false);
  });

  it('should NOT allow skipping states (REQUESTED → RIDE_COMPLETED)', () => {
    expect(isTransitionAllowed(RIDE_STATUS.REQUESTED, RIDE_STATUS.RIDE_COMPLETED)).toBe(false);
  });
});

describe('Ride State Machine — assertTransitionAllowed', () => {
  it('should not throw for valid transitions', () => {
    expect(() =>
      assertTransitionAllowed(RIDE_STATUS.REQUESTED, RIDE_STATUS.SEARCHING_DRIVER)
    ).not.toThrow();
  });

  it('should throw BusinessRuleError for invalid transitions', () => {
    expect(() =>
      assertTransitionAllowed(RIDE_STATUS.RIDE_COMPLETED, RIDE_STATUS.REQUESTED)
    ).toThrow(BusinessRuleError);
  });

  it('should include current and target status in error message', () => {
    try {
      assertTransitionAllowed(RIDE_STATUS.RIDE_COMPLETED, RIDE_STATUS.REQUESTED);
    } catch (err) {
      expect(err.message).toContain(RIDE_STATUS.RIDE_COMPLETED);
      expect(err.message).toContain(RIDE_STATUS.REQUESTED);
      expect(err.code).toBe('INVALID_RIDE_STATE_TRANSITION');
    }
  });
});

describe('Ride State Machine — getCancellableStatuses', () => {
  it('should include REQUESTED as cancellable', () => {
    expect(getCancellableStatuses()).toContain(RIDE_STATUS.REQUESTED);
  });

  it('should include DRIVER_ASSIGNED as cancellable', () => {
    expect(getCancellableStatuses()).toContain(RIDE_STATUS.DRIVER_ASSIGNED);
  });

  it('should NOT include RIDE_COMPLETED as cancellable', () => {
    expect(getCancellableStatuses()).not.toContain(RIDE_STATUS.RIDE_COMPLETED);
  });

  it('should NOT include RIDE_STARTED as cancellable', () => {
    expect(getCancellableStatuses()).not.toContain(RIDE_STATUS.RIDE_STARTED);
  });
});

describe('Ride State Machine — getTransitionTimestampField', () => {
  it('should return assignedAt for DRIVER_ASSIGNED', () => {
    expect(getTransitionTimestampField(RIDE_STATUS.DRIVER_ASSIGNED)).toBe('assignedAt');
  });

  it('should return completedAt for RIDE_COMPLETED', () => {
    expect(getTransitionTimestampField(RIDE_STATUS.RIDE_COMPLETED)).toBe('completedAt');
  });

  it('should return cancelledAt for CANCELLED', () => {
    expect(getTransitionTimestampField(RIDE_STATUS.CANCELLED)).toBe('cancelledAt');
  });
});
