from fastapi import APIRouter
from app.data.prices import get_portfolio_snapshot
from app.db.queries import get_alert_config, save_alert_config
from app.config import PORTFOLIO_SYMBOLS, COMPANY_NAMES, SECTORS
from datetime import datetime

router = APIRouter()

@router.get("/")
async def get_portfolio():
    """Portfolio metadata + current prices."""
    snapshot = get_portfolio_snapshot(PORTFOLIO_SYMBOLS)
    price_map = {s["ticker"]: s for s in snapshot}
    result = []
    for ticker in PORTFOLIO_SYMBOLS:
        info = price_map.get(ticker, {})
        result.append({
            "ticker":       ticker,
            "name":         COMPANY_NAMES.get(ticker, ticker),
            "sector":       SECTORS.get(ticker, ""),
            "price":        info.get("price"),
            "change_pct":   info.get("change_pct"),
            "week52_high":  info.get("week52_high"),
            "week52_low":   info.get("week52_low"),
            "sparkline":    info.get("sparkline", []),
        })
    return {"portfolio": result, "updated_at": datetime.utcnow().isoformat()}

@router.get("/alerts")
async def get_alerts():
    return await get_alert_config()

@router.put("/alerts")
async def update_alerts(body: dict):
    await save_alert_config(body)
    return {"status": "ok", "config": body}
