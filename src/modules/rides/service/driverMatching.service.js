/**
 * Driver Matching Service.
 *
 * Finds and ranks candidate drivers for a new ride request.
 * The matching algorithm is intentionally basic for MVP.
 * The final algorithm will be defined by the business team.
 *
 * Do NOT hard-code:
 *   - Search radius (use env.driverMatching.searchRadiusMeters)
 *   - Max candidates (use env.driverMatching.maxCandidates)
 *   - Ranking criteria (business not finalized)
 *   - Surge/priority logic
 *
 * Architecture:
 *   RideService → DriverMatchingService → DriverRepository
 */

import driverRepository from '../../drivers/repository/driver.repository.js';
import env from '../../../config/env.js';
import logger from '../../../config/logger.js';

const driverMatchingService = {
  /**
   * Finds candidate drivers near the pickup location.
   *
   * @param {object} options
   * @param {number} options.longitude
   * @param {number} options.latitude
   * @param {string} options.vehicleType
   * @param {number} [options.radiusMeters] - Override default search radius
   * @returns {Promise<import('mongoose').Document[]>} Ordered by proximity (MongoDB $nearSphere)
   */
  async findCandidates({ longitude, latitude, vehicleType, radiusMeters }) {
    const searchRadius = radiusMeters ?? env.driverMatching.searchRadiusMeters;
    const maxCandidates = env.driverMatching.maxCandidates;

    logger.debug(
      {
        event: 'driver_search_started',
        longitude,
        latitude,
        vehicleType,
        searchRadius,
        maxCandidates,
      },
      'Searching for driver candidates'
    );

    const candidates = await driverRepository.findNearbyAvailable({
      longitude,
      latitude,
      maxDistanceMeters: searchRadius,
      vehicleType,
      limit: maxCandidates,
    });

    logger.info(
      { event: 'driver_candidates_found', count: candidates.length },
      `Found ${candidates.length} driver candidates`
    );

    return candidates;
  },

  /**
   * Ranks candidate drivers.
   *
   * MVP: Returns candidates as-is (already sorted by proximity via $nearSphere).
   *
   * Future criteria to implement (pending business confirmation):
   *   - Driver rating
   *   - Acceptance rate
   *   - Last ride completion time
   *   - Priority tier
   *
   * @param {import('mongoose').Document[]} candidates
   * @returns {import('mongoose').Document[]}
   */
  rankCandidates(candidates) {
    // MVP: proximity-based ranking is already applied by MongoDB
    // TODO: Add rating-weighted ranking when business confirms algorithm
    return candidates;
  },

  /**
   * Selects the best driver from the ranked candidate list.
   * MVP: Returns the first candidate (nearest driver).
   *
   * @param {import('mongoose').Document[]} rankedCandidates
   * @returns {import('mongoose').Document | null}
   */
  selectDriver(rankedCandidates) {
    if (!rankedCandidates || rankedCandidates.length === 0) {
      return null;
    }
    // MVP: select nearest
    return rankedCandidates[0];
  },

  /**
   * End-to-end: find, rank, and select a driver for a pickup location.
   *
   * @param {object} options
   * @param {number} options.longitude
   * @param {number} options.latitude
   * @param {string} options.vehicleType
   * @returns {Promise<import('mongoose').Document | null>} Selected driver or null if none found
   */
  async assignDriver({ longitude, latitude, vehicleType }) {
    const candidates = await this.findCandidates({ longitude, latitude, vehicleType });
    const ranked = this.rankCandidates(candidates);
    return this.selectDriver(ranked);
  },
};

export default driverMatchingService;
