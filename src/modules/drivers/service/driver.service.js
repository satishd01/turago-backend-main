/**
 * Driver service — business logic for driver profile and location management.
 */

import driverRepository from '../repository/driver.repository.js';
import DriverDocumentModel from '../model/DriverDocument.model.js';
import VehicleModel from '../../vehicles/model/Vehicle.model.js';
import {
  NotFoundError,
  BusinessRuleError,
} from '../../../common/errors/AppError.js';
import {
  DRIVER_AVAILABILITY,
  DRIVER_APPROVAL_STATUS,
  DRIVER_ONBOARDING_STEP,
  DOCUMENT_TYPE,
  DOCUMENT_STATUS,
} from '../../../common/constants/index.js';

const driverService = {
  /**
   * Returns the authenticated driver's profile.
   * @param {string} driverId
   * @returns {Promise<object>}
   */
  async getMe(driverId) {
    const driver = await driverRepository.findById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver');
    }
    return driver;
  },

  /**
   * Updates the authenticated driver's profile (safe fields only).
   * @param {string} driverId
   * @param {object} updates
   * @returns {Promise<object>}
   */
  async updateMe(driverId, updates) {
    const driver = await driverRepository.findById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver');
    }

    const allowedUpdates = {};
    const UPDATABLE_FIELDS = ['name', 'email', 'profileImage', 'fcmToken', 'vehicleType'];

    for (const field of UPDATABLE_FIELDS) {
      if (updates[field] !== undefined) {
        allowedUpdates[field] = updates[field];
      }
    }

    return driverRepository.updateById(driverId, allowedUpdates);
  },

  /**
   * Step 4 of Onboarding: Save vehicle selection and details.
   * @param {string} driverId
   * @param {object} vehicleData
   * @returns {Promise<object>}
   */
  async saveOnboardingVehicle(driverId, vehicleData) {
    const driver = await driverRepository.findById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver');
    }

    const { vehicleType, registrationNumber, make, model, color, year } = vehicleData;

    // Create or update vehicle record for this driver
    const vehicle = await VehicleModel.findOneAndUpdate(
      { driverId },
      {
        $set: {
          type: vehicleType,
          registrationNumber: registrationNumber.toUpperCase().trim(),
          make: make || '',
          model: model || '',
          color: color || '',
          year: year || new Date().getFullYear(),
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Update driver with vehicle reference, vehicle type, and step 5 (Documents)
    const updatedDriver = await driverRepository.updateById(driverId, {
      vehicleId: vehicle._id,
      vehicleType,
      onboardingStep: DRIVER_ONBOARDING_STEP.DOCUMENTS,
    });

    return {
      driver: updatedDriver,
      vehicle,
    };
  },

  /**
   * Step 5 of Onboarding: Upload KYC and vehicle documents.
   * @param {string} driverId
   * @param {Record<string, Express.Multer.File[]>} files
   * @param {object} body - document numbers / metadata
   * @returns {Promise<object>}
   */
  async saveOnboardingDocuments(driverId, files, body = {}) {
    const driver = await driverRepository.findById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver');
    }

    const savedDocs = [];

    // 1. Identity proof (Aadhaar / ID)
    if (files.identityProof && files.identityProof[0]) {
      const file = files.identityProof[0];
      const doc = await DriverDocumentModel.findOneAndUpdate(
        { driverId, documentType: DOCUMENT_TYPE.IDENTITY_PROOF },
        {
          $set: {
            fileKey: file.filename,
            fileUrl: `/uploads/documents/${file.filename}`,
            documentNumber: body.identityProofNumber || '',
            status: DOCUMENT_STATUS.PENDING,
          },
        },
        { upsert: true, new: true }
      );
      savedDocs.push(doc);
    }

    // 2. Driving License
    if (files.drivingLicence && files.drivingLicence[0]) {
      const file = files.drivingLicence[0];
      const doc = await DriverDocumentModel.findOneAndUpdate(
        { driverId, documentType: DOCUMENT_TYPE.DRIVING_LICENSE },
        {
          $set: {
            fileKey: file.filename,
            fileUrl: `/uploads/documents/${file.filename}`,
            documentNumber: body.drivingLicenceNumber || '',
            status: DOCUMENT_STATUS.PENDING,
          },
        },
        { upsert: true, new: true }
      );
      savedDocs.push(doc);
    }

    // 3. Vehicle RC
    if (files.vehicleRc && files.vehicleRc[0]) {
      const file = files.vehicleRc[0];
      const doc = await DriverDocumentModel.findOneAndUpdate(
        { driverId, documentType: DOCUMENT_TYPE.VEHICLE_RC },
        {
          $set: {
            fileKey: file.filename,
            fileUrl: `/uploads/documents/${file.filename}`,
            documentNumber: body.vehicleRcNumber || '',
            status: DOCUMENT_STATUS.PENDING,
          },
        },
        { upsert: true, new: true }
      );
      savedDocs.push(doc);
    }

    return {
      documents: savedDocs,
      message: 'Documents uploaded successfully',
    };
  },

  /**
   * Final Step: Submit registration for admin review.
   * @param {string} driverId
   * @returns {Promise<object>}
   */
  async submitOnboarding(driverId) {
    const driver = await driverRepository.findById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver');
    }

    // Check that required documents are present
    const docs = await DriverDocumentModel.find({ driverId });
    const docTypes = docs.map((d) => d.documentType);

    const requiredDocTypes = [
      DOCUMENT_TYPE.IDENTITY_PROOF,
      DOCUMENT_TYPE.DRIVING_LICENSE,
      DOCUMENT_TYPE.VEHICLE_RC,
    ];

    const missingDocs = requiredDocTypes.filter((t) => !docTypes.includes(t));
    if (missingDocs.length > 0) {
      throw new BusinessRuleError(
        `Please upload all required documents: ${missingDocs.join(', ')}`,
        'INCOMPLETE_DOCUMENTS'
      );
    }

    const updatedDriver = await driverRepository.updateById(driverId, {
      onboardingStep: DRIVER_ONBOARDING_STEP.COMPLETED,
      approvalStatus: DRIVER_APPROVAL_STATUS.PENDING,
      rejectionReason: '',
    });

    return {
      driver: updatedDriver,
      message: 'Registration submitted successfully. Pending Admin verification.',
    };
  },

  /**
   * Get Captain onboarding status and uploaded documents summary.
   * @param {string} driverId
   * @returns {Promise<object>}
   */
  async getOnboardingStatus(driverId) {
    const driver = await driverRepository.findById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver');
    }

    const vehicle = await VehicleModel.findOne({ driverId });
    const documents = await DriverDocumentModel.find({ driverId });

    return {
      driver: {
        id: driver._id,
        phone: driver.phone,
        name: driver.name,
        email: driver.email,
        onboardingStep: driver.onboardingStep,
        approvalStatus: driver.approvalStatus,
        rejectionReason: driver.rejectionReason,
        availability: driver.availability,
      },
      vehicle,
      documents,
    };
  },

  /**
   * Updates driver's current location.
   * Only ONLINE or BUSY drivers should update location.
   *
   * @param {string} driverId
   * @param {object} locationData
   * @returns {Promise<object>}
   */
  async updateLocation(driverId, locationData) {
    const driver = await driverRepository.findById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver');
    }

    if (driver.availability === DRIVER_AVAILABILITY.OFFLINE) {
      throw new BusinessRuleError(
        'Cannot update location while offline. Go online first.',
        'DRIVER_OFFLINE'
      );
    }

    return driverRepository.updateLocation(driverId, locationData);
  },

  /**
   * Sets driver status to ONLINE.
   * Only APPROVED drivers can go online.
   *
   * @param {string} driverId
   * @returns {Promise<object>}
   */
  async goOnline(driverId) {
    const driver = await driverRepository.findById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver');
    }

    if (driver.approvalStatus !== DRIVER_APPROVAL_STATUS.APPROVED) {
      throw new BusinessRuleError(
        `Driver account is not approved. Current status: ${driver.approvalStatus}`,
        'DRIVER_NOT_APPROVED'
      );
    }

    if (driver.availability === DRIVER_AVAILABILITY.ONLINE) {
      return driver; // Already online — idempotent
    }

    return driverRepository.setAvailability(driverId, DRIVER_AVAILABILITY.ONLINE);
  },

  /**
   * Sets driver status to OFFLINE.
   * @param {string} driverId
   * @returns {Promise<object>}
   */
  async goOffline(driverId) {
    const driver = await driverRepository.findById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver');
    }

    if (driver.availability === DRIVER_AVAILABILITY.BUSY) {
      throw new BusinessRuleError(
        'Cannot go offline while on an active ride.',
        'DRIVER_BUSY'
      );
    }

    return driverRepository.setAvailability(driverId, DRIVER_AVAILABILITY.OFFLINE);
  },
};

export default driverService;
