/**
 * APP COMPONENT (Root)
 * ────────────────────
 * This is the top-level React component. It renders the Dashboard.
 * 
 * In a larger app, this would contain React Router for navigation.
 * For our single-page dashboard, it just wraps the Dashboard component.
 * 
 * REACT COMPONENT BASICS:
 * - A component is a function that returns JSX (HTML-like syntax)
 * - Components can have STATE (data that changes) and PROPS (data passed in)
 * - When state changes, React automatically re-renders the component
 */

import React from 'react';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <div className="app">
      <Dashboard />
    </div>
  );
}

export default App;
