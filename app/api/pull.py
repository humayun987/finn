from fastapi import APIRouter, BackgroundTasks, HTTPException
from typing import Optional
import logging
import asyncio

from app.data.fundamentals import ingest_company
from app.ai.researcher import research_company
from app.db.queries import (
    save_document_chunks, get_document_chunks,
    get_ingestion_status, save_research, get_research
)
from app.config import COMPANY_NAMES, SECTORS

router = APIRouter()
logger = logging.getLogger(__name__)

# Track in-progress ingestions to avoid duplicate runs
_ingesting: set = set()

async def _run_ingestion(ticker: str):
    """Background task: ingest + research a ticker."""
    if ticker in _ingesting:
        logger.info(f"Ingestion already running for {ticker}")
        return
    _ingesting.add(ticker)
    try:
        logger.info(f"Ingesting {ticker}...")
        result = await asyncio.to_thread(ingest_company, ticker)
        chunks = result.get("chunks", [])
        if chunks:
            await save_document_chunks(ticker, chunks)
            logger.info(f"Saved {len(chunks)} chunks for {ticker}, running research...")
            research = research_company(ticker, chunks)
            await save_research(ticker, research)
            logger.info(f"Research complete for {ticker}")
        else:
            logger.warning(f"No chunks ingested for {ticker}")
    except Exception as e:
        logger.error(f"Ingestion failed for {ticker}: {e}")
    finally:
        _ingesting.discard(ticker)

@router.get("/research/{ticker}")
async def get_research_endpoint(
    ticker: str,
    background_tasks: BackgroundTasks,
    force_refresh: bool = False,
):
    ticker = ticker.upper().strip()

    # 1. Check cache
    if not force_refresh:
        cached = await get_research(ticker)
        if cached and cached.get("result"):
            return {
                "status":      "ok",
                "cached":      True,
                "refreshed_at": cached.get("last_refreshed"),
                **cached["result"],
            }

    # 2. Check ingestion status
    status = await get_ingestion_status(ticker)

    if ticker in _ingesting:
        return {"status": "ingesting", "ticker": ticker,
                "message": "Documents are being fetched. Check back in 60-90 seconds."}

    if not status["ingested"] or force_refresh:
        # Kick off ingestion in background
        background_tasks.add_task(_run_ingestion, ticker)
        return {"status": "ingesting", "ticker": ticker,
                "message": "Fetching annual reports and concall transcripts. Check back in 60-90 seconds.",
                "estimated_seconds": 90}

    # 3. Docs exist but no research cache yet
    chunks = await get_document_chunks(ticker)
    if not chunks:
        background_tasks.add_task(_run_ingestion, ticker)
        return {"status": "ingesting", "ticker": ticker, "message": "Re-ingesting documents..."}

    research = research_company(ticker, chunks)
    await save_research(ticker, research)
    return {"status": "ok", "cached": False, **research}

@router.post("/ingest/{ticker}")
async def trigger_ingest(ticker: str, background_tasks: BackgroundTasks):
    ticker = ticker.upper().strip()
    if ticker in _ingesting:
        return {"status": "already_running", "ticker": ticker}
    background_tasks.add_task(_run_ingestion, ticker)
    return {"status": "queued", "ticker": ticker}

@router.get("/status/{ticker}")
async def ingestion_status(ticker: str):
    ticker = ticker.upper().strip()
    status = await get_ingestion_status(ticker)
    cached = await get_research(ticker)
    return {
        "ticker":          ticker,
        "ingested":        status["ingested"],
        "ar_chunks":       status["ar_chunks"],
        "concall_chunks":  status["concall_chunks"],
        "total_chunks":    status["total"],
        "has_research":    cached is not None,
        "is_ingesting":    ticker in _ingesting,
        "research_date":   cached.get("last_refreshed") if cached else None,
    }

@router.get("/companies")
async def list_companies():
    """Return all available companies (portfolio + any ingested extras)."""
    from app.config import PORTFOLIO_SYMBOLS
    return [
        {"ticker": t, "name": COMPANY_NAMES.get(t, t), "sector": SECTORS.get(t, "")}
        for t in PORTFOLIO_SYMBOLS
    ]
