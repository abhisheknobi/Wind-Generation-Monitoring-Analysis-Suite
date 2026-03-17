/**
 * CONTROL PANEL COMPONENT
 * ───────────────────────
 * Contains the date range pickers and forecast horizon slider.
 * 
 * TEACHING POINTS:
 * 
 * 1. CONTROLLED COMPONENTS:
 *    The inputs' values come from React state (props), not from the DOM.
 *    When user types/selects → onChange fires → parent updates state → 
 *    React re-renders with new value. This keeps React "in control."
 * 
 * 2. TAILWIND RESPONSIVE DESIGN:
 *    - Classes without prefix → apply to ALL screen sizes (mobile-first)
 *    - "md:" prefix → only applies on screens >= 768px
 *    - "lg:" prefix → only applies on screens >= 1024px
 *    Example: "flex-col md:flex-row" = column layout on mobile, row on tablet+
 * 
 * 3. TAILWIND ARBITRARY VALUES:
 *    When Tailwind's built-in values aren't enough, use [brackets]:
 *    className="w-[200px]" → width: 200px (custom/arbitrary value)
 */

import React from 'react';

function ControlPanel({
  startDate,
  endDate,
  horizon,
  onStartDateChange,
  onEndDateChange,
  onHorizonChange,
  onFetchData,
  loading,
}) {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4 md:p-6 flex flex-col lg:flex-row flex-wrap gap-4 lg:gap-6 items-stretch lg:items-end animate-fade-in">
      {/* ── Date Range Section ────────────────── */}
      <div className="flex-1 min-w-[200px]">
        <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
          Time Range
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-[180px]">
            <label htmlFor="start-date" className="block text-xs text-dark-500 mb-1">
              Start Time
            </label>
            <input
              id="start-date"
              type="datetime-local"
              className="dark-date-input w-full px-3 py-2.5 bg-dark-900 border border-dark-700 rounded-md text-dark-100 font-sans text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              value={startDate}
              min="2025-01-01T00:00"
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label htmlFor="end-date" className="block text-xs text-dark-500 mb-1">
              End Time
            </label>
            <input
              id="end-date"
              type="datetime-local"
              className="dark-date-input w-full px-3 py-2.5 bg-dark-900 border border-dark-700 rounded-md text-dark-100 font-sans text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              value={endDate}
              min="2025-01-01T00:00"
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Forecast Horizon Slider Section ──── */}
      <div className="flex-1 min-w-[200px]">
        <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
          Forecast Horizon:{' '}
          <span className="text-primary-500 font-bold text-base normal-case">
            {horizon}h
          </span>
        </h3>
        {/*
          SLIDER: The "forecast horizon" = minimum time gap between when a
          forecast was PUBLISHED and the target time it predicts FOR.
          4h horizon → "only show forecasts made at least 4 hours ahead"
        */}
        <input
          type="range"
          className="slider-custom my-2"
          min="0"
          max="48"
          step="1"
          value={horizon}
          onChange={(e) => onHorizonChange(Number(e.target.value))}
        />
        <div className="flex justify-between text-[0.65rem] text-dark-500">
          <span>0h (latest)</span>
          <span>12h</span>
          <span>24h</span>
          <span>36h</span>
          <span>48h</span>
        </div>
      </div>

      {/* ── Fetch Button ─────────────────────── */}
      <div className="flex items-end lg:flex-none">
        <button
          className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-sans text-sm font-semibold cursor-pointer transition-all shadow-[0_2px_8px_rgba(59,130,246,0.3)] hover:translate-y-[-1px] hover:shadow-[0_4px_12px_rgba(59,130,246,0.4)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          onClick={onFetchData}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Fetch Data
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ControlPanel;
