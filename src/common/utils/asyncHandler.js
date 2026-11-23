/**
 * Async handler wrapper.
 * Wraps an async route handler so unhandled promise rejections are
 * automatically forwarded to Express's error-handling middleware via next().
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 *
 * @param {Function} fn - Async Express route handler
 * @returns {Function} Express-compatible handler
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
