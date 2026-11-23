/**
 * User routes.
 *
 * @swagger
 * tags:
 *   name: Users
 *   description: Customer profile management
 */

import { Router } from 'express';
import { getMe, updateMe } from '../controller/user.controller.js';
import { authenticate, authorize } from '../../../common/middleware/authenticate.js';
import { validate } from '../../../common/middleware/validate.js';
import { updateMeSchema } from '../validation/user.validation.js';
import { ROLES } from '../../../common/constants/index.js';

const router = Router();

// All user routes require authentication as CUSTOMER
router.use(authenticate, authorize(ROLES.CUSTOMER));

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get authenticated customer's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', getMe);

/**
 * @swagger
 * /api/v1/users/me:
 *   patch:
 *     summary: Update authenticated customer's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               preferredLanguage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated profile
 */
router.patch('/me', validate({ body: updateMeSchema }), updateMe);

export default router;
