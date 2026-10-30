import yfinance as yf
import pandas as pd
from datetime import datetime, date
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

def _ns(symbol: str) -> str:
    return f"{symbol}.NS" if not symbol.endswith(".NS") else symbol

def fetch_prices(symbols: List[str], period: str = "30d") -> pd.DataFrame:
    """Fetch EOD OHLCV for all symbols. Returns multi-level DataFrame."""
    tickers = [_ns(s) for s in symbols]
    try:
        df = yf.download(
            tickers,
            period=period,
            interval="1d",
            group_by="ticker",
            auto_adjust=True,
            progress=False,
            threads=True,
        )
        return df
    except Exception as e:
        logger.error(f"fetch_prices error: {e}")
        return pd.DataFrame()

def detect_anomalies(
    df: pd.DataFrame,
    price_threshold_pct: float = 5.0,
    volume_multiplier: float = 2.0,
) -> List[Dict]:
    """Return list of price/volume anomaly alerts for the latest trading day."""
    if df.empty:
        return []

    alerts = []

    # Handle both single and multi-ticker DataFrames
    if isinstance(df.columns, pd.MultiIndex):
        symbols = df.columns.get_level_values(0).unique().tolist()
    else:
        # Single ticker
        symbols = ["UNKNOWN"]

    for sym in symbols:
        try:
            if isinstance(df.columns, pd.MultiIndex):
                stock = df[sym].dropna(how="all")
            else:
                stock = df.dropna(how="all")

            if len(stock) < 5:
                continue

            close = stock["Close"]
            volume = stock["Volume"]

            if close.iloc[-1] is None or pd.isna(close.iloc[-1]):
                continue

            # Price move
            today_close = float(close.iloc[-1])
            prev_close  = float(close.iloc[-2])
            if prev_close == 0:
                continue
            pct = ((today_close - prev_close) / prev_close) * 100

            if abs(pct) >= price_threshold_pct:
                ticker = sym.replace(".NS", "").replace(".BO", "")
                alerts.append({
                    "ticker":    ticker,
                    "type":      "price_move",
                    "direction": "up" if pct > 0 else "down",
                    "value":     round(pct, 2),
                    "severity":  "high" if abs(pct) >= 10 else "medium",
                    "message":   f"{ticker} moved {pct:+.1f}% today (₹{prev_close:.0f} → ₹{today_close:.0f})",
                    "timestamp": datetime.utcnow().isoformat(),
                })

            # Volume spike
            today_vol = float(volume.iloc[-1])
            avg_vol   = float(volume.iloc[-21:-1].mean())
            if avg_vol > 0:
                ratio = today_vol / avg_vol
                if ratio >= volume_multiplier:
                    ticker = sym.replace(".NS", "").replace(".BO", "")
                    alerts.append({
                        "ticker":   ticker,
                        "type":     "volume_spike",
                        "value":    round(ratio, 1),
                        "severity": "high" if ratio >= 3 else "medium",
                        "message":  f"{ticker} volume {ratio:.1f}× 20-day average",
                        "timestamp": datetime.utcnow().isoformat(),
                    })
        except Exception as e:
            logger.warning(f"Anomaly check failed for {sym}: {e}")

    alerts.sort(key=lambda x: 0 if x["severity"] == "high" else 1)
    return alerts

def get_portfolio_snapshot(symbols: List[str]) -> List[Dict]:
    """Current price, 1-day change, 52-week high/low, and 30-day sparkline."""
    tickers = [_ns(s) for s in symbols]
    try:
        df = yf.download(
            tickers,
            period="1y",
            interval="1d",
            group_by="ticker",
            auto_adjust=True,
            progress=False,
            threads=True,
        )
    except Exception as e:
        logger.error(f"get_portfolio_snapshot error: {e}")
        return []

    result = []
    for sym in tickers:
        try:
            ticker_label = sym.replace(".NS", "")
            if isinstance(df.columns, pd.MultiIndex):
                stock = df[sym].dropna(how="all")
            else:
                stock = df.dropna(how="all")

            close = stock["Close"]
            price     = float(close.iloc[-1])
            prev      = float(close.iloc[-2])
            chg_pct   = ((price - prev) / prev) * 100 if prev else 0
            high52    = float(close.max())
            low52     = float(close.min())
            spark30   = [round(float(v), 2) for v in close.iloc[-30:].fillna(method="ffill").tolist()]

            result.append({
                "ticker":       ticker_label,
                "price":        round(price, 2),
                "change_pct":   round(chg_pct, 2),
                "week52_high":  round(high52, 2),
                "week52_low":   round(low52, 2),
                "sparkline":    spark30,
                "updated_at":   datetime.utcnow().isoformat(),
            })
        except Exception as e:
            logger.warning(f"Snapshot failed for {sym}: {e}")

    return result
