/**
 * Ride controller — handles HTTP concerns for ride lifecycle.
 */

import rideService from '../service/ride.service.js';
import { sendSuccess } from '../../../common/utils/apiResponse.js';
import { asyncHandler } from '../../../common/utils/asyncHandler.js';

/** POST /api/v1/rides */
export const createRide = asyncHandler(async (req, res) => {
  const { pickup, destination, vehicleType } = req.body;

  const ride = await rideService.createRide({
    customerId: req.user.userId,
    pickup,
    destination,
    vehicleType,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Ride requested successfully',
    data: ride,
  });
});

/** GET /api/v1/rides/active */
export const getActiveRide = asyncHandler(async (req, res) => {
  const ride = await rideService.getActiveRide(req.user.userId, req.user.role);
  return sendSuccess(res, {
    message: ride ? 'Active ride found' : 'No active ride',
    data: ride,
  });
});

/** GET /api/v1/rides/history */
export const getRideHistory = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  const history = await rideService.getRideHistory(
    req.user.userId,
    req.user.role,
    { page, limit, status }
  );
  return sendSuccess(res, {
    message: 'Ride history retrieved successfully',
    data: history,
  });
});

/** GET /api/v1/rides/:rideId */
export const getRide = asyncHandler(async (req, res) => {
  const ride = await rideService.getRideById(req.params.rideId);
  return sendSuccess(res, { message: 'Ride retrieved', data: ride });
});

/** GET /api/v1/rides/:rideId/live */
export const getLiveRide = asyncHandler(async (req, res) => {
  const ride = await rideService.getLiveRide(req.params.rideId, req.user.userId);
  return sendSuccess(res, { message: 'Live ride state', data: ride });
});

/** POST /api/v1/rides/:rideId/accept (DRIVER) */
export const acceptRide = asyncHandler(async (req, res) => {
  const ride = await rideService.acceptRide(req.params.rideId, req.user.userId);
  return sendSuccess(res, { message: 'Ride accepted', data: ride });
});

/** POST /api/v1/rides/:rideId/arrived (DRIVER) */
export const driverArrived = asyncHandler(async (req, res) => {
  const ride = await rideService.driverArrived(req.params.rideId, req.user.userId);
  return sendSuccess(res, { message: 'Driver arrived at pickup', data: ride });
});

/** POST /api/v1/rides/:rideId/start (DRIVER) */
export const startRide = asyncHandler(async (req, res) => {
  const ride = await rideService.startRide(req.params.rideId, req.user.userId);
  return sendSuccess(res, { message: 'Ride started', data: ride });
});

/** POST /api/v1/rides/:rideId/complete (DRIVER) */
export const completeRide = asyncHandler(async (req, res) => {
  const ride = await rideService.completeRide(
    req.params.rideId,
    req.user.userId,
    req.body
  );
  return sendSuccess(res, { message: 'Ride completed', data: ride });
});

/** POST /api/v1/rides/:rideId/cancel (CUSTOMER or DRIVER) */
export const cancelRide = asyncHandler(async (req, res) => {
  const cancelledByRole = req.user.role;
  const { reason } = req.body;

  const ride = await rideService.cancelRide(
    req.params.rideId,
    cancelledByRole,
    reason
  );

  return sendSuccess(res, { message: 'Ride cancelled', data: ride });
});
