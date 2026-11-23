/**
 * Auth routes.
 *
 * @swagger
 * tags:
 *   name: Auth
 *   description: Mobile phone authentication via OTP
 */

import { Router } from 'express';
import { sendOtp, verifyOtp, refreshToken } from '../controller/auth.controller.js';
import { validate } from '../../../common/middleware/validate.js';
import {
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
} from '../validation/auth.validation.js';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/send-otp:
 *   post:
 *     summary: Send OTP to a phone number
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, role]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+919876543210"
 *               role:
 *                 type: string
 *                 enum: [CUSTOMER, DRIVER, ADMIN]
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       429:
 *         description: Too many OTP requests
 */
router.post('/send-otp', validate({ body: sendOtpSchema }), sendOtp);

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and receive JWT tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, otp, role]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+919876543210"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               role:
 *                 type: string
 *                 enum: [CUSTOMER, DRIVER, ADMIN]
 *     responses:
 *       200:
 *         description: OTP verified, tokens returned
 *       401:
 *         description: Invalid OTP
 */
router.post('/verify-otp', validate({ body: verifyOtpSchema }), verifyOtp);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', validate({ body: refreshTokenSchema }), refreshToken);

export default router;
