"""
DATA FETCHER
─────────────
Fetches wind generation data from the BMRS Elexon API.
Same API as the Node.js server, but this Python version is used
for the analytics service and Jupyter notebooks.

WHY DUPLICATE THE API CALLS?
The Python analytics service runs independently. It needs its own
data fetching capability for:
1. Running analysis without depending on Node.js being up
2. Jupyter notebooks that run standalone
3. Different data processing needs (pandas DataFrames vs JSON)
"""

import requests
import pandas as pd
from datetime import datetime

# BMRS API base URL (public, no API key needed)
BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"


def fetch_actual_generation(from_date: str, to_date: str) -> pd.DataFrame:
    """
    Fetch actual wind generation data from the FUELHH dataset.

    Parameters:
        from_date: Start date (ISO format, e.g., '2025-01-01')
        to_date: End date (ISO format)

    Returns:
        DataFrame with columns: startTime, generation

    The FUELHH dataset contains half-hourly generation data for all fuel types.
    We filter for fuelType == 'WIND' to get only wind generation.
    """
    url = f"{BASE_URL}/datasets/FUELHH/stream"
    params = {"from": from_date, "to": to_date}

    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()

        if not data:
            return pd.DataFrame(columns=["startTime", "generation"])

        df = pd.DataFrame(data)

        # Filter for WIND fuel type only
        if "fuelType" in df.columns:
            df = df[df["fuelType"].str.upper() == "WIND"]

        # Convert startTime to datetime for proper time-series handling
        df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
        df["generation"] = pd.to_numeric(df["generation"], errors="coerce")

        return df[["startTime", "generation"]].dropna().reset_index(drop=True)

    except Exception as e:
        print(f"Error fetching actual generation: {e}")
        return pd.DataFrame(columns=["startTime", "generation"])


def fetch_wind_forecast(from_date: str, to_date: str) -> pd.DataFrame:
    """
    Fetch wind forecast data from the WINDFOR dataset.

    Parameters:
        from_date: Start date (ISO format)
        to_date: End date (ISO format)

    Returns:
        DataFrame with columns: startTime, publishTime, generation

    KEY FIELDS:
    - startTime: target time (when the power will actually be generated)
    - publishTime: when this forecast was created/published
    - generation: predicted MW of wind power

    The difference (startTime - publishTime) = forecast horizon
    """
    url = f"{BASE_URL}/datasets/WINDFOR/stream"
    params = {"from": from_date, "to": to_date}

    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()

        if not data:
            return pd.DataFrame(columns=["startTime", "publishTime", "generation"])

        df = pd.DataFrame(data)
        df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
        df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)
        df["generation"] = pd.to_numeric(df["generation"], errors="coerce")

        return (
            df[["startTime", "publishTime", "generation"]]
            .dropna()
            .reset_index(drop=True)
        )

    except Exception as e:
        print(f"Error fetching wind forecast: {e}")
        return pd.DataFrame(columns=["startTime", "publishTime", "generation"])
