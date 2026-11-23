/**
 * SMS provider factory.
 * Resolves the correct SMS provider implementation based on configuration.
 * Business modules should import getSmsProvider() rather than concrete providers.
 */

import env from '../../config/env.js';
import { MockSmsProvider } from './MockSmsProvider.js';

/** @type {import('./SmsProvider.js').SmsProvider | null} */
let _instance = null;

/**
 * Returns the configured SMS provider singleton.
 * @returns {import('./SmsProvider.js').SmsProvider}
 */
export function getSmsProvider() {
  if (_instance) {
    return _instance;
  }

  const provider = env.providers.sms;

  switch (provider) {
    case 'mock':
      _instance = new MockSmsProvider();
      break;

    // Future providers — uncomment and implement when needed:
    // case 'twilio':
    //   _instance = new TwilioSmsProvider(env.twilio);
    //   break;
    // case 'msg91':
    //   _instance = new Msg91SmsProvider(env.msg91);
    //   break;

    default:
      throw new Error(`Unknown SMS provider: "${provider}". Check SMS_PROVIDER in .env`);
  }

  return _instance;
}
