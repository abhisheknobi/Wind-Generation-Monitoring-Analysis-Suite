/**
 * STATS PANEL COMPONENT
 * ─────────────────────
 * Displays forecast accuracy metrics in card format.
 * 
 * TEACHING POINTS:
 * 
 * 1. CONDITIONAL RENDERING:
 *    {stats && <div>...</div>} → only renders if stats exists.
 *    This prevents errors when data hasn't loaded yet.
 * 
 * 2. ARRAY.MAP() FOR LISTS:
 *    React renders lists by mapping an array of data to an array of components.
 *    Each item needs a unique `key` prop so React can efficiently update the DOM.
 * 
 * 3. METRIC EXPLANATIONS (for learning):
 *    - MAE: "The forecast is off by ___ MW on average"
 *    - RMSE: Like MAE but big errors count more (squared then rooted)
 *    - MAPE: Same as MAE but as a percentage (easier to understand)
 *    - Bias: Positive = over-forecasting, Negative = under-forecasting
 */

import React from 'react';
import './StatsPanel.css';

function StatsPanel({ stats }) {
  if (!stats || stats.count === 0) {
    return null;
  }

  // Define the metric cards we want to display
  const metrics = [
    {
      label: 'MAE',
      value: `${stats.mae} MW`,
      description: 'Mean Absolute Error',
      color: 'blue',
      tooltip: 'Average forecast error magnitude',
    },
    {
      label: 'RMSE',
      value: `${stats.rmse} MW`,
      description: 'Root Mean Squared Error',
      color: 'purple',
      tooltip: 'Penalizes large errors more',
    },
    {
      label: 'MAPE',
      value: `${stats.mape}%`,
      description: 'Mean Abs % Error',
      color: 'yellow',
      tooltip: 'Error as percentage of actual',
    },
    {
      label: 'Bias',
      value: `${stats.bias > 0 ? '+' : ''}${stats.bias} MW`,
      description: stats.bias > 0 ? 'Over-forecasting' : 'Under-forecasting',
      color: stats.bias > 0 ? 'red' : 'green',
      tooltip: 'Positive = forecast too high',
    },
    {
      label: 'Avg Actual',
      value: `${stats.avgActual} MW`,
      description: 'Average generation',
      color: 'blue',
      tooltip: 'Mean actual wind generation',
    },
    {
      label: 'Data Points',
      value: stats.count.toLocaleString(),
      description: 'Matched pairs',
      color: 'green',
      tooltip: 'Number of actual-forecast pairs',
    },
  ];

  return (
    <div className="stats-panel">
      <h3 className="stats-title">Forecast Accuracy Metrics</h3>
      <div className="stats-grid">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`stat-card stat-card--${metric.color}`}
            title={metric.tooltip}
          >
            <div className="stat-label">{metric.label}</div>
            <div className="stat-value">{metric.value}</div>
            <div className="stat-description">{metric.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StatsPanel;
