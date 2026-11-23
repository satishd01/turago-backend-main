/**
 * Auth controller — handles HTTP concerns for authentication.
 * Delegates all business logic to auth.service.
 */

import authService from '../service/auth.service.js';
import { sendSuccess } from '../../../common/utils/apiResponse.js';
import { asyncHandler } from '../../../common/utils/asyncHandler.js';

/**
 * POST /api/v1/auth/send-otp
 */
export const sendOtp = asyncHandler(async (req, res) => {
  const { phone, role, name, email } = req.body;

  const result = await authService.sendOtp(phone, role, { name, email });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'OTP sent successfully',
    data: {
      phone,
      otp: result.otp,
      expiresInSeconds: result.expiresInSeconds,
    },
  });
});

/**
 * POST /api/v1/auth/verify-otp
 */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp, role } = req.body;

  const result = await authService.verifyOtp(phone, otp, role);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'OTP verified successfully',
    data: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      isNewUser: result.isNewUser,
      user: result.user,
    },
  });
});

/**
 * POST /api/v1/auth/refresh
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  const result = await authService.refreshAccessToken(token);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Token refreshed successfully',
    data: { accessToken: result.accessToken },
  });
});
