/**
 * Location routes.
 *
 * @swagger
 * tags:
 *   name: Locations
 *   description: Geospatial geocoding, places autocomplete, and popular destinations
 */

import { Router } from 'express';
import {
  reverseGeocode,
  autocomplete,
  getPopularLocations,
  getDirections,
} from '../controller/location.controller.js';
import { validate } from '../../../common/middleware/validate.js';
import {
  reverseGeocodeQuerySchema,
  autocompleteQuerySchema,
  popularLocationsQuerySchema,
  directionsBodySchema,
} from '../validation/location.validation.js';

const router = Router();

/**
 * @swagger
 * /api/v1/locations/reverse-geocode:
 *   get:
 *     summary: Convert GPS coordinates into human-readable customer pickup address
 *     tags: [Locations]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema: { type: number, example: 22.5726 }
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema: { type: number, example: 88.3639 }
 *     responses:
 *       200:
 *         description: Formatted address
 */
router.get(
  '/reverse-geocode',
  validate({ query: reverseGeocodeQuerySchema }),
  reverseGeocode
);

/**
 * @swagger
 * /api/v1/locations/autocomplete:
 *   get:
 *     summary: Places search suggestions / autocomplete for pickup and drop
 *     tags: [Locations]
 *     parameters:
 *       - in: query
 *         name: input
 *         required: true
 *         schema: { type: string, example: "Howrah" }
 *       - in: query
 *         name: latitude
 *         schema: { type: number }
 *       - in: query
 *         name: longitude
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Matching locations
 */
router.get(
  '/autocomplete',
  validate({ query: autocompleteQuerySchema }),
  autocomplete
);

/**
 * @swagger
 * /api/v1/locations/popular:
 *   get:
 *     summary: Get popular destinations relative to customer current location
 *     tags: [Locations]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         schema: { type: number, example: 22.5726 }
 *       - in: query
 *         name: longitude
 *         schema: { type: number, example: 88.3639 }
 *     responses:
 *       200:
 *         description: List of popular destinations with distance
 */
router.get(
  '/popular',
  validate({ query: popularLocationsQuerySchema }),
  getPopularLocations
);

/**
 * @swagger
 * /api/v1/locations/directions:
 *   post:
 *     summary: Get route distance, duration and fare estimates
 *     tags: [Locations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [origin, destination]
 *     responses:
 *       200:
 *         description: Route and fare details
 */
router.post(
  '/directions',
  validate({ body: directionsBodySchema }),
  getDirections
);

export default router;
