/**
 * Ride routes.
 *
 * @swagger
 * tags:
 *   name: Rides
 *   description: Ride lifecycle management
 */

import { Router } from 'express';
import {
  createRide,
  getRide,
  getLiveRide,
  acceptRide,
  driverArrived,
  startRide,
  completeRide,
  cancelRide,
} from '../controller/ride.controller.js';
import { authenticate, authorize } from '../../../common/middleware/authenticate.js';
import { validate } from '../../../common/middleware/validate.js';
import {
  createRideSchema,
  cancelRideSchema,
  rideIdParamSchema,
} from '../validation/ride.validation.js';
import { ROLES } from '../../../common/constants/index.js';

const router = Router();

// All ride routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/rides:
 *   post:
 *     summary: Create a new ride request
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pickup, destination, vehicleType]
 *             properties:
 *               pickup:
 *                 type: object
 *                 properties:
 *                   address: { type: string }
 *                   latitude: { type: number }
 *                   longitude: { type: number }
 *               destination:
 *                 type: object
 *                 properties:
 *                   address: { type: string }
 *                   latitude: { type: number }
 *                   longitude: { type: number }
 *               vehicleType:
 *                 type: string
 *                 enum: [BIKE, CAB]
 */
router.post(
  '/',
  authorize(ROLES.CUSTOMER),
  validate({ body: createRideSchema }),
  createRide
);

/**
 * @swagger
 * /api/v1/rides/{rideId}:
 *   get:
 *     summary: Get ride details by ID
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 */
router.get(
  '/:rideId',
  authorize(ROLES.CUSTOMER, ROLES.DRIVER, ROLES.ADMIN),
  validate({ params: rideIdParamSchema }),
  getRide
);

/**
 * @swagger
 * /api/v1/rides/{rideId}/live:
 *   get:
 *     summary: Get live ride state including driver location (for polling)
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:rideId/live',
  authorize(ROLES.CUSTOMER),
  validate({ params: rideIdParamSchema }),
  getLiveRide
);

/**
 * @swagger
 * /api/v1/rides/{rideId}/accept:
 *   post:
 *     summary: Driver accepts a ride
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:rideId/accept',
  authorize(ROLES.DRIVER),
  validate({ params: rideIdParamSchema }),
  acceptRide
);

/**
 * @swagger
 * /api/v1/rides/{rideId}/arrived:
 *   post:
 *     summary: Driver marks arrival at pickup
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:rideId/arrived',
  authorize(ROLES.DRIVER),
  validate({ params: rideIdParamSchema }),
  driverArrived
);

/**
 * @swagger
 * /api/v1/rides/{rideId}/start:
 *   post:
 *     summary: Driver starts the ride
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:rideId/start',
  authorize(ROLES.DRIVER),
  validate({ params: rideIdParamSchema }),
  startRide
);

/**
 * @swagger
 * /api/v1/rides/{rideId}/complete:
 *   post:
 *     summary: Driver completes the ride
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:rideId/complete',
  authorize(ROLES.DRIVER),
  validate({ params: rideIdParamSchema }),
  completeRide
);

/**
 * @swagger
 * /api/v1/rides/{rideId}/cancel:
 *   post:
 *     summary: Cancel a ride (Customer or Driver)
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 */
router.post(
  '/:rideId/cancel',
  authorize(ROLES.CUSTOMER, ROLES.DRIVER),
  validate({ params: rideIdParamSchema, body: cancelRideSchema }),
  cancelRide
);

export default router;
