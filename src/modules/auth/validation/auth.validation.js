/**
 * Auth validation schemas using Joi.
 */

import Joi from 'joi';
import { ROLES } from '../../../common/constants/index.js';

/**
 * Validates E.164-style phone numbers or local formats.
 * Adjust the regex to match client's target country if needed.
 */
const phoneSchema = Joi.string()
  .pattern(/^\+?[1-9]\d{6,14}$/)
  .required()
  .messages({
    'string.pattern.base': 'Phone number must be a valid international phone number',
    'any.required': 'Phone number is required',
  });

const roleSchema = Joi.string()
  .valid(...Object.values(ROLES))
  .required()
  .messages({
    'any.only': `Role must be one of: ${Object.values(ROLES).join(', ')}`,
    'any.required': 'Role is required',
  });

export const sendOtpSchema = Joi.object({
  phone: phoneSchema,
  role: roleSchema,
  name: Joi.string().trim().max(100).optional(),
  email: Joi.string().trim().email().optional(),
});

export const verifyOtpSchema = Joi.object({
  phone: phoneSchema,
  otp: Joi.string()
    .length(6)
    .pattern(/^\d+$/)
    .required()
    .messages({
      'string.length': 'OTP must be 6 digits',
      'string.pattern.base': 'OTP must contain only digits',
      'any.required': 'OTP is required',
    }),
  role: roleSchema,
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});
