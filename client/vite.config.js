/**
 * VITE CONFIGURATION
 * ──────────────────
 * Vite is the modern replacement for Create React App's webpack setup.
 * 
 * WHY VITE INSTEAD OF CRA?
 * - CRA uses webpack (slow, deprecated, 1300+ packages)
 * - Vite uses esbuild (Go-based, 10-100x faster) for dev
 * - Vite uses Rollup for production builds (tree-shaking, code splitting)
 * - ~150 packages vs CRA's 1300+ (zero deprecation warnings!)
 * - Hot Module Replacement (HMR) is near-instant
 * 
 * KEY DIFFERENCES FROM CRA:
 * - Entry point: index.html is in the root (not public/)
 * - Env vars: use import.meta.env.VITE_* (not process.env.REACT_APP_*)
 * - No "eject" needed — config is already exposed here
 * - Dev server proxy is configured here (not in package.json)
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Dev server settings
  server: {
    port: 3000,       // Same port CRA used
    open: true,       // Auto-open browser on start

    // Proxy API requests to our Node.js backend
    // This replaces CRA's "proxy" in package.json
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  // Build output settings
  build: {
    outDir: 'build',  // Same output dir as CRA for compatibility
    sourcemap: true,
  },
});
