/**
 * Location Service.
 * Interfaces with MapsProvider and FareCalculationService.
 */

import { getMapsProvider } from '../../../infrastructure/maps/index.js';
import fareCalculationService from '../../fares/service/fareCalculation.service.js';
import { VEHICLE_TYPE } from '../../../common/constants/index.js';

const locationService = {
  /**
   * Fetches real human-readable address for given coordinates.
   * @param {number} latitude
   * @param {number} longitude
   * @returns {Promise<object>}
   */
  async reverseGeocode(latitude, longitude) {
    const mapsProvider = getMapsProvider();
    const result = await mapsProvider.reverseGeocode(latitude, longitude);
    return {
      latitude,
      longitude,
      address: result.address,
      components: result.components || {},
    };
  },

  /**
   * Returns autocomplete suggestions for place search.
   * @param {string} input
   * @param {{ latitude?: number; longitude?: number }} [userCoords]
   * @returns {Promise<Array<object>>}
   */
  async autocomplete(input, userCoords = {}) {
    const mapsProvider = getMapsProvider();
    if (typeof mapsProvider.autocomplete === 'function') {
      return mapsProvider.autocomplete(input, {
        lat: userCoords.latitude,
        lng: userCoords.longitude,
      });
    }

    const geocoded = await mapsProvider.geocode(input);
    return [
      {
        placeId: `geo_${Date.now()}`,
        title: input,
        description: geocoded.formattedAddress,
        latitude: geocoded.lat,
        longitude: geocoded.lng,
      },
    ];
  },

  /**
   * Returns popular destinations relative to the customer's current coordinates.
   * @param {{ latitude?: number; longitude?: number }} [userCoords]
   * @returns {Promise<Array<object>>}
   */
  async getPopularLocations(userCoords = {}) {
    const mapsProvider = getMapsProvider();
    if (typeof mapsProvider.getPopularLocations === 'function') {
      return mapsProvider.getPopularLocations({
        lat: userCoords.latitude,
        lng: userCoords.longitude,
      });
    }

    // Default fallback list
    return [];
  },

  /**
   * Calculates route details and fare estimates for vehicle types.
   * @param {object} params
   * @param {{ latitude: number; longitude: number }} params.origin
   * @param {{ latitude: number; longitude: number }} params.destination
   * @param {string} [params.vehicleType]
   * @returns {Promise<object>}
   */
  async getDirectionsAndFare({ origin, destination, vehicleType }) {
    const mapsProvider = getMapsProvider();
    const route = await mapsProvider.calculateRoute(
      { lat: origin.latitude, lng: origin.longitude },
      { lat: destination.latitude, lng: destination.longitude }
    );

    const vehicleTypes = vehicleType
      ? [vehicleType]
      : [VEHICLE_TYPE.BIKE, VEHICLE_TYPE.AUTO, VEHICLE_TYPE.CAB];
    const fareEstimates = {};

    for (const vType of vehicleTypes) {
      try {
        const fare = await fareCalculationService.estimateFare({
          vehicleType: vType,
          distanceMeters: route.distanceMeters,
          durationSeconds: route.durationSeconds,
        });
        fareEstimates[vType] = fare;
      } catch {
        // Fallback placeholder if fare config not yet seeded
        fareEstimates[vType] = {
          estimatedFare: vType === VEHICLE_TYPE.BIKE ? 45 : 120,
          currency: 'INR',
        };
      }
    }

    return {
      distanceMeters: route.distanceMeters,
      distanceKm: Math.round((route.distanceMeters / 1000) * 10) / 10,
      durationSeconds: route.durationSeconds,
      durationMinutes: Math.round(route.durationSeconds / 60),
      polyline: route.polyline || null,
      fareEstimates,
    };
  },
};

export default locationService;
