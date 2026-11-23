/**
 * Mock SMS Provider — for development and testing.
 *
 * Logs OTPs to the console/logger instead of sending real SMS.
 * NEVER use this in production.
 */

import { SmsProvider } from './SmsProvider.js';
import logger from '../../config/logger.js';

export class MockSmsProvider extends SmsProvider {
  /**
   * @param {string} phoneNumber
   * @param {string} otp
   * @returns {Promise<{ success: boolean; messageId: string }>}
   */
  async sendOtp(phoneNumber, otp) {
    // In development only — log the OTP so developers can use it without a real SMS service
    logger.info(
      { event: 'mock_sms_otp', phone: phoneNumber },
      `[MockSMS] OTP for ${phoneNumber}: ${otp}  ← (mock only, never log in production)`
    );

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }

  /**
   * @param {string} phoneNumber
   * @param {string} message
   * @returns {Promise<{ success: boolean; messageId: string }>}
   */
  async sendSms(phoneNumber, message) {
    logger.info(
      { event: 'mock_sms_send', phone: phoneNumber, message },
      `[MockSMS] SMS to ${phoneNumber}: ${message}`
    );

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }
}
