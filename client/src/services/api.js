/**
 * API SERVICE
 * ───────────
 * Handles all HTTP communication between React frontend and Node.js backend.
 * 
 * WHY A SEPARATE SERVICE FILE?
 * Instead of scattering API calls throughout components, we centralize them.
 * Benefits:
 * 1. One place to change if the API URL changes
 * 2. Consistent error handling
 * 3. Components stay clean — they call `api.getCombinedData()` instead
 *    of knowing about axios, URLs, params, etc.
 * 
 * WHAT IS AXIOS?
 * Axios is an HTTP client library. It's like the browser's `fetch()` but with:
 * - Automatic JSON parsing
 * - Request/response interceptors
 * - Better error handling
 * - Request cancellation
 */

import axios from 'axios';

// Base URL for our Node.js API
// In development: React runs on :3000, API on :5000
// Vite's dev server proxies /api/* requests to :5000 (see vite.config.js)
// Vite uses import.meta.env instead of process.env for env variables
const API_BASE = import.meta.env.VITE_API_URL || '';

// Create a configured axios instance
const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // 60 second timeout for large data requests
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch combined actual + forecast data (the main endpoint).
 * 
 * @param {string} from - Start date (ISO format)
 * @param {string} to - End date (ISO format)
 * @param {number} horizon - Forecast horizon in hours
 * @returns {Object} { chartData, stats }
 */
export async function getCombinedData(from, to, horizon = 4) {
  try {
    const response = await api.get('/api/generation/combined', {
      params: { from, to, horizon },
    });
    return response.data;
  } catch (error) {
    console.error('API Error (combined data):', error);
    throw handleApiError(error);
  }
}

/**
 * Fetch actual generation data only.
 */
export async function getActualGeneration(from, to) {
  try {
    const response = await api.get('/api/generation/actual', {
      params: { from, to },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Fetch forecast data only.
 */
export async function getForecastData(from, to, horizon = 4) {
  try {
    const response = await api.get('/api/generation/forecast', {
      params: { from, to, horizon },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Fetch error analysis from Python analytics service.
 */
export async function getErrorAnalysis(from, to, horizon = 4) {
  try {
    const response = await api.get('/api/analytics/error-analysis', {
      params: { from, to, horizon },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Fetch reliability analysis.
 */
export async function getReliabilityAnalysis() {
  try {
    const response = await api.get('/api/analytics/reliability');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Check if the API server is healthy.
 */
export async function checkHealth() {
  try {
    const response = await api.get('/api/health');
    return response.data;
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

/**
 * Centralized error handler.
 * Converts axios errors into user-friendly messages.
 */
function handleApiError(error) {
  if (error.response) {
    // Server responded with an error status (4xx, 5xx)
    return new Error(
      error.response.data?.message || `Server error: ${error.response.status}`
    );
  } else if (error.request) {
    // Request was sent but no response received
    return new Error(
      'Cannot connect to the server. Is the backend running on port 5000?'
    );
  } else {
    // Error in setting up the request
    return new Error(error.message);
  }
}

export default api;
