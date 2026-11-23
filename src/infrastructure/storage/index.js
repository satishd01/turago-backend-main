/**
 * Storage provider factory.
 */

import env from '../../config/env.js';
import { LocalStorageProvider } from './LocalStorageProvider.js';

/** @type {import('./StorageProvider.js').StorageProvider | null} */
let _instance = null;

/**
 * @returns {import('./StorageProvider.js').StorageProvider}
 */
export function getStorageProvider() {
  if (_instance) {
    return _instance;
  }

  switch (env.providers.storage) {
    case 'local':
      _instance = new LocalStorageProvider();
      break;

    // case 's3':
    //   _instance = new S3StorageProvider(env.storage);
    //   break;
    // case 'cloudinary':
    //   _instance = new CloudinaryStorageProvider(env.cloudinary);
    //   break;

    default:
      throw new Error(`Unknown storage provider: "${env.providers.storage}"`);
  }

  return _instance;
}
