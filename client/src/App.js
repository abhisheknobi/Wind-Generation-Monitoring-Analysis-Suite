/**
 * APP COMPONENT (Root)
 * ────────────────────
 * This is the top-level React component. It renders the Dashboard.
 * 
 * REACT COMPONENT BASICS:
 * - A component is a function that returns JSX (HTML-like syntax)
 * - Components can have STATE (data that changes) and PROPS (data passed in)
 * - When state changes, React automatically re-renders the component
 * 
 * TAILWIND NOTE:
 * Notice there's no `import './App.css'` anymore. With Tailwind, we apply
 * styles directly as className strings. The only CSS import is in index.js
 * (index.css with the @tailwind directives).
 */

import React from 'react';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="min-h-screen bg-dark-900">
      <Dashboard />
    </div>
  );
}

export default App;
