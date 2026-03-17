/**
 * ANALYTICS ROUTES
 * ----------------
 * These routes proxy requests to the Python analytics service.
 * 
 * WHY A SEPARATE PYTHON SERVICE?
 * Python has much better libraries for statistical analysis (numpy, pandas, scipy).
 * Node.js is great for I/O and serving APIs, but Python is better for math.
 * So we use Node as the main API, and call Python for heavy analysis.
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('../config');
const { errorResponse } = require('../utils/helpers');

/**
 * GET /api/analytics/error-analysis
 * 
 * Proxies to the Python service for detailed error analysis.
 * The Python service calculates things like:
 * - Error distribution
 * - Error by time of day
 * - Error vs forecast horizon
 */
router.get('/error-analysis', async (req, res) => {
  try {
    const { from, to, horizon = 4 } = req.query;

    const response = await axios.get(
      `${config.pythonServiceUrl}/api/analysis/error`,
      { params: { from, to, horizon }, timeout: 60000 }
    );

    res.json(response.data);
  } catch (error) {
    // If Python service is down, return a helpful error
    if (error.code === 'ECONNREFUSED') {
      return errorResponse(
        res, 503,
        'Analytics service is not running. Start it with: cd python-analytics && python app.py'
      );
    }
    errorResponse(res, 500, 'Analytics request failed', error.message);
  }
});

/**
 * GET /api/analytics/reliability
 * 
 * Analyzes how reliably wind can meet electricity demand.
 */
router.get('/reliability', async (req, res) => {
  try {
    const response = await axios.get(
      `${config.pythonServiceUrl}/api/analysis/reliability`,
      { params: req.query, timeout: 60000 }
    );
    res.json(response.data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return errorResponse(res, 503, 'Analytics service is not running');
    }
    errorResponse(res, 500, 'Analytics request failed', error.message);
  }
});

module.exports = router;
