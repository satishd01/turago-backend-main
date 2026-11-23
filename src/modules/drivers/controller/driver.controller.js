/**
 * Driver controller.
 */

import driverService from '../service/driver.service.js';
import { sendSuccess } from '../../../common/utils/apiResponse.js';
import { asyncHandler } from '../../../common/utils/asyncHandler.js';

/** GET /api/v1/drivers/me */
export const getMe = asyncHandler(async (req, res) => {
  const driver = await driverService.getMe(req.user.userId);
  return sendSuccess(res, { message: 'Driver profile retrieved', data: driver });
});

/** PATCH /api/v1/drivers/me */
export const updateMe = asyncHandler(async (req, res) => {
  const driver = await driverService.updateMe(req.user.userId, req.body);
  return sendSuccess(res, { message: 'Driver profile updated', data: driver });
});

/** POST /api/v1/drivers/location */
export const updateLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude, heading, speed } = req.body;
  const result = await driverService.updateLocation(req.user.userId, {
    latitude,
    longitude,
    heading,
    speed,
  });
  return sendSuccess(res, { message: 'Location updated', data: result });
});

/** POST /api/v1/drivers/go-online */
export const goOnline = asyncHandler(async (req, res) => {
  const driver = await driverService.goOnline(req.user.userId);
  return sendSuccess(res, { message: 'Driver is now online', data: { availability: driver.availability } });
});

/** POST /api/v1/drivers/go-offline */
export const goOffline = asyncHandler(async (req, res) => {
  const driver = await driverService.goOffline(req.user.userId);
  return sendSuccess(res, { message: 'Driver is now offline', data: { availability: driver.availability } });
});

/** POST /api/v1/drivers/onboarding/vehicle */
export const saveOnboardingVehicle = asyncHandler(async (req, res) => {
  const result = await driverService.saveOnboardingVehicle(req.user.userId, req.body);
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Vehicle information saved successfully',
    data: result,
  });
});

/** POST /api/v1/drivers/onboarding/documents */
export const saveOnboardingDocuments = asyncHandler(async (req, res) => {
  const result = await driverService.saveOnboardingDocuments(
    req.user.userId,
    req.files || {},
    req.body
  );
  return sendSuccess(res, {
    statusCode: 200,
    message: result.message,
    data: result.documents,
  });
});

/** POST /api/v1/drivers/onboarding/submit */
export const submitOnboarding = asyncHandler(async (req, res) => {
  const result = await driverService.submitOnboarding(req.user.userId);
  return sendSuccess(res, {
    statusCode: 200,
    message: result.message,
    data: result.driver,
  });
});

/** GET /api/v1/drivers/onboarding/status */
export const getOnboardingStatus = asyncHandler(async (req, res) => {
  const result = await driverService.getOnboardingStatus(req.user.userId);
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Onboarding status retrieved',
    data: result,
  });
});
