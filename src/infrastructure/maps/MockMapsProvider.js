/**
 * Mock Maps Provider — for development and testing.
 * Returns deterministic placeholder values.
 * Replace with OsmMapsProvider / GoogleMapsProvider for production.
 */

import { MapsProvider } from './MapsProvider.js';

/**
 * Haversine formula — straight-line distance between two lat/lng points.
 * @param {{ lat: number; lng: number }} a
 * @param {{ lat: number; lng: number }} b
 * @returns {number} Distance in meters
 */
function haversineDistanceMeters(a, b) {
  const R = 6371000; // Earth radius in metres
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const aVal =
    sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;

  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
}

export class MockMapsProvider extends MapsProvider {
  async geocode(address) {
    return {
      lat: 18.5204,
      lng: 73.8567,
      formattedAddress: address,
    };
  }

  async reverseGeocode(lat, lng) {
    return {
      address: `Mock Address at (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      components: { city: 'Pune', country: 'India' },
    };
  }

  async calculateRoute(origin, destination) {
    const distanceMeters = haversineDistanceMeters(origin, destination);
    // Rough estimate: average speed of 30 km/h in city traffic
    const durationSeconds = Math.round((distanceMeters / 1000 / 30) * 3600);

    return {
      distanceMeters: Math.round(distanceMeters),
      durationSeconds,
      polyline: null, // No polyline in mock
    };
  }

  async calculateDistance(pointA, pointB) {
    return {
      distanceMeters: Math.round(haversineDistanceMeters(pointA, pointB)),
    };
  }
}
