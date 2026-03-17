/**
 * SERVER CONFIGURATION
 * --------------------
 * Why: Centralize all config in one place so we can change values without
 * hunting through multiple files. Uses environment variables for secrets
 * and settings that change between development/production.
 * 
 * `dotenv` reads our .env file and puts values into `process.env`.
 */

require('dotenv').config({ path: '../.env' });

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // BMRS Elexon API - the public UK energy data API
  // No API key needed - it's free and open
  bmrs: {
    baseUrl: process.env.BMRS_BASE_URL || 'https://data.elexon.co.uk/bmrs/api/v1',
    
    // Endpoints we'll use:
    // FUELHH = Fuel type half-hourly generation (actual power produced)
    // WINDFOR = Wind forecast data (predicted power)
    endpoints: {
      actualGeneration: '/datasets/FUELHH/stream',
      windForecast: '/datasets/WINDFOR/stream',
    },
  },

  // Python analytics service URL (for advanced stats)
  pythonServiceUrl: `http://localhost:${process.env.PYTHON_SERVICE_PORT || 5001}`,
  
  // Cache settings: store API responses for 5 minutes to avoid
  // hammering the BMRS API and to speed up repeated requests
  cache: {
    ttlSeconds: 300, // 5 minutes
    checkPeriod: 60,  // Check for expired entries every 60 seconds
  },
};
