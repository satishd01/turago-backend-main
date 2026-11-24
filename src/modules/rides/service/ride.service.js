/**
 * Ride Service — core business logic for the ride lifecycle.
 *
 * Responsibilities:
 *   - Ride creation with fare estimation
 *   - State machine transitions (accept, start, complete, cancel)
 *   - Driver matching coordination
 *   - Event publishing
 *   - Driver availability updates after transitions
 *
 * This service does NOT:
 *   - Compute fares directly (delegates to FareCalculationService)
 *   - Dispatch notifications directly (delegates to NotificationService)
 *   - Know about Socket.IO / Redis
 *   - Allow arbitrary status patching
 */

import mongoose from 'mongoose';

import rideRepository from '../repository/ride.repository.js';
import { assertTransitionAllowed, getTransitionTimestampField } from '../utils/rideStateMachine.js';
import rideEventPublisher, { RIDE_EVENTS } from '../utils/rideEventPublisher.js';
import driverMatchingService from './driverMatching.service.js';
import fareCalculationService from '../../fares/service/fareCalculation.service.js';
import driverRepository from '../../drivers/repository/driver.repository.js';
import {
  NotFoundError,
  BusinessRuleError,
  AuthorizationError,
} from '../../../common/errors/AppError.js';
import {
  RIDE_STATUS,
  DRIVER_AVAILABILITY,
} from '../../../common/constants/index.js';
import { getMapsProvider } from '../../../infrastructure/maps/index.js';
import logger from '../../../config/logger.js';

/**
 * Helper to safely extract string ID whether the reference is populated or not.
 * @param {any} entity
 * @returns {string | null}
 */
function getEntityId(entity) {
  if (!entity) return null;
  return (entity._id ? entity._id : entity).toString();
}

const rideService = {
  /**
   * Creates a new ride request.
   * - Validates no active ride exists for customer
   * - Calculates route estimate via maps provider
   * - Estimates fare via FareCalculationService
   * - Stores ride in REQUESTED state
   * - Initiates driver search
   *
   * @param {object} params
   * @param {string} params.customerId
   * @param {object} params.pickup - { address, latitude, longitude }
   * @param {object} params.destination - { address, latitude, longitude }
   * @param {string} params.vehicleType
   * @returns {Promise<import('mongoose').Document>}
   */
  async createRide({ customerId, pickup, destination, vehicleType }) {
    // ── Guard: one active ride per customer ──────────────────────────────────
    const existingRide = await rideRepository.findActiveByCustomer(customerId);
    if (existingRide) {
      throw new BusinessRuleError(
        'You already have an active ride. Please complete or cancel it first.',
        'ACTIVE_RIDE_EXISTS'
      );
    }

    // ── Route estimation ─────────────────────────────────────────────────────
    const mapsProvider = getMapsProvider();
    const routeEstimate = await mapsProvider.calculateRoute(
      { lat: pickup.latitude, lng: pickup.longitude },
      { lat: destination.latitude, lng: destination.longitude }
    );

    // ── Fare estimation ──────────────────────────────────────────────────────
    const fareEstimate = await fareCalculationService.estimateFare({
      vehicleType,
      distanceMeters: routeEstimate.distanceMeters,
      durationSeconds: routeEstimate.durationSeconds,
    });

    // ── Create ride ──────────────────────────────────────────────────────────
    const ride = await rideRepository.create({
      customerId,
      vehicleType,
      pickup: {
        address: pickup.address,
        location: {
          type: 'Point',
          coordinates: [pickup.longitude, pickup.latitude],
        },
      },
      destination: {
        address: destination.address,
        location: {
          type: 'Point',
          coordinates: [destination.longitude, destination.latitude],
        },
      },
      estimatedDistanceMeters: routeEstimate.distanceMeters,
      estimatedDurationSeconds: routeEstimate.durationSeconds,
      estimatedFare: fareEstimate.estimatedFare,
      fareCurrency: fareEstimate.currency,
      status: RIDE_STATUS.REQUESTED,
    });

    logger.info({ event: 'ride_created', rideId: ride._id, customerId }, 'Ride created');

    await rideEventPublisher.publish({
      type: RIDE_EVENTS.RIDE_CREATED,
      rideId: ride._id.toString(),
      payload: { customerId, vehicleType },
    });

    // ── Initiate driver search (async, non-blocking) ──────────────────────────
    this._searchAndAssignDriver(ride._id.toString(), {
      longitude: pickup.longitude,
      latitude: pickup.latitude,
      vehicleType,
    }).catch((err) => {
      logger.error(
        { event: 'driver_search_error', rideId: ride._id, error: err.message },
        'Driver search failed'
      );
    });

    return ride;
  },

  /**
   * Internal: searches for a driver and assigns them to the ride.
   * Called async after ride creation.
   *
   * @param {string} rideId
   * @param {object} pickupCoords
   * @returns {Promise<void>}
   */
  async _searchAndAssignDriver(rideId, { longitude, latitude, vehicleType }) {
    // Transition to SEARCHING_DRIVER
    await rideRepository.updateById(rideId, {
      status: RIDE_STATUS.SEARCHING_DRIVER,
      searchingDriverAt: new Date(),
    });

    await rideEventPublisher.publish({
      type: RIDE_EVENTS.DRIVER_SEARCHING,
      rideId,
      payload: {},
    });

    const driver = await driverMatchingService.assignDriver({ longitude, latitude, vehicleType });

    if (!driver) {
      logger.warn({ event: 'no_driver_found', rideId }, 'No driver found for ride');
      // TODO: Implement retry logic / cancellation after timeout (business to confirm)
      return;
    }

    // Use a session for atomic driver assignment + availability update
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await rideRepository.updateById(
          rideId,
          {
            status: RIDE_STATUS.DRIVER_ASSIGNED,
            driverId: driver._id,
            vehicleId: driver.vehicleId,
            assignedAt: new Date(),
          },
          session
        );

        await driverRepository.setAvailability(driver._id, DRIVER_AVAILABILITY.BUSY);
      });

      logger.info(
        { event: 'driver_assigned', rideId, driverId: driver._id },
        'Driver assigned to ride'
      );

      await rideEventPublisher.publish({
        type: RIDE_EVENTS.DRIVER_ASSIGNED,
        rideId,
        payload: { driverId: driver._id },
      });
    } finally {
      await session.endSession();
    }
  },

  /**
   * Returns a ride by ID.
   * @param {string} rideId
   * @returns {Promise<import('mongoose').Document>}
   */
  async getRideById(rideId) {
    const ride = await rideRepository.findById(rideId);
    if (!ride) {
      throw new NotFoundError('Ride');
    }
    return ride;
  },

  /**
   * Returns current active ride for either Customer or Driver.
   * @param {string} userId
   * @param {string} role
   * @returns {Promise<import('mongoose').Document | null>}
   */
  async getActiveRide(userId, role) {
    if (role === 'DRIVER') {
      return rideRepository.findActiveByDriver(userId);
    }
    return rideRepository.findActiveByCustomer(userId);
  },

  /**
   * Returns paginated ride history for either Customer or Driver.
   * @param {string} userId
   * @param {string} role
   * @param {object} [options]
   * @param {number} [options.page]
   * @param {number} [options.limit]
   * @param {string} [options.status]
   * @returns {Promise<object>}
   */
  async getRideHistory(userId, role, { page = 1, limit = 20, status } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    let rides;
    let total;

    if (role === 'DRIVER') {
      [rides, total] = await Promise.all([
        rideRepository.findByDriver(userId, { limit: limitNum, skip, status }),
        rideRepository.countByDriver(userId, { status }),
      ]);
    } else {
      [rides, total] = await Promise.all([
        rideRepository.findByCustomer(userId, { limit: limitNum, skip, status }),
        rideRepository.countByCustomer(userId, { status }),
      ]);
    }

    return {
      rides,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  },

  /**
   * Returns the live state of a ride (for customer polling).
   * Includes driver's current location if assigned.
   * @param {string} rideId
   * @param {string} customerId
   * @returns {Promise<object>}
   */
  async getLiveRide(rideId, customerId) {
    const ride = await rideRepository.findById(rideId);
    if (!ride) {
      throw new NotFoundError('Ride');
    }

    if (ride.customerId._id.toString() !== customerId) {
      throw new AuthorizationError('You do not have access to this ride');
    }

    return ride;
  },

  /**
   * Driver accepts the ride → transitions to DRIVER_ARRIVING.
   * @param {string} rideId
   * @param {string} driverId
   * @returns {Promise<import('mongoose').Document>}
   */
  async acceptRide(rideId, driverId) {
    const ride = await rideRepository.findById(rideId);
    if (!ride) {
      throw new NotFoundError('Ride');
    }

    if (getEntityId(ride.driverId) !== driverId) {
      throw new AuthorizationError('This ride is not assigned to you');
    }

    assertTransitionAllowed(ride.status, RIDE_STATUS.DRIVER_ARRIVING);

    const timestampField = getTransitionTimestampField(RIDE_STATUS.DRIVER_ARRIVING);
    const updated = await rideRepository.updateById(rideId, {
      status: RIDE_STATUS.DRIVER_ARRIVING,
      [timestampField]: new Date(),
    });

    await rideEventPublisher.publish({ type: RIDE_EVENTS.DRIVER_ARRIVING, rideId });

    return updated;
  },

  /**
   * Driver marks as arrived → transitions to DRIVER_ARRIVED.
   * @param {string} rideId
   * @param {string} driverId
   * @returns {Promise<import('mongoose').Document>}
   */
  async driverArrived(rideId, driverId) {
    const ride = await rideRepository.findById(rideId);
    if (!ride) {
      throw new NotFoundError('Ride');
    }

    if (getEntityId(ride.driverId) !== driverId) {
      throw new AuthorizationError('This ride is not assigned to you');
    }

    assertTransitionAllowed(ride.status, RIDE_STATUS.DRIVER_ARRIVED);

    const timestampField = getTransitionTimestampField(RIDE_STATUS.DRIVER_ARRIVED);
    return rideRepository.updateById(rideId, {
      status: RIDE_STATUS.DRIVER_ARRIVED,
      [timestampField]: new Date(),
    });
  },

  /**
   * Driver starts the ride → transitions to RIDE_STARTED.
   * @param {string} rideId
   * @param {string} driverId
   * @returns {Promise<import('mongoose').Document>}
   */
  async startRide(rideId, driverId) {
    const ride = await rideRepository.findById(rideId);
    if (!ride) {
      throw new NotFoundError('Ride');
    }

    if (getEntityId(ride.driverId) !== driverId) {
      throw new AuthorizationError('This ride is not assigned to you');
    }

    assertTransitionAllowed(ride.status, RIDE_STATUS.RIDE_STARTED);

    const timestampField = getTransitionTimestampField(RIDE_STATUS.RIDE_STARTED);
    const updated = await rideRepository.updateById(rideId, {
      status: RIDE_STATUS.RIDE_STARTED,
      [timestampField]: new Date(),
    });

    await rideEventPublisher.publish({ type: RIDE_EVENTS.RIDE_STARTED, rideId });

    return updated;
  },

  /**
   * Driver completes the ride → transitions to RIDE_COMPLETED.
   * Calculates final fare. Sets driver back to ONLINE.
   *
   * @param {string} rideId
   * @param {string} driverId
   * @param {object} [completionData]
   * @param {number} [completionData.finalDistanceMeters]
   * @param {number} [completionData.finalDurationSeconds]
   * @returns {Promise<import('mongoose').Document>}
   */
  async completeRide(rideId, driverId, completionData = {}) {
    const ride = await rideRepository.findById(rideId);
    if (!ride) {
      throw new NotFoundError('Ride');
    }

    if (getEntityId(ride.driverId) !== driverId) {
      throw new AuthorizationError('This ride is not assigned to you');
    }

    assertTransitionAllowed(ride.status, RIDE_STATUS.RIDE_COMPLETED);

    const finalDistanceMeters =
      completionData.finalDistanceMeters ?? ride.estimatedDistanceMeters;
    const finalDurationSeconds =
      completionData.finalDurationSeconds ?? ride.estimatedDurationSeconds;

    // Calculate final fare
    const fareResult = await fareCalculationService.calculateFinalFare({
      vehicleType: ride.vehicleType,
      finalDistanceMeters,
      finalDurationSeconds,
    });

    const session = await mongoose.startSession();
    let updated;

    try {
      await session.withTransaction(async () => {
        updated = await rideRepository.updateById(
          rideId,
          {
            status: RIDE_STATUS.RIDE_COMPLETED,
            completedAt: new Date(),
            finalDistanceMeters,
            finalDurationSeconds,
            finalFare: fareResult.finalFare,
            fareBreakdown: fareResult.breakdown,
          },
          session
        );

        // Free up driver
        await driverRepository.setAvailability(driverId, DRIVER_AVAILABILITY.ONLINE);
      });
    } finally {
      await session.endSession();
    }

    await rideEventPublisher.publish({ type: RIDE_EVENTS.RIDE_COMPLETED, rideId });

    logger.info({ event: 'ride_completed', rideId, driverId }, 'Ride completed');

    return updated;
  },

  /**
   * Cancels a ride.
   * Can be called by CUSTOMER or DRIVER (or SYSTEM internally).
   *
   * @param {string} rideId
   * @param {string} cancelledByRole - 'CUSTOMER' | 'DRIVER' | 'SYSTEM'
   * @param {string} [reason]
   * @returns {Promise<import('mongoose').Document>}
   */
  async cancelRide(rideId, cancelledByRole, reason) {
    const ride = await rideRepository.findById(rideId);
    if (!ride) {
      throw new NotFoundError('Ride');
    }

    assertTransitionAllowed(ride.status, RIDE_STATUS.CANCELLED);

    const updates = {
      status: RIDE_STATUS.CANCELLED,
      cancelledAt: new Date(),
      cancelledBy: cancelledByRole,
      cancellationReason: reason ?? '',
    };

    const updated = await rideRepository.updateById(rideId, updates);

    // Free up driver if one was assigned
    if (ride.driverId) {
      await driverRepository.setAvailability(getEntityId(ride.driverId), DRIVER_AVAILABILITY.ONLINE).catch(() => {});
    }

    await rideEventPublisher.publish({ type: RIDE_EVENTS.RIDE_CANCELLED, rideId });

    logger.info(
      { event: 'ride_cancelled', rideId, cancelledByRole, reason },
      'Ride cancelled'
    );

    return updated;
  },
};

export default rideService;
