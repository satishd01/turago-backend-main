/**
 * Auth repository — database access layer for OTP and token operations.
 */

import OtpModel from '../model/Otp.model.js';

export class AuthRepository {
  /**
   * Creates or replaces an OTP record for a phone + role.
   * Only one active OTP per phone+role is maintained.
   *
   * @param {object} data
   * @param {string} data.phone
   * @param {string} data.role
   * @param {string} data.otpHash
   * @param {Date} data.expiresAt
   * @returns {Promise<import('mongoose').Document>}
   */
  async upsertOtp({ phone, role, otpHash, expiresAt }) {
    return OtpModel.findOneAndUpdate(
      { phone, role },
      {
        $set: { otpHash, expiresAt, isUsed: false, attempts: 0 },
        $inc: { resendCount: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  /**
   * Finds the most recent valid (non-expired, non-used) OTP for phone+role.
   *
   * @param {string} phone
   * @param {string} role
   * @returns {Promise<import('mongoose').Document | null>}
   */
  async findActiveOtp(phone, role) {
    return OtpModel.findOne({
      phone,
      role,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });
  }

  /**
   * Increments the failed attempt counter.
   * @param {string} otpId
   * @returns {Promise<import('mongoose').Document | null>}
   */
  async incrementAttempts(otpId) {
    return OtpModel.findByIdAndUpdate(otpId, { $inc: { attempts: 1 } }, { new: true });
  }

  /**
   * Marks an OTP as used.
   * @param {string} otpId
   * @returns {Promise<void>}
   */
  async markOtpUsed(otpId) {
    await OtpModel.findByIdAndUpdate(otpId, { $set: { isUsed: true } });
  }

  /**
   * Counts OTP send requests for a phone in a time window.
   * Used for rate limiting at the data layer.
   *
   * @param {string} phone
   * @param {Date} since
   * @returns {Promise<number>}
   */
  async countOtpRequests(phone, since) {
    return OtpModel.countDocuments({
      phone,
      createdAt: { $gte: since },
    });
  }
}

export default new AuthRepository();
