/**
 * Ride repository — database access layer.
 */

import RideModel from '../model/Ride.model.js';
import { RIDE_STATUS } from '../../../common/constants/index.js';

export class RideRepository {
  /**
   * @param {object} data
   * @returns {Promise<import('mongoose').Document>}
   */
  async create(data) {
    return RideModel.create(data);
  }

  /**
   * @param {string} rideId
   * @returns {Promise<import('mongoose').Document | null>}
   */
  async findById(rideId) {
    return RideModel.findById(rideId)
      .populate('customerId', 'name phone profileImage')
      .populate('driverId', 'name phone profileImage location vehicleType averageRating')
      .populate('vehicleId', 'type registrationNumber make model color')
      .select('-__v');
  }

  /**
   * Finds all rides for a customer.
   * @param {string} customerId
   * @param {object} [options]
   * @param {number} [options.limit]
   * @param {number} [options.skip]
   * @param {string} [options.status]
   * @returns {Promise<import('mongoose').Document[]>}
   */
  async findByCustomer(customerId, { limit = 20, skip = 0, status } = {}) {
    const query = { customerId };
    if (status) query.status = status;
    return RideModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v')
      .populate('driverId', 'name phone profileImage vehicleType averageRating')
      .populate('vehicleId', 'type registrationNumber make model color');
  }

  /**
   * Finds all rides for a driver.
   * @param {string} driverId
   * @param {object} [options]
   * @param {number} [options.limit]
   * @param {number} [options.skip]
   * @param {string} [options.status]
   * @returns {Promise<import('mongoose').Document[]>}
   */
  async findByDriver(driverId, { limit = 20, skip = 0, status } = {}) {
    const query = { driverId };
    if (status) query.status = status;
    return RideModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v')
      .populate('customerId', 'name phone profileImage')
      .populate('vehicleId', 'type registrationNumber make model color');
  }

  /**
   * Finds the active ride for a customer.
   * A customer can only have one active ride at a time.
   * @param {string} customerId
   * @returns {Promise<import('mongoose').Document | null>}
   */
  async findActiveByCustomer(customerId) {
    return RideModel.findOne({
      customerId,
      status: {
        $nin: [RIDE_STATUS.RIDE_COMPLETED, RIDE_STATUS.CANCELLED],
      },
    })
      .populate('driverId', 'name phone profileImage location vehicleType averageRating')
      .populate('vehicleId', 'type registrationNumber make model color')
      .select('-__v');
  }

  /**
   * Finds the active ride for a driver.
   * @param {string} driverId
   * @returns {Promise<import('mongoose').Document | null>}
   */
  async findActiveByDriver(driverId) {
    return RideModel.findOne({
      driverId,
      status: {
        $in: [
          RIDE_STATUS.DRIVER_ASSIGNED,
          RIDE_STATUS.DRIVER_ARRIVING,
          RIDE_STATUS.DRIVER_ARRIVED,
          RIDE_STATUS.RIDE_STARTED,
        ],
      },
    })
      .populate('customerId', 'name phone profileImage')
      .populate('vehicleId', 'type registrationNumber make model color')
      .select('-__v');
  }

  /**
   * Updates ride status and optional fields atomically.
   *
   * @param {string} rideId
   * @param {object} updates - Fields to $set
   * @param {import('mongoose').ClientSession} [session] - MongoDB session for transactions
   * @returns {Promise<import('mongoose').Document | null>}
   */
  async updateById(rideId, updates, session) {
    const opts = { new: true, runValidators: true };
    if (session) {
      opts.session = session;
    }
    return RideModel.findByIdAndUpdate(rideId, { $set: updates }, opts);
  }

  /**
   * Counts rides by customer.
   * @param {string} customerId
   * @param {object} [options]
   * @param {string} [options.status]
   * @returns {Promise<number>}
   */
  async countByCustomer(customerId, { status } = {}) {
    const query = { customerId };
    if (status) query.status = status;
    return RideModel.countDocuments(query);
  }

  /**
   * Counts rides by driver.
   * @param {string} driverId
   * @param {object} [options]
   * @param {string} [options.status]
   * @returns {Promise<number>}
   */
  async countByDriver(driverId, { status } = {}) {
    const query = { driverId };
    if (status) query.status = status;
    return RideModel.countDocuments(query);
  }
}

export default new RideRepository();
