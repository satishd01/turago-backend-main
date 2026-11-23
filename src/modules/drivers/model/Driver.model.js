/**
 * Driver Mongoose model.
 * Separates driver-specific fields from the User model.
 */

import mongoose from 'mongoose';
import {
  DRIVER_APPROVAL_STATUS,
  DRIVER_AVAILABILITY,
  DRIVER_ONBOARDING_STEP,
  VEHICLE_TYPE,
} from '../../../common/constants/index.js';

const driverSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },

    profileImage: {
      type: String,
    },

    // ── Onboarding & Approval state ───────────────────────────────────────
    onboardingStep: {
      type: Number,
      default: DRIVER_ONBOARDING_STEP.ACCOUNT,
      index: true,
    },

    approvalStatus: {
      type: String,
      enum: Object.values(DRIVER_APPROVAL_STATUS),
      default: DRIVER_APPROVAL_STATUS.PENDING,
      index: true,
    },

    approvalNote: {
      type: String, // Admin note on rejection/suspension
      trim: true,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    // ── Availability state ─────────────────────────────────────────────────
    availability: {
      type: String,
      enum: Object.values(DRIVER_AVAILABILITY),
      default: DRIVER_AVAILABILITY.OFFLINE,
      index: true,
    },

    // ── Vehicle relationship ───────────────────────────────────────────────
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      index: true,
    },

    /** Driver's preferred vehicle type (may differ from assigned vehicle) */
    vehicleType: {
      type: String,
      enum: Object.values(VEHICLE_TYPE),
    },

    // ── Current location (GeoJSON Point) ──────────────────────────────────
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },

    heading: {
      type: Number, // Degrees 0–360
      min: 0,
      max: 360,
    },

    speed: {
      type: Number, // km/h
      min: 0,
    },

    lastLocationUpdate: {
      type: Date,
    },

    // ── Notification ───────────────────────────────────────────────────────
    fcmToken: {
      type: String,
    },

    // ── Account ────────────────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastLoginAt: {
      type: Date,
    },

    // ── Metrics (lightweight — detailed stats in separate collection later) ─
    totalRides: {
      type: Number,
      default: 0,
    },

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
    collection: 'drivers',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── 2dsphere index for geospatial queries ────────────────────────────────────
driverSchema.index({ location: '2dsphere' });

// ─── Compound index for driver matching queries ───────────────────────────────
driverSchema.index({ availability: 1, approvalStatus: 1, vehicleType: 1 });

const DriverModel = mongoose.model('Driver', driverSchema);

export default DriverModel;
