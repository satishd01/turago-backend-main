/**
 * Ride Event Publisher.
 *
 * Conceptual abstraction for ride lifecycle events.
 * Currently uses a no-op / logging implementation (REST + polling MVP).
 *
 * Future implementations:
 *   - Socket.IO: emit to room by rideId
 *   - Redis Pub/Sub: publish to channel
 *   - Event bus: fanout to multiple consumers
 *
 * IMPORTANT: Business logic (ride.service.js) must call this publisher,
 * never call Socket.IO or Redis directly.
 */

import logger from '../../../config/logger.js';

/**
 * @typedef {Object} RideEvent
 * @property {string} type - Event type (e.g. 'RIDE_CREATED', 'DRIVER_ASSIGNED')
 * @property {string} rideId
 * @property {object} [payload] - Additional event data
 */

const rideEventPublisher = {
  /**
   * Publishes a ride lifecycle event.
   * Currently logs the event. Replace with real transport when needed.
   *
   * @param {RideEvent} event
   * @returns {Promise<void>}
   */
  async publish(event) {
    logger.debug(
      { event: 'ride_event_published', type: event.type, rideId: event.rideId },
      `[RideEvent] ${event.type}`
    );

    // ─── Future: Socket.IO ─────────────────────────────────────────────────
    // io.to(`ride:${event.rideId}`).emit(event.type, event.payload);

    // ─── Future: Redis Pub/Sub ────────────────────────────────────────────
    // await redisClient.publish(`ride:${event.rideId}`, JSON.stringify(event));
  },
};

export default rideEventPublisher;

// ─── Event type constants ─────────────────────────────────────────────────────

export const RIDE_EVENTS = Object.freeze({
  RIDE_CREATED: 'RIDE_CREATED',
  DRIVER_SEARCHING: 'DRIVER_SEARCHING',
  DRIVER_ASSIGNED: 'DRIVER_ASSIGNED',
  DRIVER_ARRIVING: 'DRIVER_ARRIVING',
  DRIVER_ARRIVED: 'DRIVER_ARRIVED',
  RIDE_STARTED: 'RIDE_STARTED',
  RIDE_COMPLETED: 'RIDE_COMPLETED',
  RIDE_CANCELLED: 'RIDE_CANCELLED',
  LOCATION_UPDATED: 'LOCATION_UPDATED',
});
