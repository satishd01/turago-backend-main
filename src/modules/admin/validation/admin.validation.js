/**
 * Admin validation schemas using Joi.
 */

import Joi from 'joi';
import { DRIVER_APPROVAL_STATUS } from '../../../common/constants/index.js';

export const verifyDriverSchema = Joi.object({
  status: Joi.string()
    .valid(DRIVER_APPROVAL_STATUS.APPROVED, DRIVER_APPROVAL_STATUS.REJECTED, DRIVER_APPROVAL_STATUS.SUSPENDED)
    .required()
    .messages({
      'any.only': `Status must be one of: ${[
        DRIVER_APPROVAL_STATUS.APPROVED,
        DRIVER_APPROVAL_STATUS.REJECTED,
        DRIVER_APPROVAL_STATUS.SUSPENDED,
      ].join(', ')}`,
      'any.required': 'Verification status is required',
    }),
  rejectionReason: Joi.string().trim().max(500).when('status', {
    is: DRIVER_APPROVAL_STATUS.REJECTED,
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  approvalNote: Joi.string().trim().max(500).optional(),
});
