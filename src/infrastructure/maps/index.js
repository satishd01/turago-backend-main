/**
 * Maps provider factory.
 */

import env from '../../config/env.js';
import { MockMapsProvider } from './MockMapsProvider.js';

/** @type {import('./MapsProvider.js').MapsProvider | null} */
let _instance = null;

/**
 * Returns the configured maps provider singleton.
 * @returns {import('./MapsProvider.js').MapsProvider}
 */
export function getMapsProvider() {
  if (_instance) {
    return _instance;
  }

  const provider = env.providers.maps;

  switch (provider) {
    case 'mock':
      _instance = new MockMapsProvider();
      break;

    // case 'google':
    //   _instance = new GoogleMapsProvider(env.google.mapsApiKey);
    //   break;
    // case 'osrm':
    //   _instance = new OsrmRoutingProvider(env.osrm.baseUrl);
    //   break;

    default:
      throw new Error(`Unknown maps provider: "${provider}". Check MAP_PROVIDER in .env`);
  }

  return _instance;
}
