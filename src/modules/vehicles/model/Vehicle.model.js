/**
 * Vehicle Mongoose model.
 * Each vehicle belongs to one driver.
 */

import mongoose from 'mongoose';
import { VEHICLE_TYPE, VEHICLE_STATUS } from '../../../common/constants/index.js';

const vehicleSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: Object.values(VEHICLE_TYPE),
      required: true,
      index: true,
    },

    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    make: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    model: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    color: {
      type: String,
      trim: true,
      maxlength: 30,
    },

    year: {
      type: Number,
      min: 1980,
      max: new Date().getFullYear() + 1,
    },

    status: {
      type: String,
      enum: Object.values(VEHICLE_STATUS),
      default: VEHICLE_STATUS.UNDER_REVIEW,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'vehicles',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

const VehicleModel = mongoose.model('Vehicle', vehicleSchema);

export default VehicleModel;
