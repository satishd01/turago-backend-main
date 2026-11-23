/**
 * OTP Mongoose model.
 * Stores OTP codes for phone verification.
 * OTPs are expired via TTL index on expiresAt.
 *
 * SECURITY: OTP values are stored hashed (bcrypt).
 */

import mongoose from 'mongoose';
import { ROLES } from '../../../common/constants/index.js';

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },

    /** Role the OTP is being requested for */
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },

    /** bcrypt hash of the OTP — never store plaintext */
    otpHash: {
      type: String,
      required: true,
    },

    /** Number of failed verification attempts */
    attempts: {
      type: Number,
      default: 0,
    },

    /** Whether the OTP has been successfully used */
    isUsed: {
      type: Boolean,
      default: false,
    },

    /** Number of times OTP was resent for this request session */
    resendCount: {
      type: Number,
      default: 0,
    },

    /** TTL index field — MongoDB auto-deletes expired OTP documents */
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL: delete when expiresAt is reached
    },
  },
  {
    timestamps: true,
    collection: 'otps',
  }
);

// Compound index for efficient lookups by phone + role
otpSchema.index({ phone: 1, role: 1 });

const OtpModel = mongoose.model('Otp', otpSchema);

export default OtpModel;
