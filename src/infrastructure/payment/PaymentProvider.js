/**
 * Payment Provider abstraction.
 */

export class PaymentProvider {
  /**
   * @param {object} options
   * @param {number} options.amount - Amount in smallest currency unit (e.g. paise)
   * @param {string} options.currency
   * @param {string} options.rideId
   * @param {string} options.customerId
   * @returns {Promise<{ paymentId: string; orderId: string; status: string }>}
   */
  // eslint-disable-next-line no-unused-vars
  async createPayment(options) {
    throw new Error('PaymentProvider.createPayment() must be implemented');
  }

  /**
   * @param {string} paymentId
   * @returns {Promise<{ status: string; amount: number; paidAt?: Date }>}
   */
  // eslint-disable-next-line no-unused-vars
  async getPaymentStatus(paymentId) {
    throw new Error('PaymentProvider.getPaymentStatus() must be implemented');
  }

  /**
   * @param {string} paymentId
   * @param {number} amount - Amount to refund in smallest unit
   * @returns {Promise<{ refundId: string; status: string }>}
   */
  // eslint-disable-next-line no-unused-vars
  async refundPayment(paymentId, amount) {
    throw new Error('PaymentProvider.refundPayment() must be implemented');
  }

  /**
   * Verifies a payment webhook signature.
   * @param {object} payload
   * @param {string} signature
   * @returns {boolean}
   */
  // eslint-disable-next-line no-unused-vars
  verifyWebhookSignature(payload, signature) {
    throw new Error('PaymentProvider.verifyWebhookSignature() must be implemented');
  }
}
