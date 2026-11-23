/**
 * User controller.
 */

import userService from '../service/user.service.js';
import { sendSuccess } from '../../../common/utils/apiResponse.js';
import { asyncHandler } from '../../../common/utils/asyncHandler.js';

/**
 * GET /api/v1/users/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getMe(req.user.userId);
  return sendSuccess(res, { message: 'Profile retrieved', data: user });
});

/**
 * PATCH /api/v1/users/me
 */
export const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateMe(req.user.userId, req.body);
  return sendSuccess(res, { message: 'Profile updated', data: user });
});
