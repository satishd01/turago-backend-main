/**
 * Captain (Driver) Onboarding & Verification Unit & Schema Tests.
 * Verifies the 5-step registration validation, admin verification schema, and approval gates.
 */

import {
  onboardingVehicleSchema,
} from '../src/modules/drivers/validation/driver.validation.js';
import { verifyDriverSchema } from '../src/modules/admin/validation/admin.validation.js';
import { sendOtpSchema, verifyOtpSchema } from '../src/modules/auth/validation/auth.validation.js';
import {
  ROLES,
  DRIVER_APPROVAL_STATUS,
  DRIVER_ONBOARDING_STEP,
  VEHICLE_TYPE,
  DOCUMENT_TYPE,
} from '../src/common/constants/index.js';

describe('Captain (Driver) 5-Step Onboarding Schemas & Rules', () => {
  // ── Step 2 & 3: Account & OTP Validation ────────────────────────────────────

  describe('Step 2: Account Creation Schema', () => {
    it('should accept valid driver registration with phone, name, and email', () => {
      const payload = {
        phone: '+919356700237',
        role: ROLES.DRIVER,
        name: 'Satish Donerao',
        email: 'satish@example.com',
      };

      const { error, value } = sendOtpSchema.validate(payload);
      expect(error).toBeUndefined();
      expect(value.phone).toBe('+919356700237');
      expect(value.name).toBe('Satish Donerao');
      expect(value.email).toBe('satish@example.com');
    });

    it('should reject invalid email format in registration', () => {
      const payload = {
        phone: '+919356700237',
        role: ROLES.DRIVER,
        email: 'not-an-email',
      };

      const { error } = sendOtpSchema.validate(payload);
      expect(error).toBeDefined();
    });
  });

  describe('Step 3: OTP Verification Schema', () => {
    it('should validate 6-digit OTP payload for DRIVER role', () => {
      const payload = {
        phone: '+919356700237',
        otp: '847291',
        role: ROLES.DRIVER,
      };

      const { error } = verifyOtpSchema.validate(payload);
      expect(error).toBeUndefined();
    });

    it('should reject non-6-digit OTP', () => {
      const payload = {
        phone: '+919356700237',
        otp: '123',
        role: ROLES.DRIVER,
      };

      const { error } = verifyOtpSchema.validate(payload);
      expect(error).toBeDefined();
    });
  });

  // ── Step 4: Vehicle Selection ───────────────────────────────────────────────

  describe('Step 4: Choose Vehicle Schema', () => {
    it('should accept BIKE selection with registration details', () => {
      const payload = {
        vehicleType: VEHICLE_TYPE.BIKE,
        registrationNumber: 'MH12AB1234',
        make: 'Honda',
        model: 'Activa 6G',
        color: 'Black',
        year: 2023,
      };

      const { error, value } = onboardingVehicleSchema.validate(payload);
      expect(error).toBeUndefined();
      expect(value.vehicleType).toBe('BIKE');
      expect(value.registrationNumber).toBe('MH12AB1234');
    });

    it('should accept AUTO selection', () => {
      const payload = {
        vehicleType: VEHICLE_TYPE.AUTO,
        registrationNumber: 'MH12CD5678',
        make: 'Bajaj',
        model: 'Compact RE',
      };

      const { error, value } = onboardingVehicleSchema.validate(payload);
      expect(error).toBeUndefined();
      expect(value.vehicleType).toBe('AUTO');
    });

    it('should accept CAR/CAB selection', () => {
      const payload = {
        vehicleType: VEHICLE_TYPE.CAR,
        registrationNumber: 'MH12EF9012',
        make: 'Maruti Suzuki',
        model: 'WagonR',
        year: 2022,
      };

      const { error, value } = onboardingVehicleSchema.validate(payload);
      expect(error).toBeUndefined();
      expect(value.vehicleType).toBe('CAR');
    });

    it('should reject invalid vehicle type', () => {
      const payload = {
        vehicleType: 'TRUCK',
        registrationNumber: 'MH12AB1234',
      };

      const { error } = onboardingVehicleSchema.validate(payload);
      expect(error).toBeDefined();
    });

    it('should reject missing registration number', () => {
      const payload = {
        vehicleType: VEHICLE_TYPE.BIKE,
      };

      const { error } = onboardingVehicleSchema.validate(payload);
      expect(error).toBeDefined();
    });
  });

  // ── Step 5: Document Types Constants ────────────────────────────────────────

  describe('Step 5: Document Types & Onboarding Steps', () => {
    it('should have all 3 required KYC document types defined', () => {
      expect(DOCUMENT_TYPE.IDENTITY_PROOF).toBe('IDENTITY_PROOF');
      expect(DOCUMENT_TYPE.DRIVING_LICENSE).toBe('DRIVING_LICENSE');
      expect(DOCUMENT_TYPE.VEHICLE_RC).toBe('VEHICLE_RC');
    });

    it('should define the 5 onboarding steps sequentially', () => {
      expect(DRIVER_ONBOARDING_STEP.WELCOME).toBe(1);
      expect(DRIVER_ONBOARDING_STEP.ACCOUNT).toBe(2);
      expect(DRIVER_ONBOARDING_STEP.VERIFY).toBe(3);
      expect(DRIVER_ONBOARDING_STEP.VEHICLE).toBe(4);
      expect(DRIVER_ONBOARDING_STEP.DOCUMENTS).toBe(5);
      expect(DRIVER_ONBOARDING_STEP.COMPLETED).toBe(6);
    });
  });

  // ── Admin Verification Schema ───────────────────────────────────────────────

  describe('Admin Verification Schema', () => {
    it('should accept valid approval payload', () => {
      const payload = {
        status: DRIVER_APPROVAL_STATUS.APPROVED,
        approvalNote: 'All KYC documents verified successfully.',
      };

      const { error } = verifyDriverSchema.validate(payload);
      expect(error).toBeUndefined();
    });

    it('should accept rejection with required rejectionReason', () => {
      const payload = {
        status: DRIVER_APPROVAL_STATUS.REJECTED,
        rejectionReason: 'Aadhaar photo is blurry. Please re-upload.',
      };

      const { error } = verifyDriverSchema.validate(payload);
      expect(error).toBeUndefined();
    });

    it('should reject REJECTED status if rejectionReason is missing', () => {
      const payload = {
        status: DRIVER_APPROVAL_STATUS.REJECTED,
      };

      const { error } = verifyDriverSchema.validate(payload);
      expect(error).toBeDefined();
    });

    it('should reject unsupported status values', () => {
      const payload = {
        status: 'UNKNOWN_STATUS',
      };

      const { error } = verifyDriverSchema.validate(payload);
      expect(error).toBeDefined();
    });
  });
});
