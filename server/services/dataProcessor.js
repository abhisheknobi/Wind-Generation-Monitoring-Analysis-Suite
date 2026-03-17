/**
 * DATA PROCESSOR SERVICE
 * ----------------------
 * This is the BRAIN of the backend. It takes raw data from the BMRS API
 * and processes it into a format the frontend chart can display.
 * 
 * KEY CONCEPT: Forecast Horizon
 * ─────────────────────────────
 * The "forecast horizon" is how far in advance a forecast was made.
 * 
 * Example with 4-hour horizon:
 *   Target time: 18:00 (when power is actually generated)
 *   We want the latest forecast made BEFORE 14:00 (18:00 - 4 hours)
 *   
 *   If forecasts were published at 10:00, 12:00, 13:30, 15:00:
 *   → We pick 13:30 (latest one before 14:00 cutoff)
 *   → We SKIP the 15:00 forecast (too recent, doesn't meet 4hr horizon)
 * 
 * WHY? This simulates real-world decision making. Grid operators need
 * forecasts made far enough in advance to plan. A forecast made 5 minutes
 * before isn't useful for planning.
 */

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

/**
 * Process forecast data to select the best forecast for each target time
 * based on the forecast horizon.
 * 
 * @param {Array} forecasts - Raw forecast data from BMRS
 * @param {number} horizonHours - Minimum hours before target time (default: 4)
 * @returns {Array} One forecast per target time (the latest valid one)
 */
function selectForecastsByHorizon(forecasts, horizonHours = 4) {
  // Step 1: Group all forecasts by their target time (startTime)
  // Each target time might have multiple forecasts made at different times
  const grouped = {};

  for (const forecast of forecasts) {
    const targetTime = forecast.startTime;
    if (!grouped[targetTime]) {
      grouped[targetTime] = [];
    }
    grouped[targetTime].push(forecast);
  }

  // Step 2: For each target time, find the best forecast
  const selected = [];

  for (const [targetTime, forecastGroup] of Object.entries(grouped)) {
    const targetMoment = dayjs.utc(targetTime);
    // The cutoff = target time minus horizon
    // Any forecast published AFTER this cutoff is too recent
    const cutoffTime = targetMoment.subtract(horizonHours, 'hour');

    // Filter: only keep forecasts published before the cutoff
    const validForecasts = forecastGroup.filter((f) => {
      const publishMoment = dayjs.utc(f.publishTime);
      return publishMoment.isBefore(cutoffTime) || publishMoment.isSame(cutoffTime);
    });

    // Also filter: forecast horizon must be between 0-48 hours
    const withinRange = validForecasts.filter((f) => {
      const publishMoment = dayjs.utc(f.publishTime);
      const horizonMs = targetMoment.diff(publishMoment);
      const horizonHrs = horizonMs / (1000 * 60 * 60);
      return horizonHrs >= 0 && horizonHrs <= 48;
    });

    if (withinRange.length === 0) continue; // No valid forecast for this time

    // Pick the LATEST valid forecast (most recent prediction that still
    // meets the horizon requirement = most accurate available)
    withinRange.sort(
      (a, b) => dayjs.utc(b.publishTime).valueOf() - dayjs.utc(a.publishTime).valueOf()
    );

    selected.push({
      startTime: targetTime,
      publishTime: withinRange[0].publishTime,
      generation: withinRange[0].generation,
    });
  }

  // Sort by time so the chart displays chronologically
  selected.sort((a, b) => dayjs.utc(a.startTime).valueOf() - dayjs.utc(b.startTime).valueOf());

  return selected;
}

/**
 * Combine actual generation and forecast data into a single dataset
 * that the frontend chart can plot with two lines.
 * 
 * @param {Array} actuals - Actual generation data
 * @param {Array} forecasts - Processed forecast data (after horizon selection)
 * @returns {Array} Combined data with { time, actual, forecast } objects
 * 
 * HOW IT WORKS:
 * - Creates a map of all unique timestamps
 * - For each timestamp, includes both actual and forecast values (if available)
 * - If a timestamp only has actual OR forecast, the other is null
 * - This lets the chart draw both lines even when they don't perfectly align
 */
function combineData(actuals, forecasts) {
  const combined = {};

  // Add actuals
  for (const item of actuals) {
    const time = item.startTime;
    if (!combined[time]) {
      combined[time] = { time, actual: null, forecast: null };
    }
    combined[time].actual = item.generation;
  }

  // Add forecasts
  for (const item of forecasts) {
    const time = item.startTime;
    if (!combined[time]) {
      combined[time] = { time, actual: null, forecast: null };
    }
    combined[time].forecast = item.generation;
    combined[time].publishTime = item.publishTime;
  }

  // Convert to array and sort by time
  return Object.values(combined).sort(
    (a, b) => dayjs.utc(a.time).valueOf() - dayjs.utc(b.time).valueOf()
  );
}

/**
 * Calculate error statistics between actual and forecast values.
 * These help quantify how accurate the forecasts are.
 * 
 * Metrics explained:
 * - MAE (Mean Absolute Error): Average size of errors, ignoring direction
 * - RMSE (Root Mean Squared Error): Like MAE but penalizes big errors more
 * - MAPE (Mean Absolute Percentage Error): Error as a percentage
 * - Bias: Average error WITH direction (positive = over-predicting)
 */
function calculateStats(combinedData) {
  // Only use data points where we have BOTH actual and forecast
  const paired = combinedData.filter(
    (d) => d.actual !== null && d.forecast !== null
  );

  if (paired.length === 0) {
    return { mae: 0, rmse: 0, mape: 0, bias: 0, count: 0 };
  }

  let sumAbsError = 0;
  let sumSquaredError = 0;
  let sumPercentError = 0;
  let sumError = 0;
  let percentCount = 0;

  for (const point of paired) {
    const error = point.forecast - point.actual; // positive = over-forecast
    const absError = Math.abs(error);

    sumAbsError += absError;
    sumSquaredError += error * error;
    sumError += error;

    // Only calculate percentage error when actual > 0 (avoid divide by zero)
    if (point.actual > 0) {
      sumPercentError += (absError / point.actual) * 100;
      percentCount++;
    }
  }

  const n = paired.length;

  return {
    mae: Math.round((sumAbsError / n) * 100) / 100,
    rmse: Math.round(Math.sqrt(sumSquaredError / n) * 100) / 100,
    mape: percentCount > 0
      ? Math.round((sumPercentError / percentCount) * 100) / 100
      : 0,
    bias: Math.round((sumError / n) * 100) / 100,
    count: n,
    maxActual: Math.max(...paired.map((d) => d.actual)),
    minActual: Math.min(...paired.map((d) => d.actual)),
    avgActual: Math.round(paired.reduce((s, d) => s + d.actual, 0) / n),
    avgForecast: Math.round(paired.reduce((s, d) => s + d.forecast, 0) / n),
  };
}

module.exports = {
  selectForecastsByHorizon,
  combineData,
  calculateStats,
};
