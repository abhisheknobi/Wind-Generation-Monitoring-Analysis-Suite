/**
 * SERVER ENTRY POINT
 * ==================
 * This is where the Express server starts. Let me explain each piece:
 * 
 * WHAT IS EXPRESS?
 * Express is a web framework for Node.js. It handles:
 * - Listening for HTTP requests (GET, POST, etc.)
 * - Routing requests to the right handler
 * - Middleware (functions that run before/after every request)
 * 
 * MIDDLEWARE CHAIN (order matters!):
 * 1. CORS → Allows the React frontend (port 3000) to call this API (port 5000)
 * 2. JSON parser → Converts request bodies from JSON text to JavaScript objects
 * 3. Request logger → Logs every request for debugging
 * 4. Routes → The actual API endpoints
 * 5. Error handler → Catches any unhandled errors
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

// Import route modules
const generationRoutes = require('./routes/generation');
const analyticsRoutes = require('./routes/analytics');

// Create the Express application
const app = express();

// ─── MIDDLEWARE ────────────────────────────────────────────

/**
 * CORS (Cross-Origin Resource Sharing)
 * 
 * Without this, the browser would BLOCK requests from localhost:3000 (React)
 * to localhost:5000 (this API). This is a security feature of browsers.
 * 
 * We explicitly allow our React dev server's origin.
 */
app.use(
  cors({
    origin: [
      'http://localhost:3000', // React dev server
      'http://localhost:3001', // Alternative React port
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  })
);

/**
 * JSON body parser
 * Converts incoming JSON request bodies into `req.body` JavaScript objects.
 * Example: '{"name":"John"}' → req.body = { name: "John" }
 */
app.use(express.json());

/**
 * Request logger middleware
 * Runs on EVERY request. Logs method, URL, and response time.
 * Incredibly useful for debugging ("Did my request even reach the server?")
 */
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`
    );
  });
  next(); // MUST call next() or the request hangs forever!
});

// ─── ROUTES ───────────────────────────────────────────────

/**
 * Mount route modules at specific URL prefixes.
 * 
 * app.use('/api/generation', generationRoutes)
 * means: any request starting with /api/generation gets handled by generationRoutes
 * 
 * So GET /api/generation/actual → generationRoutes handles '/actual'
 *    GET /api/generation/combined → generationRoutes handles '/combined'
 */
app.use('/api/generation', generationRoutes);
app.use('/api/analytics', analyticsRoutes);

/**
 * Health check endpoint
 * Simple endpoint to verify the server is running.
 * Used by monitoring tools, load balancers, and deployment platforms.
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── STATIC FILES (Production) ────────────────────────────

/**
 * In production, we serve the React build files from the server.
 * In development, React runs its own dev server (port 3000).
 * 
 * This means in production, you only need ONE server running.
 */
if (config.nodeEnv === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Any route not matched by API routes → serve React's index.html
  // This enables client-side routing (React Router)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// ─── ERROR HANDLING ───────────────────────────────────────

/**
 * Global error handler
 * Express calls this when any middleware calls next(error).
 * The 4 parameters (err, req, res, next) tell Express this is an error handler.
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    error: true,
    message: 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
});

// ─── START SERVER ─────────────────────────────────────────

app.listen(config.port, () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║  Wind Generation Monitoring - API Server         ║
  ║  Running on: http://localhost:${config.port}              ║
  ║  Environment: ${config.nodeEnv.padEnd(33)}║
  ╚══════════════════════════════════════════════════╝
  `);
});

module.exports = app;
