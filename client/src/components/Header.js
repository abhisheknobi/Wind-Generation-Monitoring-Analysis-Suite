/**
 * HEADER COMPONENT
 * ────────────────
 * Displays the app title and a wind turbine icon.
 * 
 * TEACHING POINT — TAILWIND CLASSES EXPLAINED:
 * 
 * "bg-dark-800"     → background color (our custom dark-800 = #1e293b)
 * "border-b"        → border on the bottom only
 * "border-dark-700" → border color (dark-700 = #334155)
 * "sticky top-0"    → stays fixed at the top when scrolling
 * "z-50"            → z-index: 50 (stays above other content)
 * "flex"            → display: flex
 * "items-center"    → align-items: center
 * "justify-between" → space items to opposite ends
 * "gap-4"           → 1rem gap between flex children
 * "text-xl"         → font-size: 1.25rem
 * "font-bold"       → font-weight: 700
 * "md:text-xl"      → text-xl ONLY on medium screens and up (responsive!)
 */

import React from 'react';

function Header() {
  return (
    <header className="bg-gradient-to-r from-dark-800 to-[#162032] border-b border-dark-700 px-4 md:px-6 py-3 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Wind turbine SVG icon — animate-spin-slow = 8s rotation */}
          <svg
            className="w-7 h-7 md:w-9 md:h-9 text-primary-500 animate-spin-slow flex-shrink-0"
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
            <h1 className="text-lg md:text-xl font-bold text-dark-100 tracking-tight">
              Wind Generation Monitor
            </h1>
            <p className="text-xs md:text-sm text-dark-400">
              UK National Wind Power — Actual vs Forecast
            </p>
          </div>
        </div>

        {/* Right: Badge */}
        <span className="hidden sm:inline-block bg-primary-500/15 text-primary-400 px-3 py-1 rounded-full text-xs font-semibold border border-primary-500/30 whitespace-nowrap">
          BMRS Elexon Data
        </span>
      </div>
    </header>
  );
}

export default Header;
