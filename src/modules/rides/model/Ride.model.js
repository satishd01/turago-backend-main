/**
 * Ride Mongoose model.
 * The central entity of the Turago platform.
 *
 * GeoJSON is used for pickup and destination to enable geospatial queries.
 * State transitions are NEVER performed by directly patching this document.
 * Use the controlled operations in ride.service.js.
 */

import mongoose from 'mongoose';
import {
  RIDE_STATUS,
  VEHICLE_TYPE,
  PAYMENT_STATUS,
} from '../../../common/constants/index.js';

// ─── GeoJSON Point subdocument ────────────────────────────────────────────────

const geoPointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  { _id: false }
);

// ─── Location with address ────────────────────────────────────────────────────

const locationSchema = new mongoose.Schema(
  {
    address: { type: String, trim: true },
    location: { type: geoPointSchema, required: true },
  },
  { _id: false }
);

// ─── Ride schema ──────────────────────────────────────────────────────────────

const rideSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      index: true,
    },

    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },

    vehicleType: {
      type: String,
      enum: Object.values(VEHICLE_TYPE),
      required: true,
    },

    // ── Locations ────────────────────────────────────────────────────────────
    pickup: {
      type: locationSchema,
      required: true,
    },

    destination: {
      type: locationSchema,
      required: true,
    },

    // ── Estimates (set at booking time) ──────────────────────────────────────
    estimatedDistanceMeters: {
      type: Number,
      min: 0,
    },

    estimatedDurationSeconds: {
      type: Number,
      min: 0,
    },

    estimatedFare: {
      type: Number,
      min: 0,
    },

    fareCurrency: {
      type: String,
      default: 'INR',
      maxlength: 3,
    },

    // ── Actuals (set at ride completion) ─────────────────────────────────────
    finalDistanceMeters: {
      type: Number,
      min: 0,
    },

    finalDurationSeconds: {
      type: Number,
      min: 0,
    },

    finalFare: {
      type: Number,
      min: 0,
    },

    fareBreakdown: {
      type: mongoose.Schema.Types.Mixed, // Store the full breakdown object
    },

    // ── Payment ──────────────────────────────────────────────────────────────
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },

    // ── State machine ────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: Object.values(RIDE_STATUS),
      default: RIDE_STATUS.REQUESTED,
      index: true,
    },

    // ── Timestamps for each state transition ─────────────────────────────────
    requestedAt: {
      type: Date,
      default: Date.now,
    },

    searchingDriverAt: { type: Date },
    assignedAt: { type: Date },
    driverArrivingAt: { type: Date },
    driverArrivedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },

    // ── Cancellation ──────────────────────────────────────────────────────────
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    cancelledBy: {
      type: String, // 'CUSTOMER' | 'DRIVER' | 'SYSTEM'
    },

    // ── Ratings ───────────────────────────────────────────────────────────────
    customerRating: {
      type: Number,
      min: 1,
      max: 5,
    },

    driverRating: {
      type: Number,
      min: 1,
      max: 5,
    },

    customerReview: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    collection: 'rides',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// GeoJSON indexes for pickup and destination
rideSchema.index({ 'pickup.location': '2dsphere' });
rideSchema.index({ 'destination.location': '2dsphere' });

// Efficient queries for customer ride history
rideSchema.index({ customerId: 1, createdAt: -1 });

// Efficient queries for driver ride history
rideSchema.index({ driverId: 1, createdAt: -1 });

// Active ride lookup
rideSchema.index({ customerId: 1, status: 1 });
rideSchema.index({ driverId: 1, status: 1 });

const RideModel = mongoose.model('Ride', rideSchema);

export default RideModel;
