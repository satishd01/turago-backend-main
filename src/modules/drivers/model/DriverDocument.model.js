/**
 * DriverDocument Mongoose model.
 * Manages driver document uploads (license, RC, insurance, etc.).
 */

import mongoose from 'mongoose';
import { DOCUMENT_TYPE, DOCUMENT_STATUS } from '../../../common/constants/index.js';

const driverDocumentSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
      index: true,
    },

    documentType: {
      type: String,
      enum: Object.values(DOCUMENT_TYPE),
      required: true,
    },

    /** Storage key or URL returned by the storage provider */
    fileKey: {
      type: String,
      required: true,
    },

    fileUrl: {
      type: String,
    },

    /** Document number (e.g. license number) */
    documentNumber: {
      type: String,
      trim: true,
    },

    /** Document expiry date */
    expiryDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: Object.values(DOCUMENT_STATUS),
      default: DOCUMENT_STATUS.PENDING,
      index: true,
    },

    /** Admin review note */
    reviewNote: {
      type: String,
      trim: true,
    },

    /** Admin who reviewed the document */
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },

    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'driverDocuments',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Ensure one document type per driver
driverDocumentSchema.index({ driverId: 1, documentType: 1 }, { unique: true });

const DriverDocumentModel = mongoose.model('DriverDocument', driverDocumentSchema);

export default DriverDocumentModel;
