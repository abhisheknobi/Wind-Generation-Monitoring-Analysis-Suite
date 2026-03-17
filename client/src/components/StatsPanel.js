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
 * 2. DYNAMIC TAILWIND CLASSES:
 *    We can't do `text-${color}-500` dynamically — Tailwind purges classes
 *    it doesn't see at build time. Instead we use a colorMap object that
 *    maps color names to FULL class strings Tailwind can detect.
 * 
 * 3. METRIC EXPLANATIONS (for learning):
 *    - MAE: "The forecast is off by ___ MW on average"
 *    - RMSE: Like MAE but big errors count more (squared then rooted)
 *    - MAPE: Same as MAE but as a percentage (easier to understand)
 *    - Bias: Positive = over-forecasting, Negative = under-forecasting
 */

import React from 'react';

// Tailwind requires full class strings at build time — no dynamic interpolation
const colorMap = {
  blue: {
    border: 'border-l-blue-500',
    label: 'text-blue-400',
    bg: 'bg-blue-500/5',
  },
  purple: {
    border: 'border-l-purple-500',
    label: 'text-purple-400',
    bg: 'bg-purple-500/5',
  },
  yellow: {
    border: 'border-l-yellow-500',
    label: 'text-yellow-400',
    bg: 'bg-yellow-500/5',
  },
  red: {
    border: 'border-l-red-500',
    label: 'text-red-400',
    bg: 'bg-red-500/5',
  },
  green: {
    border: 'border-l-green-500',
    label: 'text-green-400',
    bg: 'bg-green-500/5',
  },
};

function StatsPanel({ stats }) {
  if (!stats || stats.count === 0) {
    return null;
  }

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
    <div className="animate-fade-in">
      <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">
        Forecast Accuracy Metrics
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map((metric) => {
          const colors = colorMap[metric.color] || colorMap.blue;
          return (
            <div
              key={metric.label}
              className={`${colors.bg} border border-dark-700 ${colors.border} border-l-[3px] rounded-xl p-3 md:p-4 transition-colors hover:bg-dark-700/50 cursor-default`}
              title={metric.tooltip}
            >
              <div className={`text-[0.7rem] font-semibold uppercase tracking-wider ${colors.label} mb-1`}>
                {metric.label}
              </div>
              <div className="text-lg md:text-xl font-bold text-dark-100 leading-tight">
                {metric.value}
              </div>
              <div className="text-[0.7rem] text-dark-500 mt-1">
                {metric.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StatsPanel;
