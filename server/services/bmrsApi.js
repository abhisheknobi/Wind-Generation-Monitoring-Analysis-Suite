/**
 * BMRS API SERVICE
 * ----------------
 * This service talks to the UK's BMRS (Balancing Mechanism Reporting Service)
 * Elexon API to fetch real energy data.
 * 
 * Two datasets we use:
 * 1. FUELHH (Fuel Half-Hourly) - ACTUAL wind generation (what really happened)
 * 2. WINDFOR (Wind Forecast) - PREDICTED wind generation (what was expected)
 * 
 * The API returns streaming JSON data. We fetch, parse, and return it.
 * 
 * API docs: https://bmrs.elexon.co.uk/api-documentation
 */

const axios = require('axios');
const config = require('../config');

/**
 * Fetch actual wind generation data from FUELHH dataset.
 * 
 * @param {string} from - Start datetime (ISO format)
 * @param {string} to - End datetime (ISO format)
 * @returns {Array} Array of { startTime, generation } objects
 * 
 * HOW IT WORKS:
 * - Calls the FUELHH/stream endpoint with date range
 * - Filters for fuelType === "WIND" (the API also returns gas, nuclear, etc.)
 * - Returns only the fields we need (startTime + generation)
 */
async function fetchActualGeneration(from, to) {
  try {
    const url = `${config.bmrs.baseUrl}${config.bmrs.endpoints.actualGeneration}`;
    
    // The API accepts these query parameters:
    // - from/to: date range
    // - fuelType: filter by fuel source (we want WIND only)
    const response = await axios.get(url, {
      params: {
        from: from,
        to: to,
      },
      timeout: 30000, // 30 second timeout (API can be slow for large date ranges)
    });

    let data = response.data;

    // The API might return data for all fuel types, so we filter for WIND
    if (Array.isArray(data)) {
      data = data.filter(
        (item) => item.fuelType && item.fuelType.toUpperCase() === 'WIND'
      );
    }

    // Map to a clean format - we only need startTime and generation
    return data.map((item) => ({
      startTime: item.startTime,
      generation: item.generation,
      settlementPeriod: item.settlementPeriod,
    }));
  } catch (error) {
    console.error('Error fetching actual generation:', error.message);
    throw new Error(`Failed to fetch actual generation data: ${error.message}`);
  }
}

/**
 * Fetch wind forecast data from WINDFOR dataset.
 * 
 * @param {string} from - Start datetime (ISO format)
 * @param {string} to - End datetime (ISO format)
 * @returns {Array} Array of { startTime, publishTime, generation } objects
 * 
 * HOW IT WORKS:
 * - Calls the WINDFOR/stream endpoint
 * - Returns startTime (when power will be generated), publishTime (when
 *   the forecast was created), and generation (predicted MW)
 * 
 * IMPORTANT: publishTime is when the forecast was MADE, startTime is when
 * the power was predicted FOR. The difference = forecast horizon.
 */
async function fetchWindForecast(from, to) {
  try {
    const url = `${config.bmrs.baseUrl}${config.bmrs.endpoints.windForecast}`;

    const response = await axios.get(url, {
      params: {
        from: from,
        to: to,
      },
      timeout: 30000,
    });

    let data = response.data;

    if (!Array.isArray(data)) {
      return [];
    }

    // Map to clean format with all three key fields
    return data.map((item) => ({
      startTime: item.startTime,
      publishTime: item.publishTime,
      generation: item.generation,
    }));
  } catch (error) {
    console.error('Error fetching wind forecast:', error.message);
    throw new Error(`Failed to fetch wind forecast data: ${error.message}`);
  }
}

module.exports = {
  fetchActualGeneration,
  fetchWindForecast,
};
