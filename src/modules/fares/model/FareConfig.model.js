/**
 * FareConfig Mongoose model.
 * Stores configurable fare parameters per vehicle type.
 * This is the single source of truth for pricing.
 * Do NOT hard-code fares in ride logic — always read from this collection.
 */

import mongoose from 'mongoose';
import { VEHICLE_TYPE } from '../../../common/constants/index.js';

const fareConfigSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      enum: Object.values(VEHICLE_TYPE),
      required: true,
      unique: true,
      index: true,
    },

    /** Base fare applied at the start of every ride */
    baseFare: {
      type: Number,
      required: true,
      min: 0,
    },

    /** Fare per kilometer */
    perKmRate: {
      type: Number,
      required: true,
      min: 0,
    },

    /** Fare per minute of ride duration */
    perMinuteRate: {
      type: Number,
      required: true,
      min: 0,
    },

    /** Minimum chargeable fare regardless of distance */
    minimumFare: {
      type: Number,
      required: true,
      min: 0,
    },

    /** Charge per minute of waiting time (driver waiting at pickup) */
    waitingChargePerMinute: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * Platform fee — flat amount or percentage.
     * Business team to confirm final formula.
     */
    platformFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    /** Tax rate as a decimal (e.g. 0.05 for 5%) */
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },

    /** Whether this config is active */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /** ISO 4217 currency code */
    currency: {
      type: String,
      default: 'INR',
      maxlength: 3,
    },
  },
  {
    timestamps: true,
    collection: 'fareConfigs',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

const FareConfigModel = mongoose.model('FareConfig', fareConfigSchema);

export default FareConfigModel;
