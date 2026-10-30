from fastapi import APIRouter, Query, BackgroundTasks
from datetime import datetime, timedelta
from typing import Optional, List
import logging

from app.data.announcements import fetch_announcements
from app.data.prices import detect_anomalies, fetch_prices, get_portfolio_snapshot
from app.ai.classifier import classify_announcements_batch
from app.ai.enricher import enrich_announcement
from app.db.queries import (
    save_announcements, get_announcements, save_price_alerts, get_price_alerts, get_alert_config
)
from app.config import PORTFOLIO_SYMBOLS

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/digest")
async def get_digest(
    window_hours: int = Query(24, ge=1, le=168, description="Lookback window in hours"),
    categories: Optional[str] = Query(None, description="Comma-separated category filter"),
    include_unclassified: bool = Query(False),
    enrich: bool = Query(True, description="Fetch enrichment for material announcements"),
):
    from_dt  = datetime.utcnow() - timedelta(hours=window_hours)
    from_iso = from_dt.isoformat()
    cat_filter = [c.strip() for c in categories.split(",")] if categories else None

    # 1. Try to get from DB first
    db_anns = await get_announcements(
        PORTFOLIO_SYMBOLS, from_iso,
        categories=cat_filter,
        include_unclassified=include_unclassified,
    )

    # 2. If DB is empty or stale (< 10 items and window is short), fetch fresh
    if len(db_anns) < 10 and window_hours <= 48:
        raw = fetch_announcements(PORTFOLIO_SYMBOLS, hours=window_hours)
        if raw:
            classified = classify_announcements_batch(raw)
            # Enrich material announcements synchronously for fresh fetch
            if enrich:
                for ann in classified:
                    if ann.get("is_material") and not ann.get("enrichment"):
                        enrich_announcement(ann)
            await save_announcements(classified)
            db_anns = classified
            if cat_filter:
                db_anns = [a for a in db_anns if a.get("category") in cat_filter]
            if not include_unclassified:
                db_anns = [a for a in db_anns if a.get("category") != "unclassified"]

    # 3. Price alerts
    price_alerts = await get_price_alerts(PORTFOLIO_SYMBOLS, days=1)

    # If no DB alerts, compute live
    if not price_alerts and window_hours <= 48:
        cfg = await get_alert_config()
        df = fetch_prices(PORTFOLIO_SYMBOLS, period="30d")
        live_alerts = detect_anomalies(df,
            price_threshold_pct=cfg.get("price_threshold_pct", 5.0),
            volume_multiplier=cfg.get("volume_multiplier", 2.0),
        )
        if live_alerts:
            await save_price_alerts(live_alerts)
        price_alerts = [{"ticker":a["ticker"],"alert_type":a["type"],"value":a["value"],
                         "direction":a.get("direction"),"severity":a["severity"],"message":a["message"]}
                        for a in live_alerts]

    material = [a for a in db_anns if a.get("is_material")]
    other    = [a for a in db_anns if not a.get("is_material")]

    return {
        "window_hours":    window_hours,
        "generated_at":    datetime.utcnow().isoformat(),
        "announcements":   db_anns,
        "price_alerts":    price_alerts,
        "counts": {
            "total":    len(db_anns),
            "material": len(material),
            "other":    len(other),
            "price_alerts": len(price_alerts),
        },
    }

@router.get("/portfolio")
async def get_portfolio_prices():
    """Current prices, changes, sparklines for all portfolio stocks."""
    snapshot = get_portfolio_snapshot(PORTFOLIO_SYMBOLS)
    return {"stocks": snapshot, "updated_at": datetime.utcnow().isoformat()}

@router.get("/alerts/config")
async def get_alerts_config():
    return await get_alert_config()

@router.put("/alerts/config")
async def update_alerts_config(body: dict):
    from app.db.queries import save_alert_config
    await save_alert_config(body)
    return {"status": "updated", "config": body}

@router.post("/refresh")
async def force_refresh(background_tasks: BackgroundTasks):
    """Force-refresh announcements and prices now."""
    def _refresh():
        raw = fetch_announcements(PORTFOLIO_SYMBOLS, hours=2)
        classified = classify_announcements_batch(raw)
        import asyncio
        asyncio.run(save_announcements(classified))
    background_tasks.add_task(_refresh)
    return {"status": "refresh_queued"}
