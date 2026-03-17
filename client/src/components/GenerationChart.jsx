/**
 * GENERATION CHART COMPONENT
 * ──────────────────────────
 * The main visualization — a line chart comparing actual vs forecast wind generation.
 * 
 * TEACHING POINTS:
 * 
 * 1. RECHARTS LIBRARY:
 *    Recharts is a React charting library built on D3.js. It provides
 *    React components for each chart element:
 *    - <LineChart>  → the chart container
 *    - <Line>       → each data series (actual line, forecast line)
 *    - <XAxis>      → horizontal axis (time)
 *    - <YAxis>      → vertical axis (MW)
 *    - <Tooltip>    → popup when hovering over data points
 *    - <Legend>     → color-coded labels
 *    - <ResponsiveContainer> → makes the chart resize with its parent
 * 
 * 2. WHY RECHARTS OVER CHART.JS?
 *    Recharts is built FOR React — every piece is a component. Chart.js
 *    uses imperative canvas drawing, which fights against React's
 *    declarative model. Recharts "just works" with React state updates.
 * 
 * 3. RESPONSIVE CONTAINER:
 *    <ResponsiveContainer width="100%" height={400}> makes the chart
 *    fill its parent's width and uses a fixed height. Without this,
 *    the chart would have zero width/height and be invisible.
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';

/**
 * Custom tooltip — shown when user hovers over a data point.
 * Recharts calls this function with { active, payload, label }.
 * We format it nicely instead of showing raw numbers.
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-dark-800/95 backdrop-blur-sm border border-dark-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-dark-400 mb-2 font-medium">
        {dayjs(label).format('DD MMM YYYY, HH:mm')}
      </p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-dark-300">{entry.name}:</span>
          <span className="font-semibold text-dark-100">
            {entry.value != null ? `${Math.round(entry.value).toLocaleString()} MW` : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

function GenerationChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 md:p-12 text-center animate-fade-in">
        <svg className="w-16 h-16 text-dark-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        <h3 className="text-lg font-semibold text-dark-300 mb-2">No Data to Display</h3>
        <p className="text-sm text-dark-500">
          Select a date range and click <strong className="text-primary-400">Fetch Data</strong> to load wind generation data.
        </p>
      </div>
    );
  }

  /**
   * Format X-axis labels — show date + time in a readable format.
   * For large date ranges, showing full timestamps would be cluttered,
   * so we adapt based on what Recharts gives us.
   */
  const formatXAxis = (tickItem) => {
    return dayjs(tickItem).format('DD/MM HH:mm');
  };

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4 md:p-6 animate-fade-in">
      <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-4">
        Wind Generation — Actual vs Forecast
      </h3>

      {/* ResponsiveContainer makes the chart fill available width */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        >
          {/* Grid lines — subtle so they don't overpower the data */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#334155"
            strokeOpacity={0.5}
          />

          {/* X-axis = Time */}
          <XAxis
            dataKey="time"
            tickFormatter={formatXAxis}
            stroke="#64748b"
            fontSize={11}
            tick={{ fill: '#94a3b8' }}
            tickLine={{ stroke: '#334155' }}
            interval="preserveStartEnd"
            minTickGap={50}
          />

          {/* Y-axis = Power in MW */}
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tick={{ fill: '#94a3b8' }}
            tickLine={{ stroke: '#334155' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
            label={{
              value: 'Generation (MW)',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#64748b', fontSize: 12 },
            }}
          />

          {/* Custom tooltip on hover */}
          <Tooltip content={<CustomTooltip />} />

          {/* Legend at the bottom */}
          <Legend
            wrapperStyle={{ paddingTop: '16px', fontSize: '13px' }}
          />

          {/* ACTUAL generation line (blue) */}
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual Generation"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, fill: '#3b82f6' }}
            connectNulls={false}
          />

          {/* FORECAST generation line (green) */}
          <Line
            type="monotone"
            dataKey="forecast"
            name="Forecast Generation"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, fill: '#22c55e' }}
            connectNulls={false}
            strokeDasharray="5 3"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Chart legend explanation */}
      <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-dark-700">
        <div className="flex items-center gap-2 text-xs text-dark-400">
          <span className="w-6 h-0.5 bg-blue-500 rounded" />
          Solid line = Actual measured generation
        </div>
        <div className="flex items-center gap-2 text-xs text-dark-400">
          <span className="w-6 h-0.5 bg-green-500 rounded border-dashed" style={{borderTop: '2px dashed #22c55e', height: 0}} />
          Dashed line = Forecasted generation
        </div>
      </div>
    </div>
  );
}

export default GenerationChart;
