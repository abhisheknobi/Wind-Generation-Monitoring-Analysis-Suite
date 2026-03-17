/**
 * DASHBOARD COMPONENT
 * ────────────────────
 * The main orchestrator that brings all components together.
 * 
 * TEACHING POINTS:
 * 
 * 1. STATE MANAGEMENT (useState):
 *    React's useState hook creates a piece of reactive data.
 *    const [value, setValue] = useState(initialValue);
 *    When you call setValue(newValue), React re-renders this component
 *    AND all child components that receive it as props.
 * 
 * 2. SIDE EFFECTS (useEffect):
 *    useEffect runs code AFTER the component renders.
 *    Perfect for: API calls, timers, subscriptions.
 *    useEffect(() => { ... }, [deps]) — re-runs when deps change.
 *    useEffect(() => { ... }, []) — runs ONCE on mount (empty deps).
 * 
 * 3. useCallback:
 *    Memoizes a function so it doesn't get recreated every render.
 *    Important when passing callbacks to child components — prevents
 *    unnecessary re-renders.
 * 
 * 4. DATA FLOW:
 *    Dashboard (state owner)
 *      → ControlPanel (receives state + setters as props)
 *      → StatsPanel (receives computed stats as props)
 *      → GenerationChart (receives chart data as props)
 *    
 *    This is "unidirectional data flow" — data goes DOWN, events go UP.
 */

import React, { useState, useCallback, useEffect } from 'react';
import dayjs from 'dayjs';
import Header from './Header';
import ControlPanel from './ControlPanel';
import StatsPanel from './StatsPanel';
import GenerationChart from './GenerationChart';
import { getCombinedData } from '../services/api';

function Dashboard() {
  // ─── STATE ──────────────────────────────────────────
  // Default to last 3 days of data (reasonable amount for a chart)
  const [startDate, setStartDate] = useState(
    dayjs().subtract(3, 'day').format('YYYY-MM-DDTHH:mm')
  );
  const [endDate, setEndDate] = useState(
    dayjs().format('YYYY-MM-DDTHH:mm')
  );
  const [horizon, setHorizon] = useState(4); // 4-hour forecast horizon default
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ─── DATA FETCHING ─────────────────────────────────
  /**
   * Fetch combined actual + forecast data from the backend.
   * 
   * useCallback memoizes this function — it only gets recreated when
   * startDate, endDate, or horizon change. This prevents unnecessary
   * re-renders of ControlPanel (which receives this as onFetchData prop).
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Convert local datetime to ISO format for the API
      const from = dayjs(startDate).toISOString();
      const to = dayjs(endDate).toISOString();

      // Call our Node.js backend
      const response = await getCombinedData(from, to, horizon);

      setChartData(response.chartData || []);
      setStats(response.stats || null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to fetch data. Is the server running?');
      setChartData([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, horizon]);

  // ─── AUTO-FETCH ON MOUNT ───────────────────────────
  /**
   * Fetch data once when the component first mounts.
   * The empty dependency array [] means "run once on mount."
   * 
   * HOWEVER: we also depend on fetchData, so we include it.
   * Because fetchData is wrapped in useCallback, this only fires
   * when the dependencies of fetchData change (or on mount).
   */
  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── RENDER ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark-900">
      <Header />

      {/* Main content area with responsive padding */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Controls: date pickers + slider + fetch button */}
        <ControlPanel
          startDate={startDate}
          endDate={endDate}
          horizon={horizon}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onHorizonChange={setHorizon}
          onFetchData={fetchData}
          loading={loading}
        />

        {/* Error message (only shown when there's an error) */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-400">Error fetching data</p>
              <p className="text-xs text-red-400/70 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-[3px] border-dark-700 border-t-primary-500 rounded-full animate-spin" />
              <p className="text-sm text-dark-400">Fetching wind generation data...</p>
            </div>
          </div>
        )}

        {/* Stats cards (only shown when data is loaded) */}
        {!loading && stats && <StatsPanel stats={stats} />}

        {/* Main chart */}
        {!loading && <GenerationChart data={chartData} />}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 md:px-6 py-6 mt-4">
        <div className="border-t border-dark-700 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-dark-500">
          <p>Wind Generation Monitoring & Analysis Suite</p>
          <p>
            Data source:{' '}
            <a
              href="https://bmrs.elexon.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              BMRS Elexon
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
