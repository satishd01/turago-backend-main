/**
 * Admin Web Dashboard Routes (EJS SSR).
 * Provides a clean, modern UI for fleet operations and driver KYC verification.
 */

import { Router } from 'express';
import jwt from 'jsonwebtoken';

import env from '../../../config/env.js';
import adminService from '../service/admin.service.js';
import DriverModel from '../../drivers/model/Driver.model.js';
import DriverDocumentModel from '../../drivers/model/DriverDocument.model.js';
import VehicleModel from '../../vehicles/model/Vehicle.model.js';
import RideModel from '../../rides/model/Ride.model.js';
import FareConfigModel from '../../fares/model/FareConfig.model.js';
import AdminModel from '../model/Admin.model.js';
import {
  DRIVER_APPROVAL_STATUS,
  DRIVER_AVAILABILITY,
  ROLES,
} from '../../../common/constants/index.js';

const router = Router();

/**
 * Web Authentication Middleware for Admin Panel
 */
function requireAdminWebAuth(req, res, next) {
  const token = req.cookies?.admin_token;
  if (!token) {
    return res.redirect('/admin/login');
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    if (decoded.role !== ROLES.ADMIN) {
      return res.redirect('/admin/login');
    }
    req.admin = decoded;
    res.locals.admin = decoded;
    return next();
  } catch {
    res.clearCookie('admin_token');
    return res.redirect('/admin/login');
  }
}

// ─── Authentication Routes ───────────────────────────────────────────────────

router.get('/', (req, res) => {
  if (req.cookies?.admin_token) {
    return res.redirect('/admin/dashboard');
  }
  return res.redirect('/admin/login');
});

router.get('/login', (req, res) => {
  if (req.cookies?.admin_token) {
    return res.redirect('/admin/dashboard');
  }
  return res.render('login', { error: null, message: null });
});

/**
 * 1-Click Instant Demo Login (For seamless client presentations)
 */
router.post('/demo-login', async (req, res) => {
  let admin = await AdminModel.findOne({ phone: '+919999999999' });
  if (!admin) {
    admin = await AdminModel.create({
      phone: '+919999999999',
      name: 'Super Admin',
      email: 'admin@turago.com',
      adminRole: 'SUPER_ADMIN',
    });
  }

  const token = jwt.sign(
    { userId: admin._id.toString(), role: ROLES.ADMIN, name: admin.name },
    env.jwt.secret,
    { expiresIn: '7d' }
  );

  res.cookie('admin_token', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.redirect('/admin/dashboard');
});

router.post('/login', async (req, res) => {
  const { phone } = req.body;
  const admin = await AdminModel.findOne({ phone: phone?.trim() });

  if (!admin) {
    return res.render('login', {
      error: `Admin with phone "${phone}" not found. Use Demo Login or +919999999999.`,
      message: null,
    });
  }

  const token = jwt.sign(
    { userId: admin._id.toString(), role: ROLES.ADMIN, name: admin.name },
    env.jwt.secret,
    { expiresIn: '7d' }
  );

  res.cookie('admin_token', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.redirect('/admin/dashboard');
});

router.get('/logout', (req, res) => {
  res.clearCookie('admin_token');
  return res.redirect('/admin/login');
});

// ─── Protected Dashboard Pages ───────────────────────────────────────────────

router.use(requireAdminWebAuth);

/**
 * Main Operations Dashboard
 */
router.get('/dashboard', async (req, res) => {
  const [pendingDrivers, onlineDrivers, approvedDrivers, totalRides, recentRides] =
    await Promise.all([
      DriverModel.countDocuments({ approvalStatus: DRIVER_APPROVAL_STATUS.PENDING }),
      DriverModel.countDocuments({ availability: DRIVER_AVAILABILITY.ONLINE }),
      DriverModel.countDocuments({ approvalStatus: DRIVER_APPROVAL_STATUS.APPROVED }),
      RideModel.countDocuments(),
      RideModel.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('customerId', 'name phone')
        .populate('driverId', 'name phone')
        .lean(),
    ]);

  return res.render('dashboard', {
    title: 'Operations Dashboard',
    currentPath: '/dashboard',
    pendingCount: pendingDrivers,
    stats: {
      pendingDrivers,
      onlineDrivers,
      approvedDrivers,
      totalRides,
    },
    recentRides,
  });
});

/**
 * Driver Approvals List
 */
router.get('/drivers', async (req, res) => {
  const selectedStatus = req.query.status || '';
  const query = {};
  if (selectedStatus) {
    query.approvalStatus = selectedStatus;
  }

  const [drivers, pendingCount] = await Promise.all([
    DriverModel.find(query)
      .sort({ updatedAt: -1 })
      .populate('vehicleId')
      .lean(),
    DriverModel.countDocuments({ approvalStatus: DRIVER_APPROVAL_STATUS.PENDING }),
  ]);

  return res.render('drivers', {
    title: 'Driver Approvals',
    currentPath: '/drivers',
    drivers,
    selectedStatus,
    pendingCount,
  });
});

/**
 * Single Driver Detail & KYC Review
 */
router.get('/drivers/:driverId', async (req, res) => {
  const { driverId } = req.params;

  const [driver, vehicle, documents, pendingCount] = await Promise.all([
    DriverModel.findById(driverId).lean(),
    VehicleModel.findOne({ driverId }).lean(),
    DriverDocumentModel.find({ driverId }).lean(),
    DriverModel.countDocuments({ approvalStatus: DRIVER_APPROVAL_STATUS.PENDING }),
  ]);

  if (!driver) {
    return res.redirect('/admin/drivers');
  }

  return res.render('driver_detail', {
    title: `Verify ${driver.name || 'Captain'}`,
    currentPath: '/drivers',
    driver,
    vehicle,
    documents,
    pendingCount,
  });
});

/**
 * Submit Verification Decision (Approve or Reject)
 */
router.post('/drivers/:driverId/verify', async (req, res) => {
  const { driverId } = req.params;
  const { status, approvalNote, rejectionReason } = req.body;

  await adminService.verifyDriver(driverId, {
    status,
    approvalNote,
    rejectionReason,
    adminId: req.admin?.userId,
  });

  return res.redirect('/admin/drivers');
});

/**
 * Rides & Bookings Monitor
 */
router.get('/rides', async (req, res) => {
  const [rides, pendingCount] = await Promise.all([
    RideModel.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('customerId', 'name phone')
      .populate('driverId', 'name phone')
      .lean(),
    DriverModel.countDocuments({ approvalStatus: DRIVER_APPROVAL_STATUS.PENDING }),
  ]);

  return res.render('rides', {
    title: 'Bookings & Trips',
    currentPath: '/rides',
    rides,
    pendingCount,
  });
});

/**
 * Fare Pricing Settings
 */
router.get('/fares', async (req, res) => {
  const [fares, pendingCount] = await Promise.all([
    FareConfigModel.find().lean(),
    DriverModel.countDocuments({ approvalStatus: DRIVER_APPROVAL_STATUS.PENDING }),
  ]);

  return res.render('fares', {
    title: 'Fare Pricing',
    currentPath: '/fares',
    fares,
    pendingCount,
  });
});

export default router;
