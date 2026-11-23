/**
 * Admin service — handles administrative actions like verifying drivers and documents.
 */

import DriverModel from '../../drivers/model/Driver.model.js';
import DriverDocumentModel from '../../drivers/model/DriverDocument.model.js';
import VehicleModel from '../../vehicles/model/Vehicle.model.js';
import {
  NotFoundError,
} from '../../../common/errors/AppError.js';
import {
  DRIVER_APPROVAL_STATUS,
  DOCUMENT_STATUS,
  VEHICLE_STATUS,
} from '../../../common/constants/index.js';

const adminService = {
  /**
   * Retrieves paginated list of drivers pending verification.
   * @param {{ page?: number; limit?: number; status?: string }} options
   * @returns {Promise<{ drivers: object[]; total: number; page: number; limit: number }>}
   */
  async getPendingDrivers({ page = 1, limit = 20, status = DRIVER_APPROVAL_STATUS.PENDING }) {
    const skip = (page - 1) * limit;
    const query = { approvalStatus: status };

    const [drivers, total] = await Promise.all([
      DriverModel.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('vehicleId')
        .lean(),
      DriverModel.countDocuments(query),
    ]);

    // Attach document summaries to each driver
    const driverIds = drivers.map((d) => d._id);
    const documents = await DriverDocumentModel.find({ driverId: { $in: driverIds } }).lean();

    const enrichedDrivers = drivers.map((driver) => {
      const driverDocs = documents.filter((doc) => doc.driverId.toString() === driver._id.toString());
      return {
        ...driver,
        documents: driverDocs,
      };
    });

    return {
      drivers: enrichedDrivers,
      total,
      page,
      limit,
    };
  },

  /**
   * Get single driver profile with full vehicle and uploaded documents.
   * @param {string} driverId
   * @returns {Promise<object>}
   */
  async getDriverDetails(driverId) {
    const driver = await DriverModel.findById(driverId).lean();
    if (!driver) {
      throw new NotFoundError('Driver');
    }

    const [vehicle, documents] = await Promise.all([
      VehicleModel.findOne({ driverId }).lean(),
      DriverDocumentModel.find({ driverId }).lean(),
    ]);

    return {
      driver,
      vehicle,
      documents,
    };
  },

  /**
   * Approves or rejects a driver.
   * @param {string} driverId
   * @param {{ status: string; rejectionReason?: string; approvalNote?: string; adminId?: string }} data
   * @returns {Promise<object>}
   */
  async verifyDriver(driverId, { status, rejectionReason, approvalNote, adminId }) {
    const driver = await DriverModel.findById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver');
    }

    // Update driver approval status
    driver.approvalStatus = status;
    driver.approvalNote = approvalNote || '';
    driver.rejectionReason = status === DRIVER_APPROVAL_STATUS.REJECTED ? (rejectionReason || '') : '';
    await driver.save();

    // Update all driver documents status accordingly
    const docStatus =
      status === DRIVER_APPROVAL_STATUS.APPROVED
        ? DOCUMENT_STATUS.APPROVED
        : status === DRIVER_APPROVAL_STATUS.REJECTED
        ? DOCUMENT_STATUS.REJECTED
        : DOCUMENT_STATUS.PENDING;

    await DriverDocumentModel.updateMany(
      { driverId },
      {
        $set: {
          status: docStatus,
          reviewedBy: adminId || null,
          reviewedAt: new Date(),
          reviewNote: approvalNote || rejectionReason || '',
        },
      }
    );

    // Update vehicle status
    if (driver.vehicleId) {
      await VehicleModel.findByIdAndUpdate(driver.vehicleId, {
        $set: {
          status:
            status === DRIVER_APPROVAL_STATUS.APPROVED
              ? VEHICLE_STATUS.ACTIVE
              : VEHICLE_STATUS.UNDER_REVIEW,
        },
      });
    }

    return {
      driver,
      status,
      message: `Driver status updated to ${status}`,
    };
  },
};

export default adminService;
