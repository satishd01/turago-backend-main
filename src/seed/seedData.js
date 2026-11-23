/**
 * Database Seed Script for Turago.
 * Seeds default FareConfigs and Super Admin account.
 */

import { connectDatabase } from '../config/database.js';
import bcrypt from 'bcryptjs';
import FareConfigModel from '../modules/fares/model/FareConfig.model.js';
import AdminModel from '../modules/admin/model/Admin.model.js';
import { VEHICLE_TYPE } from '../common/constants/index.js';
import logger from '../config/logger.js';

async function seed() {
  await connectDatabase();
  console.log('Seeding initial data...');

  // 1. Seed Fare Configurations
  const defaultFares = [
    {
      vehicleType: VEHICLE_TYPE.BIKE,
      baseFare: 20,
      perKmRate: 8,
      perMinuteRate: 1,
      minimumFare: 30,
      waitingChargePerMinute: 1,
      platformFee: 5,
      taxRate: 0.05,
      isActive: true,
      currency: 'INR',
    },
    {
      vehicleType: VEHICLE_TYPE.AUTO,
      baseFare: 30,
      perKmRate: 12,
      perMinuteRate: 1.5,
      minimumFare: 45,
      waitingChargePerMinute: 1.5,
      platformFee: 5,
      taxRate: 0.05,
      isActive: true,
      currency: 'INR',
    },
    {
      vehicleType: VEHICLE_TYPE.CAB,
      baseFare: 50,
      perKmRate: 16,
      perMinuteRate: 2,
      minimumFare: 80,
      waitingChargePerMinute: 2,
      platformFee: 10,
      taxRate: 0.05,
      isActive: true,
      currency: 'INR',
    },
    {
      vehicleType: VEHICLE_TYPE.CAR,
      baseFare: 50,
      perKmRate: 16,
      perMinuteRate: 2,
      minimumFare: 80,
      waitingChargePerMinute: 2,
      platformFee: 10,
      taxRate: 0.05,
      isActive: true,
      currency: 'INR',
    },
  ];

  for (const fare of defaultFares) {
    await FareConfigModel.findOneAndUpdate(
      { vehicleType: fare.vehicleType },
      { $set: fare },
      { upsert: true, new: true }
    );
  }
  console.log('✓ Fare configs seeded for BIKE, AUTO, CAB, CAR');

  // 2. Seed Admin account with Username & Password
  const hashedPassword = await bcrypt.hash('Admin@turago2026', 10);
  const defaultAdmin = {
    username: 'admin',
    password: hashedPassword,
    phone: '+919999999999',
    name: 'Super Admin',
    email: 'admin@turago.com',
    adminRole: 'SUPER_ADMIN',
    isActive: true,
  };

  await AdminModel.findOneAndUpdate(
    { phone: defaultAdmin.phone },
    { $set: defaultAdmin },
    { upsert: true, new: true }
  );
  console.log('✓ Super Admin seeded: username: "admin", password: "Admin@turago2026"');

  console.log('Database seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  logger.error({ error: err.message }, 'Seeding failed');
  process.exit(1);
});
