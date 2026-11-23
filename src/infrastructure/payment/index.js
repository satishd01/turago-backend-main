/**
 * Payment provider factory.
 */

import env from '../../config/env.js';
import { MockPaymentProvider } from './MockPaymentProvider.js';

/** @type {import('./PaymentProvider.js').PaymentProvider | null} */
let _instance = null;

/**
 * @returns {import('./PaymentProvider.js').PaymentProvider}
 */
export function getPaymentProvider() {
  if (_instance) {
    return _instance;
  }

  switch (env.providers.payment) {
    case 'mock':
      _instance = new MockPaymentProvider();
      break;

    // case 'razorpay':
    //   _instance = new RazorpayProvider(env.razorpay);
    //   break;

    default:
      throw new Error(`Unknown payment provider: "${env.providers.payment}"`);
  }

  return _instance;
}
