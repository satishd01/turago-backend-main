/**
 * Driver validation schemas.
 */

import Joi from 'joi';
import { VEHICLE_TYPE } from '../../../common/constants/index.js';

export const updateMeSchema = Joi.object({
  name: Joi.string().trim().max(100),
  email: Joi.string().email().lowercase().trim(),
  profileImage: Joi.string().uri(),
  fcmToken: Joi.string().max(500),
  vehicleType: Joi.string().valid(...Object.values(VEHICLE_TYPE)),
}).min(1);

export const updateLocationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required().messages({
    'number.min': 'Latitude must be between -90 and 90',
    'number.max': 'Latitude must be between -90 and 90',
    'any.required': 'Latitude is required',
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    'number.min': 'Longitude must be between -180 and 180',
    'number.max': 'Longitude must be between -180 and 180',
    'any.required': 'Longitude is required',
  }),
  heading: Joi.number().min(0).max(360),
  speed: Joi.number().min(0),
});

export const onboardingVehicleSchema = Joi.object({
  vehicleType: Joi.string()
    .valid(...Object.values(VEHICLE_TYPE))
    .required()
    .messages({
      'any.only': `Vehicle type must be one of: ${Object.values(VEHICLE_TYPE).join(', ')}`,
      'any.required': 'Vehicle type is required',
    }),
  registrationNumber: Joi.string()
    .trim()
    .uppercase()
    .min(4)
    .max(20)
    .required()
    .messages({
      'any.required': 'Vehicle registration number is required',
    }),
  make: Joi.string().trim().max(50).optional(),
  model: Joi.string().trim().max(50).optional(),
  color: Joi.string().trim().max(30).optional(),
  year: Joi.number().integer().min(1980).max(new Date().getFullYear() + 1).optional(),
});
