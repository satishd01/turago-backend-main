/**
 * Location validation schemas using Joi.
 */

import Joi from 'joi';
import { VEHICLE_TYPE } from '../../../common/constants/index.js';

export const reverseGeocodeQuerySchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required().messages({
    'any.required': 'latitude is required',
    'number.base': 'latitude must be a number',
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    'any.required': 'longitude is required',
    'number.base': 'longitude must be a number',
  }),
});

export const autocompleteQuerySchema = Joi.object({
  input: Joi.string().trim().min(1).optional(),
  query: Joi.string().trim().min(1).optional(),
  search: Joi.string().trim().min(1).optional(),
  q: Joi.string().trim().min(1).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
}).or('input', 'query', 'search', 'q').messages({
  'object.missing': 'Search query parameter (input, query, search, or q) is required',
});

export const popularLocationsQuerySchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
});

export const directionsBodySchema = Joi.object({
  origin: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    address: Joi.string().optional(),
  }).required(),
  destination: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    address: Joi.string().optional(),
  }).required(),
  vehicleType: Joi.string().valid(...Object.values(VEHICLE_TYPE)).optional(),
});
