/**
 * Mock Payment Provider — for development and testing.
 */

import { PaymentProvider } from './PaymentProvider.js';
import logger from '../../config/logger.js';

export class MockPaymentProvider extends PaymentProvider {
  async createPayment({ amount, currency = 'INR', rideId, customerId }) {
    const paymentId = `mock_pay_${Date.now()}`;
    logger.info(
      { event: 'mock_payment_created', paymentId, amount, currency, rideId, customerId },
      '[MockPayment] Payment created'
    );
    return {
      paymentId,
      orderId: `mock_order_${Date.now()}`,
      status: 'PENDING',
    };
  }

  async getPaymentStatus(_paymentId) {
    return { status: 'PENDING', amount: 0, paidAt: null };
  }

  async refundPayment(paymentId, amount) {
    logger.info(
      { event: 'mock_payment_refunded', paymentId, amount },
      '[MockPayment] Refund processed'
    );
    return {
      refundId: `mock_refund_${Date.now()}`,
      status: 'REFUNDED',
    };
  }

  verifyWebhookSignature(_payload, _signature) {
    return true;
  }
}
