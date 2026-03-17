/**
 * HEADER COMPONENT
 * ────────────────
 * Displays the app title and a wind turbine icon.
 * 
 * TEACHING POINT: This is a "presentational" component.
 * It has NO state, NO API calls — it just renders UI.
 * Simple components like this are the building blocks of React apps.
 * They're easy to test, reuse, and understand.
 */

import React from 'react';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          {/* Wind turbine SVG icon */}
          <svg
            className="header-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v6" />
            <path d="M12 22v-6" />
            <path d="M4.93 4.93l4.24 4.24" />
            <path d="M14.83 14.83l4.24 4.24" />
            <path d="M2 12h6" />
            <path d="M16 12h6" />
            <path d="M4.93 19.07l4.24-4.24" />
            <path d="M14.83 9.17l4.24-4.24" />
          </svg>
          <div>
            <h1 className="header-title">Wind Generation Monitor</h1>
            <p className="header-subtitle">
              UK National Wind Power — Actual vs Forecast
            </p>
          </div>
        </div>
        <div className="header-right">
          <span className="header-badge">BMRS Elexon Data</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
