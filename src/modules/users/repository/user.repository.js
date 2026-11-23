/**
 * User repository — database access layer.
 */

import UserModel from '../model/User.model.js';

export class UserRepository {
  /**
   * @param {string} userId
   * @returns {Promise<import('mongoose').Document | null>}
   */
  async findById(userId) {
    return UserModel.findById(userId).select('-__v');
  }

  /**
   * @param {string} phone
   * @returns {Promise<import('mongoose').Document | null>}
   */
  async findByPhone(phone) {
    return UserModel.findOne({ phone });
  }

  /**
   * @param {object} data
   * @returns {Promise<import('mongoose').Document>}
   */
  async create(data) {
    return UserModel.create(data);
  }

  /**
   * @param {string} userId
   * @param {object} updates
   * @returns {Promise<import('mongoose').Document | null>}
   */
  async updateById(userId, updates) {
    return UserModel.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true }).select('-__v');
  }

  /**
   * Adds a saved location to the user.
   * @param {string} userId
   * @param {object} location
   * @returns {Promise<import('mongoose').Document | null>}
   */
  async addSavedLocation(userId, location) {
    return UserModel.findByIdAndUpdate(
      userId,
      { $push: { savedLocations: location } },
      { new: true }
    ).select('-__v');
  }

  /**
   * Removes a saved location from the user.
   * @param {string} userId
   * @param {string} locationId
   * @returns {Promise<import('mongoose').Document | null>}
   */
  async removeSavedLocation(userId, locationId) {
    return UserModel.findByIdAndUpdate(
      userId,
      { $pull: { savedLocations: { _id: locationId } } },
      { new: true }
    ).select('-__v');
  }
}

export default new UserRepository();
