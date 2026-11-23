/**
 * Fare Calculation Service.
 *
 * All fare calculation logic lives here.
 * The Ride module calls this service — it never computes fares independently.
 *
 * The formula is intentionally simple for MVP.
 * The business team will confirm the final formula later.
 *
 * Current formula:
 *   subtotal = baseFare + (distanceKm × perKmRate) + (durationMin × perMinuteRate)
 *   subtotal = max(subtotal, minimumFare)
 *   total    = subtotal + platformFee + (subtotal × taxRate)
 *
 * This is subject to change once client confirms pricing model.
 */

import FareConfigModel from '../model/FareConfig.model.js';
import { NotFoundError } from '../../../common/errors/AppError.js';
import logger from '../../../config/logger.js';

const fareCalculationService = {
  /**
   * Retrieves fare config for a vehicle type.
   * @param {string} vehicleType
   * @returns {Promise<import('mongoose').Document>}
   */
  async getFareConfig(vehicleType) {
    const config = await FareConfigModel.findOne({ vehicleType, isActive: true });
    if (!config) {
      throw new NotFoundError(`Fare configuration for vehicle type '${vehicleType}'`);
    }
    return config;
  },

  /**
   * Estimates the fare for a ride before it starts.
   *
   * @param {object} params
   * @param {string} params.vehicleType
   * @param {number} params.distanceMeters
   * @param {number} params.durationSeconds
   * @returns {Promise<{
   *   estimatedFare: number;
   *   breakdown: object;
   *   currency: string;
   * }>}
   */
  async estimateFare({ vehicleType, distanceMeters, durationSeconds }) {
    const config = await this.getFareConfig(vehicleType);

    const distanceKm = distanceMeters / 1000;
    const durationMin = durationSeconds / 60;

    const distanceFare = distanceKm * config.perKmRate;
    const timeFare = durationMin * config.perMinuteRate;
    const subtotal = config.baseFare + distanceFare + timeFare;
    const adjustedSubtotal = Math.max(subtotal, config.minimumFare);
    const tax = adjustedSubtotal * config.taxRate;
    const total = adjustedSubtotal + config.platformFee + tax;

    const result = {
      estimatedFare: Math.round(total * 100) / 100, // 2 decimal places
      breakdown: {
        baseFare: config.baseFare,
        distanceFare: Math.round(distanceFare * 100) / 100,
        timeFare: Math.round(timeFare * 100) / 100,
        platformFee: config.platformFee,
        tax: Math.round(tax * 100) / 100,
        minimumFareApplied: subtotal < config.minimumFare,
      },
      currency: config.currency,
    };

    logger.debug(
      { event: 'fare_estimated', vehicleType, distanceKm, durationMin, result },
      'Fare estimated'
    );

    return result;
  },

  /**
   * Calculates the final fare for a completed ride.
   * Uses actual distance and duration.
   *
   * @param {object} params
   * @param {string} params.vehicleType
   * @param {number} params.finalDistanceMeters
   * @param {number} params.finalDurationSeconds
   * @param {number} [params.waitingMinutes]
   * @returns {Promise<{ finalFare: number; breakdown: object; currency: string }>}
   */
  async calculateFinalFare({ vehicleType, finalDistanceMeters, finalDurationSeconds, waitingMinutes = 0 }) {
    const config = await this.getFareConfig(vehicleType);

    const distanceKm = finalDistanceMeters / 1000;
    const durationMin = finalDurationSeconds / 60;

    const distanceFare = distanceKm * config.perKmRate;
    const timeFare = durationMin * config.perMinuteRate;
    const waitingFare = waitingMinutes * config.waitingChargePerMinute;
    const subtotal = config.baseFare + distanceFare + timeFare + waitingFare;
    const adjustedSubtotal = Math.max(subtotal, config.minimumFare);
    const tax = adjustedSubtotal * config.taxRate;
    const total = adjustedSubtotal + config.platformFee + tax;

    return {
      finalFare: Math.round(total * 100) / 100,
      breakdown: {
        baseFare: config.baseFare,
        distanceFare: Math.round(distanceFare * 100) / 100,
        timeFare: Math.round(timeFare * 100) / 100,
        waitingFare: Math.round(waitingFare * 100) / 100,
        platformFee: config.platformFee,
        tax: Math.round(tax * 100) / 100,
      },
      currency: config.currency,
    };
  },
};

export default fareCalculationService;
