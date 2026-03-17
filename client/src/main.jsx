/**
 * REACT ENTRY POINT
 * ─────────────────
 * This is the very first JavaScript that runs. It:
 * 1. Imports React and ReactDOM
 * 2. Finds the <div id="root"> in index.html
 * 3. Renders our App component into it
 * 
 * ReactDOM.createRoot is the React 18+/19 way to initialize.
 * StrictMode adds extra development checks (double-renders, etc.)
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
