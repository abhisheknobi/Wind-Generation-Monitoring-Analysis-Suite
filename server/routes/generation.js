/**
 * GENERATION ROUTES
 * -----------------
 * These Express routes handle requests for wind generation data.
 * 
 * HOW EXPRESS ROUTING WORKS:
 * 1. The frontend makes an HTTP request (e.g., GET /api/generation?from=...&to=...)
 * 2. Express matches the URL to a route handler function
 * 3. The handler calls our services to fetch/process data
 * 4. The handler sends back a JSON response
 * 
 * Think of routes as the "menu" of your API - they define what
 * endpoints exist and what each one does.
 */

const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const config = require('../config');
const { fetchActualGeneration, fetchWindForecast } = require('../services/bmrsApi');
const { selectForecastsByHorizon, combineData, calculateStats } = require('../services/dataProcessor');
const { createCacheKey, errorResponse } = require('../utils/helpers');

// In-memory cache - stores API responses to avoid re-fetching
// TTL = Time To Live (how long data stays cached before expiring)
const cache = new NodeCache({
  stdTTL: config.cache.ttlSeconds,
  checkperiod: config.cache.checkPeriod,
});

/**
 * GET /api/generation/actual
 * 
 * Returns actual wind generation data for a date range.
 * Query params: from, to (ISO date strings)
 * 
 * Example: GET /api/generation/actual?from=2025-01-01&to=2025-01-07
 */
router.get('/actual', async (req, res) => {
  try {
    const { from, to } = req.query;

    // Validate required parameters
    if (!from || !to) {
      return errorResponse(res, 400, 'Missing required parameters: from, to');
    }

    // Check cache first - if we already fetched this data recently, return it
    const cacheKey = createCacheKey('actual', { from, to });
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ data: cached, cached: true });
    }

    // Fetch from BMRS API
    const data = await fetchActualGeneration(from, to);

    // Store in cache for next time
    cache.set(cacheKey, data);

    res.json({ data, cached: false });
  } catch (error) {
    console.error('Route error - actual generation:', error.message);
    errorResponse(res, 500, 'Failed to fetch actual generation data', error.message);
  }
});

/**
 * GET /api/generation/forecast
 * 
 * Returns forecast data, filtered by forecast horizon.
 * Query params: from, to (ISO dates), horizon (hours, default 4)
 * 
 * Example: GET /api/generation/forecast?from=2025-01-01&to=2025-01-07&horizon=4
 */
router.get('/forecast', async (req, res) => {
  try {
    const { from, to, horizon = 4 } = req.query;

    if (!from || !to) {
      return errorResponse(res, 400, 'Missing required parameters: from, to');
    }

    const horizonHours = parseFloat(horizon);
    if (isNaN(horizonHours) || horizonHours < 0 || horizonHours > 48) {
      return errorResponse(res, 400, 'Horizon must be between 0 and 48 hours');
    }

    const cacheKey = createCacheKey('forecast', { from, to, horizon: horizonHours });
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ data: cached, cached: true });
    }

    // Fetch raw forecasts from BMRS
    const rawForecasts = await fetchWindForecast(from, to);

    // Apply horizon filtering - this picks the best forecast for each time
    const processed = selectForecastsByHorizon(rawForecasts, horizonHours);

    cache.set(cacheKey, processed);

    res.json({ data: processed, cached: false });
  } catch (error) {
    console.error('Route error - forecast:', error.message);
    errorResponse(res, 500, 'Failed to fetch forecast data', error.message);
  }
});

/**
 * GET /api/generation/combined
 * 
 * THE MAIN ENDPOINT - Returns combined actual + forecast data ready for charting.
 * Also includes error statistics.
 * 
 * Query params: from, to, horizon
 * 
 * Response shape:
 * {
 *   chartData: [{ time, actual, forecast }, ...],
 *   stats: { mae, rmse, mape, bias, count, ... }
 * }
 */
router.get('/combined', async (req, res) => {
  try {
    const { from, to, horizon = 4 } = req.query;

    if (!from || !to) {
      return errorResponse(res, 400, 'Missing required parameters: from, to');
    }

    const horizonHours = parseFloat(horizon);

    const cacheKey = createCacheKey('combined', { from, to, horizon: horizonHours });
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    // Fetch both datasets in parallel for speed
    // Promise.all runs both API calls simultaneously instead of one-after-another
    const [actuals, rawForecasts] = await Promise.all([
      fetchActualGeneration(from, to),
      fetchWindForecast(from, to),
    ]);

    // Process forecasts with horizon filter
    const processedForecasts = selectForecastsByHorizon(rawForecasts, horizonHours);

    // Merge into chart-ready format
    const chartData = combineData(actuals, processedForecasts);

    // Calculate accuracy metrics
    const stats = calculateStats(chartData);

    const result = { chartData, stats };
    cache.set(cacheKey, result);

    res.json({ ...result, cached: false });
  } catch (error) {
    console.error('Route error - combined:', error.message);
    errorResponse(res, 500, 'Failed to fetch combined data', error.message);
  }
});

module.exports = router;
