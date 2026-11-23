/**
 * Driver routes.
 *
 * @swagger
 * tags:
 *   name: Drivers
 *   description: Driver profile and availability management
 */

import { Router } from 'express';
import {
  getMe,
  updateMe,
  updateLocation,
  goOnline,
  goOffline,
  saveOnboardingVehicle,
  saveOnboardingDocuments,
  submitOnboarding,
  getOnboardingStatus,
} from '../controller/driver.controller.js';
import { authenticate, authorize } from '../../../common/middleware/authenticate.js';
import { validate } from '../../../common/middleware/validate.js';
import { documentUpload } from '../../../common/middleware/upload.js';
import {
  updateMeSchema,
  updateLocationSchema,
  onboardingVehicleSchema,
} from '../validation/driver.validation.js';
import { ROLES } from '../../../common/constants/index.js';

const router = Router();

// All driver routes require authentication as DRIVER
router.use(authenticate, authorize(ROLES.DRIVER));

/**
 * @swagger
 * /api/v1/drivers/me:
 *   get:
 *     summary: Get authenticated driver's profile
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', getMe);

/**
 * @swagger
 * /api/v1/drivers/me:
 *   patch:
 *     summary: Update authenticated driver's profile
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/me', validate({ body: updateMeSchema }), updateMe);

/**
 * @swagger
 * /api/v1/drivers/onboarding/vehicle:
 *   post:
 *     summary: Step 4 - Select vehicle type and vehicle details
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/onboarding/vehicle',
  validate({ body: onboardingVehicleSchema }),
  saveOnboardingVehicle
);

/**
 * @swagger
 * /api/v1/drivers/onboarding/documents:
 *   post:
 *     summary: Step 5 - Upload KYC and vehicle documents (Aadhaar, Driving License, RC)
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/onboarding/documents',
  documentUpload.fields([
    { name: 'identityProof', maxCount: 1 },
    { name: 'drivingLicence', maxCount: 1 },
    { name: 'vehicleRc', maxCount: 1 },
  ]),
  saveOnboardingDocuments
);

/**
 * @swagger
 * /api/v1/drivers/onboarding/submit:
 *   post:
 *     summary: Submit captain registration for admin verification
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 */
router.post('/onboarding/submit', submitOnboarding);

/**
 * @swagger
 * /api/v1/drivers/onboarding/status:
 *   get:
 *     summary: Get captain onboarding status and documents review state
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 */
router.get('/onboarding/status', getOnboardingStatus);

/**
 * @swagger
 * /api/v1/drivers/location:
 *   post:
 *     summary: Update driver's current GPS location
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 */
router.post('/location', validate({ body: updateLocationSchema }), updateLocation);

/**
 * @swagger
 * /api/v1/drivers/go-online:
 *   post:
 *     summary: Set driver status to ONLINE (Requires APPROVED status)
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 */
router.post('/go-online', goOnline);

/**
 * @swagger
 * /api/v1/drivers/go-offline:
 *   post:
 *     summary: Set driver status to OFFLINE
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 */
router.post('/go-offline', goOffline);

export default router;
