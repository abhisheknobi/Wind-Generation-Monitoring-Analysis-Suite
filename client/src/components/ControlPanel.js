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
 * 2. PROPS vs STATE:
 *    - Props = data passed DOWN from parent (read-only)
 *    - State = data managed BY this component (read-write)
 *    Here, the dates and horizon are managed by Dashboard (parent)
 *    and passed down as props. This is called "lifting state up."
 * 
 * 3. WHY LIFT STATE UP?
 *    Because multiple components need the same data. The Dashboard needs
 *    dates to fetch data, and this panel needs them to show in inputs.
 *    So the PARENT owns the state and passes it to both.
 */

import React from 'react';
import './ControlPanel.css';

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
    <div className="control-panel">
      <div className="control-section">
        <h3 className="control-title">Time Range</h3>
        <div className="date-inputs">
          <div className="input-group">
            <label htmlFor="start-date" className="input-label">
              Start Time
            </label>
            <input
              id="start-date"
              type="datetime-local"
              className="date-input"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="end-date" className="input-label">
              End Time
            </label>
            <input
              id="end-date"
              type="datetime-local"
              className="date-input"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="control-section">
        <h3 className="control-title">
          Forecast Horizon: <span className="horizon-value">{horizon}h</span>
        </h3>
        {/*
          SLIDER EXPLANATION:
          The "forecast horizon" is the minimum time gap between when a
          forecast was PUBLISHED and the target time it predicts FOR.
          
          4h horizon means: "only show forecasts made at least 4 hours
          before the event." This filters out too-recent forecasts that
          wouldn't be available for real-world planning.
          
          Range: 0 hours (most recent forecast) to 48 hours (2 days ahead)
        */}
        <input
          type="range"
          className="horizon-slider"
          min="0"
          max="48"
          step="1"
          value={horizon}
          onChange={(e) => onHorizonChange(Number(e.target.value))}
        />
        <div className="slider-labels">
          <span>0h (latest)</span>
          <span>12h</span>
          <span>24h</span>
          <span>36h</span>
          <span>48h</span>
        </div>
      </div>

      <div className="control-section control-actions">
        <button
          className="fetch-button"
          onClick={onFetchData}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="button-spinner" />
              Loading...
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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
