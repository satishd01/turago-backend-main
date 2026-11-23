/**
 * Push Notification Provider abstraction.
 */

export class PushNotificationProvider {
  /**
   * Sends a push notification to a single device.
   * @param {object} options
   * @param {string} options.fcmToken - Device FCM token
   * @param {string} options.title
   * @param {string} options.body
   * @param {object} [options.data] - Extra key-value payload
   * @returns {Promise<{ success: boolean; messageId?: string }>}
   */
  // eslint-disable-next-line no-unused-vars
  async sendToDevice(options) {
    throw new Error('PushNotificationProvider.sendToDevice() must be implemented');
  }

  /**
   * Sends a push notification to multiple devices.
   * @param {string[]} fcmTokens
   * @param {object} notification - { title, body, data }
   * @returns {Promise<{ successCount: number; failureCount: number }>}
   */
  // eslint-disable-next-line no-unused-vars
  async sendToMultipleDevices(fcmTokens, notification) {
    throw new Error('PushNotificationProvider.sendToMultipleDevices() must be implemented');
  }
}
