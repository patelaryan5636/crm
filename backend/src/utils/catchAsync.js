/**
 * CATCH ASYNC — Wrapper for async route handlers
 * Eliminates need for try-catch blocks in every async function
 * Automatically passes errors to Express error handler middleware
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
