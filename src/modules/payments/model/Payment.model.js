/**
 * Payment Mongoose model.
 */

import mongoose from 'mongoose';
import { PAYMENT_STATUS } from '../../../common/constants/index.js';

const paymentSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: 'INR',
      maxlength: 3,
    },

    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },

    /** Payment gateway order/payment ID */
    providerPaymentId: {
      type: String,
    },

    providerOrderId: {
      type: String,
    },

    /** Payment method: cash, card, wallet, upi */
    paymentMethod: {
      type: String,
    },

    paidAt: {
      type: Date,
    },

    refundId: {
      type: String,
    },

    refundedAt: {
      type: Date,
    },

    refundAmount: {
      type: Number,
      min: 0,
    },

    /** Raw provider response for debugging */
    providerResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: 'payments',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

const PaymentModel = mongoose.model('Payment', paymentSchema);

export default PaymentModel;
