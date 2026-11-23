/**
 * Maps Provider abstraction.
 *
 * All map/routing providers must implement this interface.
 * Business modules depend only on MapsProvider — never on a concrete SDK.
 */

export class MapsProvider {
  /**
   * Converts an address string to coordinates.
   * @param {string} address
   * @returns {Promise<{ lat: number; lng: number; formattedAddress: string }>}
   */
  // eslint-disable-next-line no-unused-vars
  async geocode(address) {
    throw new Error('MapsProvider.geocode() must be implemented');
  }

  /**
   * Converts coordinates to a human-readable address.
   * @param {number} lat
   * @param {number} lng
   * @returns {Promise<{ address: string; components: object }>}
   */
  // eslint-disable-next-line no-unused-vars
  async reverseGeocode(lat, lng) {
    throw new Error('MapsProvider.reverseGeocode() must be implemented');
  }

  /**
   * Calculates route information between two points.
   * @param {{ lat: number; lng: number }} origin
   * @param {{ lat: number; lng: number }} destination
   * @returns {Promise<{ distanceMeters: number; durationSeconds: number; polyline?: string }>}
   */
  // eslint-disable-next-line no-unused-vars
  async calculateRoute(origin, destination) {
    throw new Error('MapsProvider.calculateRoute() must be implemented');
  }

  /**
   * Calculates straight-line distance between two coordinates.
   * @param {{ lat: number; lng: number }} pointA
   * @param {{ lat: number; lng: number }} pointB
   * @returns {Promise<{ distanceMeters: number }>}
   */
  // eslint-disable-next-line no-unused-vars
  async calculateDistance(pointA, pointB) {
    throw new Error('MapsProvider.calculateDistance() must be implemented');
  }
}
