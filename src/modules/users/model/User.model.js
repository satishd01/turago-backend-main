/**
 * User Mongoose model — represents a customer in the Turago platform.
 *
 * Driver-specific fields belong in the Driver model.
 * Admin-specific fields belong in the Admin model.
 */

import mongoose from 'mongoose';

// ─── Saved Location subdocument ───────────────────────────────────────────────

const savedLocationSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    address: {
      type: String,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
  },
  { _id: true }
);

// ─── User schema ──────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true, // Allow null/undefined for multiple documents
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },

    profileImage: {
      type: String, // URL or storage key
    },

    /** Customer's saved locations (home, work, etc.) */
    savedLocations: {
      type: [savedLocationSchema],
      default: [],
    },

    /** Whether the account is active. Disabled accounts cannot authenticate. */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /** FCM token for push notifications */
    fcmToken: {
      type: String,
    },

    /** ISO 639-1 language code preference */
    preferredLanguage: {
      type: String,
      default: 'en',
      maxlength: 5,
    },

    /** Last login timestamp */
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'users',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Note: email index is created by the schema-level sparse: true option above

const UserModel = mongoose.model('User', userSchema);

export default UserModel;
