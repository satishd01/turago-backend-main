/**
 * User service — business logic for customer profile management.
 */

import userRepository from '../repository/user.repository.js';
import { NotFoundError } from '../../../common/errors/AppError.js';

const userService = {
  /**
   * Returns the authenticated user's profile.
   * @param {string} userId
   * @returns {Promise<object>}
   */
  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  },

  /**
   * Updates the authenticated user's profile.
   * Only allows updating safe fields.
   *
   * @param {string} userId
   * @param {object} updates
   * @returns {Promise<object>}
   */
  async updateMe(userId, updates) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Only allow specific fields to be updated via this route
    const allowedUpdates = {};
    const UPDATABLE_FIELDS = ['name', 'email', 'profileImage', 'preferredLanguage', 'fcmToken'];

    for (const field of UPDATABLE_FIELDS) {
      if (updates[field] !== undefined) {
        allowedUpdates[field] = updates[field];
      }
    }

    return userRepository.updateById(userId, allowedUpdates);
  },
};

export default userService;
