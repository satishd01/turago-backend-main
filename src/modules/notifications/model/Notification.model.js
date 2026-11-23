/**
 * Notification Mongoose model.
 * Records all notifications sent to users and drivers.
 */

import mongoose from 'mongoose';
import { ROLES, NOTIFICATION_CHANNEL } from '../../../common/constants/index.js';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    recipientRole: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },

    channel: {
      type: String,
      enum: Object.values(NOTIFICATION_CHANNEL),
      required: true,
    },

    title: {
      type: String,
      maxlength: 200,
    },

    body: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    /** Additional structured payload (e.g. { rideId, type: 'RIDE_ASSIGNED' }) */
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    sentAt: {
      type: Date,
      default: Date.now,
    },

    /** Whether the notification was successfully dispatched to the provider */
    delivered: {
      type: Boolean,
      default: false,
    },

    providerMessageId: {
      type: String,
    },

    error: {
      type: String, // Error message if delivery failed
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
  }
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });

const NotificationModel = mongoose.model('Notification', notificationSchema);

export default NotificationModel;
