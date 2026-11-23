/**
 * Local Storage Provider — saves files to the local filesystem.
 * For development use. In production, use S3 or Cloudinary.
 */

import { StorageProvider } from './StorageProvider.js';
import { writeFile, unlink, access } from 'fs/promises';
import { join } from 'path';
import env from '../../config/env.js';
import logger from '../../config/logger.js';

export class LocalStorageProvider extends StorageProvider {
  constructor() {
    super();
    this.basePath = env.storage.localPath ?? './uploads';
  }

  async upload({ buffer, filename, folder = '' }) {
    const targetDir = join(this.basePath, folder);
    const key = folder ? `${folder}/${filename}` : filename;
    const filePath = join(this.basePath, key);

    try {
      // Ensure directory exists (mkdirSync equiv — use mkdir recursively)
      const { mkdir } = await import('fs/promises');
      await mkdir(targetDir, { recursive: true });
      await writeFile(filePath, buffer);

      logger.info({ event: 'storage_upload', key }, 'File uploaded to local storage');

      return {
        url: `/uploads/${key}`,
        key,
      };
    } catch (err) {
      logger.error({ event: 'storage_upload_error', error: err.message }, 'Local storage upload failed');
      throw err;
    }
  }

  async delete(key) {
    const filePath = join(this.basePath, key);
    try {
      await access(filePath);
      await unlink(filePath);
    } catch {
      // File doesn't exist — treat as success
    }
  }

  async getUrl(key) {
    return `/uploads/${key}`;
  }
}
