/**
 * Admin routes.
 *
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrative management and driver verification
 */

import { Router } from 'express';
import {
  getPendingDrivers,
  getDriverDetails,
  verifyDriver,
} from '../controller/admin.controller.js';
import { authenticate, authorize } from '../../../common/middleware/authenticate.js';
import { validate } from '../../../common/middleware/validate.js';
import { verifyDriverSchema } from '../validation/admin.validation.js';
import { ROLES } from '../../../common/constants/index.js';

const router = Router();

// All admin routes require authentication with role ADMIN
router.use(authenticate, authorize(ROLES.ADMIN));

/**
 * @swagger
 * /api/v1/admin/drivers/pending:
 *   get:
 *     summary: List drivers pending admin verification
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/drivers/pending', getPendingDrivers);

/**
 * @swagger
 * /api/v1/admin/drivers/{driverId}:
 *   get:
 *     summary: Get single driver's profile, vehicle details, and uploaded KYC documents
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/drivers/:driverId', getDriverDetails);

/**
 * @swagger
 * /api/v1/admin/drivers/{driverId}/verify:
 *   patch:
 *     summary: Approve, reject, or suspend a driver application
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/drivers/:driverId/verify',
  validate({ body: verifyDriverSchema }),
  verifyDriver
);

export default router;
