import asyncio
import logging
from datetime import datetime, date
from typing import List, Dict, Optional, Any
from app.db.client import get_client

logger = logging.getLogger(__name__)

# ─── Announcements ───────────────────────────────────────────────────────────

async def save_announcements(announcements: List[Dict]) -> None:
    if not announcements:
        return
    client = get_client()
    rows = []
    for a in announcements:
        rows.append({
            "ticker":         a.get("ticker"),
            "exchange":       a.get("exchange", "NSE"),
            "title":          (a.get("title") or "")[:500],
            "category":       a.get("category", "unclassified"),
            "summary":        (a.get("summary") or "")[:300],
            "priority":       a.get("priority", 9),
            "is_material":    a.get("is_material", False),
            "attachment_url": (a.get("attachment_url") or "")[:1000],
            "enrichment":     a.get("enrichment"),
            "ann_timestamp":  a.get("timestamp"),
        })
    try:
        await asyncio.to_thread(
            lambda: client.table("announcements").upsert(
                rows, on_conflict="ticker,attachment_url"
            ).execute()
        )
    except Exception as e:
        logger.error(f"save_announcements error: {e}")

async def get_announcements(
    tickers: List[str],
    from_iso: str,
    categories: Optional[List[str]] = None,
    include_unclassified: bool = False,
) -> List[Dict]:
    client = get_client()
    try:
        q = (
            client.table("announcements")
            .select("*")
            .in_("ticker", tickers)
            .gte("ann_timestamp", from_iso)
            .order("priority", desc=False)
            .order("ann_timestamp", desc=True)
            .limit(200)
        )
        result = await asyncio.to_thread(lambda: q.execute())
        rows = result.data or []
        if not include_unclassified:
            rows = [r for r in rows if r.get("category") != "unclassified"]
        if categories:
            rows = [r for r in rows if r.get("category") in categories]
        return rows
    except Exception as e:
        logger.error(f"get_announcements error: {e}")
        return []

async def get_last_ann_timestamp(ticker: str) -> Optional[str]:
    client = get_client()
    try:
        result = await asyncio.to_thread(
            lambda: client.table("announcements")
            .select("ann_timestamp")
            .eq("ticker", ticker)
            .order("ann_timestamp", desc=True)
            .limit(1)
            .execute()
        )
        rows = result.data or []
        return rows[0]["ann_timestamp"] if rows else None
    except Exception as e:
        logger.error(f"get_last_ann_timestamp error: {e}")
        return None

# ─── Price Alerts ─────────────────────────────────────────────────────────────

async def save_price_alerts(alerts: List[Dict]) -> None:
    if not alerts:
        return
    client = get_client()
    rows = [{
        "ticker":     a["ticker"],
        "alert_type": a["type"],
        "value":      a["value"],
        "direction":  a.get("direction"),
        "severity":   a["severity"],
        "message":    a["message"],
        "alert_date": str(date.today()),
    } for a in alerts]
    try:
        await asyncio.to_thread(
            lambda: client.table("price_alerts")
            .upsert(rows, on_conflict="ticker,alert_type,alert_date")
            .execute()
        )
    except Exception as e:
        logger.error(f"save_price_alerts error: {e}")

async def get_price_alerts(tickers: List[str], days: int = 1) -> List[Dict]:
    from datetime import timedelta
    client = get_client()
    since = str((datetime.utcnow() - timedelta(days=days)).date())
    try:
        result = await asyncio.to_thread(
            lambda: client.table("price_alerts")
            .select("*")
            .in_("ticker", tickers)
            .gte("alert_date", since)
            .order("severity")
            .execute()
        )
        return result.data or []
    except Exception as e:
        logger.error(f"get_price_alerts error: {e}")
        return []

# ─── Documents (for RAG) ──────────────────────────────────────────────────────

async def save_document_chunks(ticker: str, chunks: List[Dict]) -> None:
    if not chunks:
        return
    client = get_client()
    rows = [{
        "ticker":      ticker,
        "doc_type":    c["doc_type"],
        "label":       c.get("label", ""),
        "chunk_index": c["chunk_index"],
        "content":     c["content"][:4000],
    } for c in chunks]
    try:
        # Delete old chunks first, then insert fresh
        await asyncio.to_thread(
            lambda: client.table("documents").delete().eq("ticker", ticker).execute()
        )
        await asyncio.to_thread(
            lambda: client.table("documents").insert(rows).execute()
        )
        logger.info(f"Saved {len(rows)} chunks for {ticker}")
    except Exception as e:
        logger.error(f"save_document_chunks error: {e}")

async def get_document_chunks(ticker: str, doc_type: Optional[str] = None) -> List[Dict]:
    client = get_client()
    try:
        q = client.table("documents").select("*").eq("ticker", ticker)
        if doc_type:
            q = q.eq("doc_type", doc_type)
        q = q.order("chunk_index")
        result = await asyncio.to_thread(lambda: q.execute())
        return result.data or []
    except Exception as e:
        logger.error(f"get_document_chunks error: {e}")
        return []

async def get_ingestion_status(ticker: str) -> Dict:
    client = get_client()
    try:
        result = await asyncio.to_thread(
            lambda: client.table("documents")
            .select("doc_type, chunk_index")
            .eq("ticker", ticker)
            .execute()
        )
        rows = result.data or []
        ar_count = sum(1 for r in rows if r["doc_type"] == "annual_report")
        cc_count = sum(1 for r in rows if r["doc_type"] == "concall_transcript")
        return {"ingested": len(rows) > 0, "ar_chunks": ar_count, "concall_chunks": cc_count, "total": len(rows)}
    except Exception as e:
        logger.error(f"get_ingestion_status error: {e}")
        return {"ingested": False, "total": 0}

# ─── Research Cache ───────────────────────────────────────────────────────────

async def save_research(ticker: str, result: Dict) -> None:
    client = get_client()
    try:
        await asyncio.to_thread(
            lambda: client.table("research_cache")
            .upsert({"ticker": ticker, "result": result, "last_refreshed": datetime.utcnow().isoformat()},
                    on_conflict="ticker")
            .execute()
        )
    except Exception as e:
        logger.error(f"save_research error: {e}")

async def get_research(ticker: str) -> Optional[Dict]:
    client = get_client()
    try:
        result = await asyncio.to_thread(
            lambda: client.table("research_cache").select("result,last_refreshed").eq("ticker", ticker).execute()
        )
        rows = result.data or []
        if rows:
            return rows[0]
        return None
    except Exception as e:
        logger.error(f"get_research error: {e}")
        return None

# ─── Alert Config ─────────────────────────────────────────────────────────────

async def get_alert_config() -> Dict:
    from app.config import DEFAULT_PRICE_THRESHOLD_PCT, DEFAULT_VOLUME_MULTIPLIER, MATERIAL_CATEGORIES
    client = get_client()
    try:
        result = await asyncio.to_thread(
            lambda: client.table("alert_config").select("*").eq("id", 1).execute()
        )
        rows = result.data or []
        if rows:
            return rows[0]
    except Exception as e:
        logger.warning(f"get_alert_config error (returning defaults): {e}")
    return {
        "price_threshold_pct": DEFAULT_PRICE_THRESHOLD_PCT,
        "volume_multiplier": DEFAULT_VOLUME_MULTIPLIER,
        "alert_categories": list(MATERIAL_CATEGORIES),
    }

async def save_alert_config(config: Dict) -> None:
    client = get_client()
    try:
        await asyncio.to_thread(
            lambda: client.table("alert_config")
            .upsert({**config, "id": 1}, on_conflict="id")
            .execute()
        )
    except Exception as e:
        logger.error(f"save_alert_config error: {e}")
