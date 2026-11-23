/**
 * Driver repository — database access layer.
 */

import DriverModel from '../model/Driver.model.js';
import { DRIVER_AVAILABILITY, DRIVER_APPROVAL_STATUS } from '../../../common/constants/index.js';

export class DriverRepository {
  /**
   * @param {string} driverId
   * @returns {Promise<import('mongoose').Document | null>}
   */
  async findById(driverId) {
    return DriverModel.findById(driverId).select('-__v');
  }

  /**
   * @param {string} phone
   * @returns {Promise<import('mongoose').Document | null>}
   */
  async findByPhone(phone) {
    return DriverModel.findOne({ phone });
  }

  /**
   * @param {object} data
   * @returns {Promise<import('mongoose').Document>}
   */
  async create(data) {
    return DriverModel.create(data);
  }

  /**
   * @param {string} driverId
   * @param {object} updates
   * @returns {Promise<import('mongoose').Document | null>}
   */
  async updateById(driverId, updates) {
    return DriverModel.findByIdAndUpdate(
      driverId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-__v');
  }

  /**
   * Updates the driver's real-time location.
   *
   * @param {string} driverId
   * @param {{ longitude: number; latitude: number; heading?: number; speed?: number }} locationData
   * @returns {Promise<import('mongoose').Document | null>}
   */
  async updateLocation(driverId, { longitude, latitude, heading, speed }) {
    const update = {
      location: { type: 'Point', coordinates: [longitude, latitude] },
      lastLocationUpdate: new Date(),
    };

    if (heading !== undefined) {
      update.heading = heading;
    }
    if (speed !== undefined) {
      update.speed = speed;
    }

    return DriverModel.findByIdAndUpdate(driverId, { $set: update }, { new: true }).select(
      'location heading speed lastLocationUpdate availability'
    );
  }

  /**
   * Sets a driver's availability status.
   * @param {string} driverId
   * @param {string} availability
   * @returns {Promise<import('mongoose').Document | null>}
   */
  async setAvailability(driverId, availability) {
    return DriverModel.findByIdAndUpdate(
      driverId,
      { $set: { availability } },
      { new: true }
    ).select('availability approvalStatus');
  }

  /**
   * Finds available, approved drivers near a GeoJSON coordinate.
   * Uses MongoDB $nearSphere for 2dsphere index.
   *
   * @param {object} options
   * @param {number} options.longitude
   * @param {number} options.latitude
   * @param {number} options.maxDistanceMeters
   * @param {string} [options.vehicleType]
   * @param {number} [options.limit]
   * @returns {Promise<import('mongoose').Document[]>}
   */
  async findNearbyAvailable({ longitude, latitude, maxDistanceMeters, vehicleType, limit = 10 }) {
    const query = {
      availability: DRIVER_AVAILABILITY.ONLINE,
      approvalStatus: DRIVER_APPROVAL_STATUS.APPROVED,
      isActive: true,
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistanceMeters,
        },
      },
    };

    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    return DriverModel.find(query).limit(limit).select(
      'name phone location vehicleType vehicleId averageRating lastLocationUpdate'
    );
  }
}

export default new DriverRepository();
