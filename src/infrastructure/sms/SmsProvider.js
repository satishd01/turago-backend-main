/**
 * SMS Provider abstraction.
 *
 * All SMS providers must implement this interface.
 * Business modules depend only on SmsProvider — never on a concrete SDK.
 *
 * @interface
 */
export class SmsProvider {
  /**
   * Sends an OTP message to a phone number.
   *
   * @param {string} phoneNumber - E.164 format recommended (e.g. +919876543210)
   * @param {string} otp - The OTP code to send
   * @returns {Promise<{ success: boolean; messageId?: string }>}
   */
  // eslint-disable-next-line no-unused-vars
  async sendOtp(phoneNumber, otp) {
    throw new Error('SmsProvider.sendOtp() must be implemented');
  }

  /**
   * Sends a generic SMS message.
   *
   * @param {string} phoneNumber
   * @param {string} message
   * @returns {Promise<{ success: boolean; messageId?: string }>}
   */
  // eslint-disable-next-line no-unused-vars
  async sendSms(phoneNumber, message) {
    throw new Error('SmsProvider.sendSms() must be implemented');
  }
}
