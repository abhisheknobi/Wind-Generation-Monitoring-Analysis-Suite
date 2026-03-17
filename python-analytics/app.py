"""
PYTHON ANALYTICS SERVICE - Flask API
─────────────────────────────────────
This is a lightweight Flask web server that exposes Python-powered
analytics as REST API endpoints.

WHAT IS FLASK?
Flask is Python's equivalent of Express.js. It handles HTTP requests
and routes them to Python functions. It's simpler than Django (the
"full-featured" Python web framework) - perfect for APIs.

ARCHITECTURE:
  React Frontend → Node.js Server → Python Flask (this file)
                                    ↓
                              pandas/numpy/scipy
                              (heavy data analysis)

The Node.js server proxies requests here when advanced analytics
are needed. The frontend never talks to this service directly.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from services.analysis import compute_error_analysis, compute_reliability_analysis
import os

# Create Flask app
app = Flask(__name__)

# Enable CORS so the Node.js server can call us
CORS(app)


@app.route("/api/analysis/error", methods=["GET"])
def error_analysis():
    """
    Endpoint: GET /api/analysis/error?from=...&to=...&horizon=4

    Performs detailed error analysis of wind forecasts.
    Called by the Node.js server, not directly by the frontend.
    """
    from_date = request.args.get("from")
    to_date = request.args.get("to")
    horizon = float(request.args.get("horizon", 4))

    if not from_date or not to_date:
        return jsonify({"error": "Missing 'from' and 'to' parameters"}), 400

    try:
        result = compute_error_analysis(from_date, to_date, horizon)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/analysis/reliability", methods=["GET"])
def reliability_analysis():
    """
    Endpoint: GET /api/analysis/reliability

    Analyzes historical wind generation to determine reliability.
    Returns capacity recommendations based on statistical analysis.
    """
    try:
        result = compute_reliability_analysis()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "service": "python-analytics"})


if __name__ == "__main__":
    port = int(os.environ.get("PYTHON_SERVICE_PORT", 5001))
    print(f"\n  Python Analytics Service running on http://localhost:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=True)
