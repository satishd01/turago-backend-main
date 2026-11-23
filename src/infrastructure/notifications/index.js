/**
 * Push notification provider factory.
 */

import env from '../../config/env.js';
import { MockPushNotificationProvider } from './MockPushNotificationProvider.js';

/** @type {import('./PushNotificationProvider.js').PushNotificationProvider | null} */
let _instance = null;

export function getPushNotificationProvider() {
  if (_instance) {
    return _instance;
  }

  switch (env.providers.pushNotification) {
    case 'mock':
      _instance = new MockPushNotificationProvider();
      break;

    // case 'fcm':
    //   _instance = new FcmProvider(env.fcm);
    //   break;

    default:
      throw new Error(`Unknown push notification provider: "${env.providers.pushNotification}"`);
  }

  return _instance;
}
