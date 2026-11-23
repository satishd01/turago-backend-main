/**
 * Mock Push Notification Provider.
 */

import { PushNotificationProvider } from './PushNotificationProvider.js';
import logger from '../../config/logger.js';

export class MockPushNotificationProvider extends PushNotificationProvider {
  async sendToDevice({ fcmToken, title, body, data }) {
    logger.info(
      { event: 'mock_push_notification', fcmToken: fcmToken?.slice(0, 10) + '...', title, data },
      `[MockPush] ${title}: ${body}`
    );
    return { success: true, messageId: `mock_push_${Date.now()}` };
  }

  async sendToMultipleDevices(fcmTokens, { title, body, data }) {
    logger.info(
      { event: 'mock_push_multicast', count: fcmTokens.length, title, data },
      `[MockPush] Multicast ${title}: ${body}`
    );
    return { successCount: fcmTokens.length, failureCount: 0 };
  }
}
