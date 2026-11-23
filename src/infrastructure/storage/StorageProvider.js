/**
 * Storage Provider abstraction.
 * Handles file uploads (driver documents, profile photos, etc.).
 */

export class StorageProvider {
  /**
   * Uploads a file buffer.
   * @param {object} options
   * @param {Buffer} options.buffer - File data
   * @param {string} options.filename - Target filename
   * @param {string} options.mimeType
   * @param {string} [options.folder] - Sub-folder / prefix
   * @returns {Promise<{ url: string; key: string }>}
   */
  // eslint-disable-next-line no-unused-vars
  async upload(options) {
    throw new Error('StorageProvider.upload() must be implemented');
  }

  /**
   * Deletes a stored file.
   * @param {string} key - The key/path of the file to delete
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async delete(key) {
    throw new Error('StorageProvider.delete() must be implemented');
  }

  /**
   * Returns a public or pre-signed URL for a stored file.
   * @param {string} key
   * @param {number} [expirySeconds]
   * @returns {Promise<string>}
   */
  // eslint-disable-next-line no-unused-vars
  async getUrl(key, expirySeconds) {
    throw new Error('StorageProvider.getUrl() must be implemented');
  }
}
