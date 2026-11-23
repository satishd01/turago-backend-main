/**
 * Auth validation unit tests.
 */

import { sendOtpSchema, verifyOtpSchema } from '../src/modules/auth/validation/auth.validation.js';

describe('Auth Validation — sendOtpSchema', () => {
  it('should accept valid phone number and role', () => {
    const { error } = sendOtpSchema.validate({
      phone: '+919876543210',
      role: 'CUSTOMER',
    });
    expect(error).toBeUndefined();
  });

  it('should reject missing phone', () => {
    const { error } = sendOtpSchema.validate({ role: 'CUSTOMER' });
    expect(error).toBeDefined();
  });

  it('should reject invalid role', () => {
    const { error } = sendOtpSchema.validate({
      phone: '+919876543210',
      role: 'UNKNOWN_ROLE',
    });
    expect(error).toBeDefined();
  });

  it('should reject invalid phone format', () => {
    const { error } = sendOtpSchema.validate({
      phone: 'not-a-phone',
      role: 'DRIVER',
    });
    expect(error).toBeDefined();
  });
});

describe('Auth Validation — verifyOtpSchema', () => {
  it('should accept valid OTP verification payload', () => {
    const { error } = verifyOtpSchema.validate({
      phone: '+919876543210',
      otp: '123456',
      role: 'CUSTOMER',
    });
    expect(error).toBeUndefined();
  });

  it('should reject OTP with incorrect length', () => {
    const { error } = verifyOtpSchema.validate({
      phone: '+919876543210',
      otp: '123',
      role: 'CUSTOMER',
    });
    expect(error).toBeDefined();
  });

  it('should reject OTP with non-digit characters', () => {
    const { error } = verifyOtpSchema.validate({
      phone: '+919876543210',
      otp: '12345a',
      role: 'CUSTOMER',
    });
    expect(error).toBeDefined();
  });

  it('should reject missing OTP', () => {
    const { error } = verifyOtpSchema.validate({
      phone: '+919876543210',
      role: 'CUSTOMER',
    });
    expect(error).toBeDefined();
  });
});
