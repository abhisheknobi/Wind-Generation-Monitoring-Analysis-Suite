"""
ANALYSIS SERVICE
────────────────
Statistical analysis of wind generation forecast accuracy.

This module contains the "heavy math" that Python does better than JavaScript.
It uses pandas (data manipulation) and numpy (numerical computing) to
calculate detailed error metrics.

KEY CONCEPTS:
─────────────
1. FORECAST ERROR = Forecast - Actual
   - Positive error → forecast was too HIGH (over-prediction)
   - Negative error → forecast was too LOW (under-prediction)

2. ERROR METRICS:
   - MAE (Mean Absolute Error): Average |error| — "on average, how far off?"
   - RMSE (Root Mean Squared Error): Sqrt(mean(error²)) — penalizes big errors
   - MAPE: |error|/actual × 100 — error as a percentage
   - P99 error: The error that 99% of predictions are better than

3. FORECAST HORIZON ANALYSIS:
   How does accuracy change as we predict further into the future?
   Usually: further ahead → larger errors (weather is unpredictable)
"""

import pandas as pd
import numpy as np
from .data_fetcher import fetch_actual_generation, fetch_wind_forecast


def select_forecasts_by_horizon(forecasts_df: pd.DataFrame, horizon_hours: float = 4) -> pd.DataFrame:
    """
    For each target time, select the latest forecast that was published
    at least `horizon_hours` before the target.

    This mirrors the Node.js logic but uses pandas for efficiency.
    """
    if forecasts_df.empty:
        return forecasts_df

    df = forecasts_df.copy()

    # Calculate forecast horizon in hours
    df["horizon_hours"] = (
        df["startTime"] - df["publishTime"]
    ).dt.total_seconds() / 3600

    # Filter: horizon must be >= configured minimum AND <= 48 hours
    df = df[(df["horizon_hours"] >= horizon_hours) & (df["horizon_hours"] <= 48)]

    if df.empty:
        return pd.DataFrame(columns=["startTime", "publishTime", "generation"])

    # For each target time, keep the forecast with the SMALLEST valid horizon
    # (i.e., the most recent forecast that still meets the horizon requirement)
    df = df.sort_values("horizon_hours")
    df = df.groupby("startTime").first().reset_index()

    return df[["startTime", "publishTime", "generation", "horizon_hours"]]


def compute_error_analysis(from_date: str, to_date: str, horizon_hours: float = 4) -> dict:
    """
    Full error analysis between actual and forecasted wind generation.

    Returns a dictionary with:
    - summary: overall error metrics
    - hourly: error broken down by hour of day
    - horizon: error vs forecast horizon
    - distribution: error histogram data
    """
    # Fetch both datasets
    actuals = fetch_actual_generation(from_date, to_date)
    forecasts = fetch_wind_forecast(from_date, to_date)

    if actuals.empty or forecasts.empty:
        return {"error": "No data available for the specified date range"}

    # Apply horizon filtering
    filtered_forecasts = select_forecasts_by_horizon(forecasts, horizon_hours)

    if filtered_forecasts.empty:
        return {"error": "No forecasts available with the specified horizon"}

    # Merge actual and forecast on target time
    merged = pd.merge(
        actuals, filtered_forecasts,
        on="startTime", how="inner",
        suffixes=("_actual", "_forecast")
    )

    if merged.empty:
        return {"error": "No matching actual/forecast data points found"}

    # Calculate errors
    merged["error"] = merged["generation_forecast"] - merged["generation_actual"]
    merged["abs_error"] = merged["error"].abs()
    merged["pct_error"] = np.where(
        merged["generation_actual"] > 0,
        (merged["abs_error"] / merged["generation_actual"]) * 100,
        np.nan
    )

    # ─── SUMMARY STATISTICS ─────────────────────────────
    summary = {
        "count": int(len(merged)),
        "mae": round(float(merged["abs_error"].mean()), 2),
        "rmse": round(float(np.sqrt((merged["error"] ** 2).mean())), 2),
        "mape": round(float(merged["pct_error"].dropna().mean()), 2),
        "median_error": round(float(merged["abs_error"].median()), 2),
        "p99_error": round(float(merged["abs_error"].quantile(0.99)), 2),
        "bias": round(float(merged["error"].mean()), 2),
        "std_error": round(float(merged["error"].std()), 2),
    }

    # ─── HOURLY ANALYSIS ────────────────────────────────
    # How does error vary by time of day?
    merged["hour"] = merged["startTime"].dt.hour
    hourly = merged.groupby("hour").agg(
        mae=("abs_error", "mean"),
        rmse=("error", lambda x: np.sqrt((x ** 2).mean())),
        count=("error", "count"),
        avg_actual=("generation_actual", "mean"),
        avg_forecast=("generation_forecast", "mean"),
    ).round(2)

    hourly_data = [
        {"hour": int(hour), **row.to_dict()}
        for hour, row in hourly.iterrows()
    ]

    # ─── HORIZON ANALYSIS ───────────────────────────────
    # How does error change with forecast horizon?
    if "horizon_hours" in merged.columns:
        merged["horizon_bucket"] = pd.cut(
            merged["horizon_hours"],
            bins=[0, 4, 8, 12, 18, 24, 36, 48],
            labels=["0-4h", "4-8h", "8-12h", "12-18h", "18-24h", "24-36h", "36-48h"]
        )
        horizon_analysis = merged.groupby("horizon_bucket", observed=True).agg(
            mae=("abs_error", "mean"),
            rmse=("error", lambda x: np.sqrt((x ** 2).mean())),
            count=("error", "count"),
        ).round(2)

        horizon_data = [
            {"bucket": str(bucket), **row.to_dict()}
            for bucket, row in horizon_analysis.iterrows()
        ]
    else:
        horizon_data = []

    # ─── ERROR DISTRIBUTION ─────────────────────────────
    # Histogram of errors for visualization
    hist, bin_edges = np.histogram(merged["error"].dropna(), bins=50)
    distribution = [
        {
            "bin_start": round(float(bin_edges[i]), 2),
            "bin_end": round(float(bin_edges[i + 1]), 2),
            "count": int(hist[i]),
        }
        for i in range(len(hist))
    ]

    return {
        "summary": summary,
        "hourly": hourly_data,
        "horizon": horizon_data,
        "distribution": distribution,
    }


def compute_reliability_analysis() -> dict:
    """
    Analyze historical wind generation to determine how reliably
    wind can meet electricity demand.

    Returns capacity factor analysis, percentile-based recommendations,
    and seasonal patterns.
    """
    # Fetch a full year of data for robust analysis
    actuals = fetch_actual_generation("2025-01-01", "2025-12-31")

    if actuals.empty:
        return {"error": "No data available"}

    generation = actuals["generation"]

    # Basic statistics
    stats = {
        "mean_generation_mw": round(float(generation.mean()), 2),
        "median_generation_mw": round(float(generation.median()), 2),
        "std_generation_mw": round(float(generation.std()), 2),
        "min_generation_mw": round(float(generation.min()), 2),
        "max_generation_mw": round(float(generation.max()), 2),
    }

    # Percentile analysis - key for reliability
    # P90 = the value exceeded 90% of the time
    # Higher percentile = more conservative/reliable estimate
    percentiles = {}
    for p in [5, 10, 25, 50, 75, 90, 95, 99]:
        percentiles[f"p{p}"] = round(float(generation.quantile(p / 100)), 2)

    # Monthly pattern
    actuals["month"] = actuals["startTime"].dt.month
    monthly = actuals.groupby("month")["generation"].agg(
        ["mean", "median", "std", "min", "max"]
    ).round(2)
    monthly_data = [
        {"month": int(month), **row.to_dict()}
        for month, row in monthly.iterrows()
    ]

    # Time-of-day pattern
    actuals["hour"] = actuals["startTime"].dt.hour
    hourly = actuals.groupby("hour")["generation"].agg(
        ["mean", "median", "min", "max"]
    ).round(2)
    hourly_data = [
        {"hour": int(hour), **row.to_dict()}
        for hour, row in hourly.iterrows()
    ]

    # Recommendation
    # P90 is the standard for capacity planning - power available 90% of the time
    reliable_mw = percentiles["p90"]
    recommendation = {
        "reliable_mw": reliable_mw,
        "confidence_level": "90%",
        "reasoning": (
            f"Based on historical analysis, {reliable_mw} MW of wind power "
            f"was available at least 90% of the time. This is the P90 value, "
            f"which is the industry standard for capacity planning. "
            f"The mean generation was {stats['mean_generation_mw']} MW, but using "
            f"the mean would result in shortfalls ~50% of the time."
        ),
    }

    return {
        "stats": stats,
        "percentiles": percentiles,
        "monthly": monthly_data,
        "hourly": hourly_data,
        "recommendation": recommendation,
    }
