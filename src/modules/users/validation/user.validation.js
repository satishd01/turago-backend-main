/**
 * User validation schemas.
 */

import Joi from 'joi';

export const updateMeSchema = Joi.object({
  name: Joi.string().trim().max(100),
  email: Joi.string().email().lowercase().trim(),
  profileImage: Joi.string().uri(),
  preferredLanguage: Joi.string().max(5),
  fcmToken: Joi.string().max(500),
}).min(1); // At least one field required
