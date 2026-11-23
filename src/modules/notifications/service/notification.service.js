/**
 * Notification Service.
 *
 * All notification dispatch goes through this service.
 * Business modules (RideService, DriverService) call NotificationService.
 * NotificationService calls the appropriate provider.
 *
 * Flow:
 *   RideService → NotificationService → PushNotificationProvider / SmsProvider
 *
 * This ensures business modules never import provider SDKs directly.
 */

import NotificationModel from '../model/Notification.model.js';
import { getPushNotificationProvider } from '../../../infrastructure/notifications/index.js';
import { getSmsProvider } from '../../../infrastructure/sms/index.js';
import { NOTIFICATION_CHANNEL } from '../../../common/constants/index.js';
import logger from '../../../config/logger.js';

const notificationService = {
  /**
   * Sends a push notification to a user or driver.
   *
   * @param {object} options
   * @param {string} options.recipientId - MongoDB ObjectId string
   * @param {string} options.recipientRole - ROLES constant
   * @param {string} options.fcmToken - Device token
   * @param {string} options.title
   * @param {string} options.body
   * @param {object} [options.data] - Extra payload for the app
   * @returns {Promise<void>}
   */
  async sendPush({ recipientId, recipientRole, fcmToken, title, body, data = {} }) {
    let delivered = false;
    let providerMessageId;
    let error;

    try {
      const provider = getPushNotificationProvider();
      const result = await provider.sendToDevice({ fcmToken, title, body, data });
      delivered = result.success;
      providerMessageId = result.messageId;
    } catch (err) {
      error = err.message;
      logger.error({ event: 'notification_push_error', recipientId, error }, 'Push notification failed');
    }

    // Record in DB for audit trail
    await NotificationModel.create({
      recipientId,
      recipientRole,
      channel: NOTIFICATION_CHANNEL.PUSH,
      title,
      body,
      data,
      delivered,
      providerMessageId,
      error,
    }).catch((dbErr) => {
      logger.error({ event: 'notification_save_error', error: dbErr.message }, 'Failed to save notification record');
    });
  },

  /**
   * Sends an SMS notification.
   *
   * @param {object} options
   * @param {string} options.recipientId
   * @param {string} options.recipientRole
   * @param {string} options.phone
   * @param {string} options.body - SMS message text
   * @returns {Promise<void>}
   */
  async sendSms({ recipientId, recipientRole, phone, body }) {
    let delivered = false;
    let providerMessageId;
    let error;

    try {
      const smsProvider = getSmsProvider();
      const result = await smsProvider.sendSms(phone, body);
      delivered = result.success;
      providerMessageId = result.messageId;
    } catch (err) {
      error = err.message;
      logger.error({ event: 'notification_sms_error', recipientId, error }, 'SMS notification failed');
    }

    await NotificationModel.create({
      recipientId,
      recipientRole,
      channel: NOTIFICATION_CHANNEL.SMS,
      body,
      delivered,
      providerMessageId,
      error,
    }).catch((dbErr) => {
      logger.error({ event: 'notification_save_error', error: dbErr.message }, 'Failed to save SMS notification record');
    });
  },
};

export default notificationService;
