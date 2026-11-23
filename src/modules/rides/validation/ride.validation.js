/**
 * Ride validation schemas.
 */

import Joi from 'joi';
import { VEHICLE_TYPE } from '../../../common/constants/index.js';

const locationSchema = Joi.object({
  address: Joi.string().trim().max(300),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
});

export const createRideSchema = Joi.object({
  pickup: locationSchema.required(),
  destination: locationSchema.required(),
  vehicleType: Joi.string()
    .valid(...Object.values(VEHICLE_TYPE))
    .required()
    .messages({
      'any.only': `vehicleType must be one of: ${Object.values(VEHICLE_TYPE).join(', ')}`,
    }),
});

export const cancelRideSchema = Joi.object({
  reason: Joi.string().trim().max(500),
});

export const rideIdParamSchema = Joi.object({
  rideId: Joi.string()
    .pattern(/^[a-f\d]{24}$/i)
    .required()
    .messages({ 'string.pattern.base': 'rideId must be a valid MongoDB ObjectId' }),
});
