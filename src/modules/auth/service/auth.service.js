/**
 * Auth service — business logic for OTP generation, verification, and JWT issuance.
 *
 * Flow:
 *   sendOtp     → generate OTP → hash → store → send via SMS provider
 *   verifyOtp   → find OTP → compare hash → validate → issue JWT pair
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import env from '../../../config/env.js';
import logger from '../../../config/logger.js';
import authRepository from '../repository/auth.repository.js';
import { getSmsProvider } from '../../../infrastructure/sms/index.js';
import {
  AuthenticationError,
  RateLimitError,
  BusinessRuleError,
} from '../../../common/errors/AppError.js';
import { ROLES } from '../../../common/constants/index.js';

// Lazy user/driver/admin imports to avoid circular dependencies
import UserModel from '../../users/model/User.model.js';
import DriverModel from '../../drivers/model/Driver.model.js';
import AdminModel from '../../admin/model/Admin.model.js';

const BCRYPT_ROUNDS = 10;

/**
 * Generates a cryptographically random numeric OTP.
 * @param {number} [length=6]
 * @returns {string}
 */
function generateOtpCode(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

/**
 * Hashes an OTP using bcrypt.
 * @param {string} otp
 * @returns {Promise<string>}
 */
async function hashOtp(otp) {
  return bcrypt.hash(otp, BCRYPT_ROUNDS);
}

/**
 * Compares plaintext OTP against stored hash.
 * @param {string} otp
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function compareOtp(otp, hash) {
  return bcrypt.compare(otp, hash);
}

/**
 * Issues a JWT access token.
 * @param {{ userId: string; role: string; phone: string }} payload
 * @returns {string}
 */
function issueAccessToken(payload) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

/**
 * Issues a JWT refresh token.
 * @param {{ userId: string; role: string }} payload
 * @returns {string}
 */
function issueRefreshToken(payload) {
  return jwt.sign({ ...payload, jti: uuidv4() }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
}

/**
 * Resolves the user document for any role.
 * @param {string} phone
 * @param {string} role
 * @returns {Promise<{ userId: string; isNew: boolean; user: object }>}
 */
/**
 * Resolves the user document for any role.
 * @param {string} phone
 * @param {string} role
 * @param {{ name?: string; email?: string }} [metadata]
 * @returns {Promise<{ userId: string; isNew: boolean; user: object }>}
 */
async function resolveOrCreateUser(phone, role, metadata = {}) {
  let user;
  let isNew = false;

  if (role === ROLES.CUSTOMER) {
    user = await UserModel.findOne({ phone });
    if (!user) {
      user = await UserModel.create({
        phone,
        ...(metadata.name ? { name: metadata.name } : {}),
        ...(metadata.email ? { email: metadata.email } : {}),
      });
      isNew = true;
    }
  } else if (role === ROLES.DRIVER) {
    user = await DriverModel.findOne({ phone });
    if (!user) {
      user = await DriverModel.create({
        phone,
        ...(metadata.name ? { name: metadata.name } : {}),
        ...(metadata.email ? { email: metadata.email } : {}),
        onboardingStep: 4, // Advances to Step 4 (Vehicle selection) after OTP verification
      });
      isNew = true;
    } else {
      // If driver exists and needs profile updates or is in initial onboarding
      const updates = {};
      if (metadata.name && !user.name) {
        updates.name = metadata.name;
      }
      if (metadata.email && !user.email) {
        updates.email = metadata.email;
      }
      if (user.onboardingStep < 4) {
        updates.onboardingStep = 4;
      }
      if (Object.keys(updates).length > 0) {
        user = await DriverModel.findByIdAndUpdate(user._id, updates, { new: true });
      }
    }
  } else if (role === ROLES.ADMIN) {
    user = await AdminModel.findOne({ phone });
    if (!user) {
      throw new AuthenticationError('Admin account not found. Please contact support.');
    }
  }

  return { userId: user._id.toString(), isNew, user };
}

// ─── Exported service ─────────────────────────────────────────────────────────

const authService = {
  /**
   * Sends an OTP to the given phone number.
   * Applies rate limiting, stores the hashed OTP, and returns the OTP in response.
   *
   * @param {string} phone
   * @param {string} role - One of ROLES
   * @param {{ name?: string; email?: string }} [metadata]
   * @returns {Promise<{ expiresInSeconds: number; otp: string }>}
   */
  async sendOtp(phone, role, metadata = {}) {
    // ── Rate limiting ────────────────────────────────────────────────────────
    const windowMs = env.otp.rateLimitWindowMinutes * 60 * 1000;
    const since = new Date(Date.now() - windowMs);
    const requestCount = await authRepository.countOtpRequests(phone, since);

    if (requestCount >= env.otp.rateLimitMax) {
      throw new RateLimitError(
        `Too many OTP requests. Please try again after ${env.otp.rateLimitWindowMinutes} minutes.`
      );
    }

    // ── OTP generation ───────────────────────────────────────────────────────
    const otp = generateOtpCode(6);
    const otpHash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + env.otp.expirySeconds * 1000);

    await authRepository.upsertOtp({ phone, role, otpHash, expiresAt });

    // ── If driver registration details provided, stage/save them ────────────
    if (role === ROLES.DRIVER && (metadata.name || metadata.email)) {
      await DriverModel.findOneAndUpdate(
        { phone },
        {
          $set: {
            ...(metadata.name ? { name: metadata.name } : {}),
            ...(metadata.email ? { email: metadata.email } : {}),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    // ── SMS dispatch ─────────────────────────────────────────────────────────
    const smsProvider = getSmsProvider();
    await smsProvider.sendOtp(phone, otp);

    logger.info(
      { event: 'otp_sent', phone, role, otp },
      'OTP sent successfully'
    );

    return { expiresInSeconds: env.otp.expirySeconds, otp };
  },

  /**
   * Verifies an OTP and returns JWT tokens on success.
   *
   * @param {string} phone
   * @param {string} otp
   * @param {string} role
   * @returns {Promise<{
   *   accessToken: string;
   *   refreshToken: string;
   *   isNewUser: boolean;
   *   user: object;
   * }>}
   */
  async verifyOtp(phone, otp, role) {
    const otpRecord = await authRepository.findActiveOtp(phone, role);

    if (!otpRecord) {
      throw new AuthenticationError('OTP expired or not found. Please request a new OTP.');
    }

    // ── Attempt limit ────────────────────────────────────────────────────────
    if (otpRecord.attempts >= env.otp.maxAttempts) {
      throw new BusinessRuleError(
        `Maximum OTP attempts exceeded. Please request a new OTP.`,
        'OTP_MAX_ATTEMPTS_EXCEEDED'
      );
    }

    // ── Hash comparison ──────────────────────────────────────────────────────
    const isValid = await compareOtp(otp, otpRecord.otpHash);

    if (!isValid) {
      await authRepository.incrementAttempts(otpRecord._id);
      throw new AuthenticationError('Invalid OTP. Please check and try again.');
    }

    // ── Mark OTP as used ─────────────────────────────────────────────────────
    await authRepository.markOtpUsed(otpRecord._id);

    // ── Resolve user ─────────────────────────────────────────────────────────
    const { userId, isNew, user } = await resolveOrCreateUser(phone, role);

    // ── Issue tokens ─────────────────────────────────────────────────────────
    const tokenPayload = { userId, role, phone };
    const accessToken = issueAccessToken(tokenPayload);
    const refreshToken = issueRefreshToken(tokenPayload);

    logger.info({ event: 'otp_verified', phone, role, isNew }, 'OTP verified, tokens issued');

    return {
      accessToken,
      refreshToken,
      isNewUser: isNew,
      user,
    };
  },

  /**
   * Refreshes an access token using a valid refresh token.
   * @param {string} refreshToken
   * @returns {Promise<{ accessToken: string }>}
   */
  async refreshAccessToken(refreshToken) {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.jwt.refreshSecret);
    } catch {
      throw new AuthenticationError('Invalid or expired refresh token.');
    }

    const accessToken = issueAccessToken({
      userId: decoded.userId,
      role: decoded.role,
      phone: decoded.phone,
    });

    return { accessToken };
  },
};

export default authService;
