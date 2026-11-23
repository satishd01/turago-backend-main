/**
 * Google Maps Provider with Live Geocoding & Routing.
 *
 * 1. Attempts Google Maps APIs with the provided API key.
 * 2. If Google returns REQUEST_DENIED (e.g. Google Cloud billing not enabled),
 *    it automatically queries OpenStreetMap Nominatim & OSRM for 100% REAL,
 *    live global addresses, places search, and actual driving road distance!
 */

import { MapsProvider } from './MapsProvider.js';
import logger from '../../config/logger.js';

// Curated popular locations matching Turago mobile client UI (Kolkata)
export const CURATED_LOCATIONS = [
  {
    placeId: 'howrah_station_01',
    title: 'Howrah Railway Station',
    description: 'Howrah, West Bengal, India',
    latitude: 22.5839,
    longitude: 88.3426,
    category: 'TRANSIT',
  },
  {
    placeId: 'sealdah_station_02',
    title: 'Sealdah Railway Station',
    description: 'Sealdah, Kolkata, West Bengal',
    latitude: 22.5674,
    longitude: 88.3712,
    category: 'TRANSIT',
  },
  {
    placeId: 'victoria_memorial_03',
    title: 'Victoria Memorial',
    description: 'Maidan, Kolkata, West Bengal',
    latitude: 22.5448,
    longitude: 88.3426,
    category: 'MONUMENT',
  },
  {
    placeId: 'park_street_04',
    title: 'Park Street',
    description: 'Park Street, Kolkata, West Bengal',
    latitude: 22.5535,
    longitude: 88.3524,
    category: 'COMMERCIAL',
  },
  {
    placeId: 'new_town_05',
    title: 'New Town',
    description: 'New Town, Kolkata, West Bengal',
    latitude: 22.5867,
    longitude: 88.4754,
    category: 'COMMERCIAL',
  },
  {
    placeId: 'kolkata_airport_06',
    title: 'Netaji Subhas Chandra Bose Airport',
    description: 'Dum Dum, Kolkata, West Bengal',
    latitude: 22.6547,
    longitude: 88.4467,
    category: 'AIRPORT',
  },
  {
    placeId: 'salt_lake_sec_v_07',
    title: 'Salt Lake Sector V',
    description: 'Bidhannagar, Kolkata, West Bengal',
    latitude: 22.5736,
    longitude: 88.4332,
    category: 'TECH_HUB',
  },
];

/**
 * Calculates Haversine distance in meters between two coordinates.
 */
export function haversineDistanceMeters(a, b) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aVal =
    sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
}

export class GoogleMapsProvider extends MapsProvider {
  /**
   * @param {string} apiKey
   */
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.googleBaseUrl = 'https://maps.googleapis.com/maps/api';
  }

  /**
   * Converts real GPS coordinates to a real street address.
   * @param {number} lat
   * @param {number} lng
   * @returns {Promise<{ address: string; components?: object }>}
   */
  async reverseGeocode(lat, lng) {
    // 1. Try Google Geocoding API
    if (this.apiKey) {
      try {
        const url = `${this.googleBaseUrl}/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`;
        const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          return {
            address: data.results[0].formatted_address,
            components: data.results[0].address_components,
            placeId: data.results[0].place_id,
          };
        }
      } catch (err) {
        logger.debug({ error: err.message }, 'Google reverse geocode failed');
      }
    }

    // 2. Query OpenStreetMap Nominatim for REAL live global address
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const response = await fetch(osmUrl, {
        headers: { 'User-Agent': 'TuragoApp/1.0' },
        signal: AbortSignal.timeout(4000),
      });
      const data = await response.json();
      if (data && data.display_name) {
        return {
          address: data.display_name,
          components: data.address || {},
          placeId: `osm_${data.place_id || Date.now()}`,
        };
      }
    } catch (err) {
      logger.debug({ error: err.message }, 'OSM reverse geocode failed');
    }

    // 3. Fallback to closest curated landmark
    const closest = this._findClosestCuratedLocation(lat, lng);
    if (closest && closest.distanceMeters < 3000) {
      return {
        address: `Near ${closest.title}, ${closest.description}`,
        components: { landmark: closest.title },
      };
    }

    return {
      address: `Location at (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      components: {},
    };
  }

  /**
   * Converts an address string to real coordinates.
   * @param {string} address
   * @returns {Promise<{ lat: number; lng: number; formattedAddress: string }>}
   */
  async geocode(address) {
    // 1. Try Google Geocoding
    if (this.apiKey) {
      try {
        const url = `${this.googleBaseUrl}/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`;
        const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const loc = data.results[0].geometry.location;
          return {
            lat: loc.lat,
            lng: loc.lng,
            formattedAddress: data.results[0].formatted_address,
          };
        }
      } catch (err) {
        logger.debug({ error: err.message }, 'Google geocode failed');
      }
    }

    // 2. Query OpenStreetMap Nominatim search
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&countrycodes=in&limit=1`;
      const response = await fetch(osmUrl, {
        headers: { 'User-Agent': 'TuragoApp/1.0' },
        signal: AbortSignal.timeout(4000),
      });
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          formattedAddress: data[0].display_name,
        };
      }
    } catch (err) {
      logger.debug({ error: err.message }, 'OSM geocode failed');
    }

    // 3. Curated match
    const q = address.toLowerCase();
    const match = CURATED_LOCATIONS.find(
      (loc) => loc.title.toLowerCase().includes(q) || loc.description.toLowerCase().includes(q)
    );
    if (match) {
      return {
        lat: match.latitude,
        lng: match.longitude,
        formattedAddress: `${match.title}, ${match.description}`,
      };
    }

    return { lat: 22.5726, lng: 88.3639, formattedAddress: address };
  }

  /**
   * Calculates real driving road distance & time between origin and destination.
   * @param {{ lat: number; lng: number }} origin
   * @param {{ lat: number; lng: number }} destination
   * @returns {Promise<{ distanceMeters: number; durationSeconds: number; polyline?: string }>}
   */
  async calculateRoute(origin, destination) {
    // 1. Try Google Directions
    if (this.apiKey) {
      try {
        const url = `${this.googleBaseUrl}/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=driving&key=${this.apiKey}`;
        const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
        const data = await response.json();

        if (data.status === 'OK' && data.routes && data.routes.length > 0) {
          const leg = data.routes[0].legs[0];
          return {
            distanceMeters: leg.distance.value,
            durationSeconds: leg.duration.value,
            polyline: data.routes[0].overview_polyline?.points || null,
          };
        }
      } catch (err) {
        logger.debug({ error: err.message }, 'Google Directions failed');
      }
    }

    // 2. Query OSRM for REAL live road driving distance and duration
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`;
      const response = await fetch(osrmUrl, { signal: AbortSignal.timeout(4000) });
      const data = await response.json();

      if (data && data.routes && data.routes.length > 0) {
        return {
          distanceMeters: Math.round(data.routes[0].distance),
          durationSeconds: Math.round(data.routes[0].duration),
          polyline: null,
        };
      }
    } catch (err) {
      logger.debug({ error: err.message }, 'OSRM route calculation failed');
    }

    // 3. Haversine with road driving factor
    const directMeters = haversineDistanceMeters(origin, destination);
    const roadDistanceMeters = Math.round(directMeters * 1.25);
    const durationSeconds = Math.max(180, Math.round((roadDistanceMeters / 1000 / 28) * 3600));

    return {
      distanceMeters: roadDistanceMeters,
      durationSeconds,
      polyline: null,
    };
  }

  /**
   * Straight-line distance.
   */
  async calculateDistance(pointA, pointB) {
    return {
      distanceMeters: Math.round(haversineDistanceMeters(pointA, pointB)),
    };
  }

  /**
   * Places autocomplete suggestions.
   * @param {string} input
   * @param {{ lat?: number; lng?: number }} [biasCoords]
   */
  async autocomplete(input, biasCoords = {}) {
    // 1. Try Google Places
    if (this.apiKey && input && input.trim().length > 1) {
      try {
        let url = `${this.googleBaseUrl}/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${this.apiKey}&components=country:in`;
        if (biasCoords.lat && biasCoords.lng) {
          url += `&location=${biasCoords.lat},${biasCoords.lng}&radius=25000`;
        }
        const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
        const data = await response.json();
        if (data.status === 'OK' && data.predictions) {
          return data.predictions.map((p) => ({
            placeId: p.place_id,
            title: p.structured_formatting?.main_text || p.description,
            description: p.description,
          }));
        }
      } catch (err) {
        logger.debug({ error: err.message }, 'Google Places autocomplete failed');
      }
    }

    // 2. Query OpenStreetMap live places search
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json&countrycodes=in&limit=5`;
      const response = await fetch(osmUrl, {
        headers: { 'User-Agent': 'TuragoApp/1.0' },
        signal: AbortSignal.timeout(4000),
      });
      const data = await response.json();
      if (data && data.length > 0) {
        return data.map((item) => ({
          placeId: `osm_${item.place_id}`,
          title: item.display_name.split(',')[0],
          description: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        }));
      }
    } catch (err) {
      logger.debug({ error: err.message }, 'OSM autocomplete failed');
    }

    // 3. Curated filter
    const q = (input || '').toLowerCase().trim();
    return CURATED_LOCATIONS.filter(
      (loc) => loc.title.toLowerCase().includes(q) || loc.description.toLowerCase().includes(q)
    ).map((loc) => ({
      placeId: loc.placeId,
      title: loc.title,
      description: loc.description,
      latitude: loc.latitude,
      longitude: loc.longitude,
    }));
  }

  /**
   * Returns popular destinations relative to the customer's coordinates.
   */
  getPopularLocations(userCoords = {}) {
    return CURATED_LOCATIONS.map((loc) => {
      let distanceKm = null;
      let durationMinutes = null;

      if (userCoords.lat && userCoords.lng) {
        const meters = haversineDistanceMeters(
          { lat: Number(userCoords.lat), lng: Number(userCoords.lng) },
          { lat: loc.latitude, lng: loc.longitude }
        );
        distanceKm = Math.round((meters / 1000) * 10) / 10;
        durationMinutes = Math.max(5, Math.round((distanceKm / 28) * 60));
      }

      return {
        ...loc,
        distanceKm,
        durationMinutes,
      };
    }).sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      return 0;
    });
  }

  _findClosestCuratedLocation(lat, lng) {
    let closest = null;
    let minDistance = Infinity;

    for (const loc of CURATED_LOCATIONS) {
      const dist = haversineDistanceMeters(
        { lat, lng },
        { lat: loc.latitude, lng: loc.longitude }
      );
      if (dist < minDistance) {
        minDistance = dist;
        closest = { ...loc, distanceMeters: dist };
      }
    }

    return closest;
  }
}
