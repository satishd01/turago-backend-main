/**
 * Admin controller.
 */

import adminService from '../service/admin.service.js';
import { sendSuccess } from '../../../common/utils/apiResponse.js';
import { asyncHandler } from '../../../common/utils/asyncHandler.js';

/** GET /api/v1/admin/drivers/pending */
export const getPendingDrivers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const status = req.query.status;

  const result = await adminService.getPendingDrivers({ page, limit, status });
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Pending drivers retrieved',
    data: result.drivers,
    meta: { total: result.total, page: result.page, limit: result.limit },
  });
});

/** GET /api/v1/admin/drivers/:driverId */
export const getDriverDetails = asyncHandler(async (req, res) => {
  const result = await adminService.getDriverDetails(req.params.driverId);
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Driver details retrieved',
    data: result,
  });
});

/** PATCH /api/v1/admin/drivers/:driverId/verify */
export const verifyDriver = asyncHandler(async (req, res) => {
  const { status, rejectionReason, approvalNote } = req.body;
  const result = await adminService.verifyDriver(req.params.driverId, {
    status,
    rejectionReason,
    approvalNote,
    adminId: req.user?.userId,
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: result.message,
    data: result,
  });
});
