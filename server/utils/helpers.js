/**
 * HELPER UTILITIES
 * ----------------
 * Small reusable functions used across the server.
 */

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

/**
 * Format a date to ISO string in UTC.
 * Why UTC? The BMRS API uses UTC timestamps. Mixing timezones
 * is the #1 source of bugs in energy data apps.
 */
function toUTCString(date) {
  return dayjs(date).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
}

/**
 * Create a cache key from request parameters.
 * We combine all params into a single string so we can store/retrieve
 * cached responses efficiently.
 */
function createCacheKey(prefix, params) {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return `${prefix}:${sortedParams}`;
}

/**
 * Standard error response format.
 * Always return errors in the same shape so the frontend knows what to expect.
 */
function errorResponse(res, statusCode, message, details = null) {
  const response = { error: true, message };
  if (details) response.details = details;
  return res.status(statusCode).json(response);
}

module.exports = {
  toUTCString,
  createCacheKey,
  errorResponse,
};
