import requests
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

NSE_BASE = "https://www.nseindia.com"
NSE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.nseindia.com/",
    "Connection": "keep-alive",
    "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120"',
    "sec-ch-ua-mobile": "?0",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
}

_session: Optional[requests.Session] = None
_session_born: Optional[datetime] = None
SESSION_TTL = 240  # seconds

def _refresh_session() -> requests.Session:
    global _session, _session_born
    s = requests.Session()
    s.headers.update(NSE_HEADERS)
    try:
        s.get(NSE_BASE, timeout=10)
        time.sleep(1.2)
        s.get(f"{NSE_BASE}/market-data/live-equity-market", timeout=10)
        time.sleep(0.8)
    except Exception as e:
        logger.warning(f"NSE session init warning: {e}")
    _session = s
    _session_born = datetime.now()
    return s

def _get_session() -> requests.Session:
    global _session, _session_born
    now = datetime.now()
    if _session is None or _session_born is None or (now - _session_born).seconds > SESSION_TTL:
        return _refresh_session()
    return _session

def _parse_dt(s: str) -> Optional[datetime]:
    s = s.strip() if s else ""
    for fmt in ["%d-%b-%Y %H:%M:%S", "%d-%b-%Y", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"]:
        try:
            return datetime.strptime(s, fmt)
        except Exception:
            continue
    return None

def _fetch_for_symbol(symbol: str, from_dt: datetime) -> List[Dict]:
    """Fetch NSE announcements for a single symbol. Returns raw list."""
    session = _get_session()
    url = f"{NSE_BASE}/api/corp-announcements?index=equities&symbol={symbol}"
    for attempt in range(3):
        try:
            resp = session.get(url, timeout=12)
            if resp.status_code in (401, 403):
                _refresh_session()
                session = _get_session()
                resp = session.get(url, timeout=12)
            if resp.status_code != 200:
                logger.warning(f"NSE {symbol} status {resp.status_code}")
                return []
            data = resp.json()
            if not isinstance(data, list):
                return []
            results = []
            for item in data:
                dt = _parse_dt(item.get("an_dt", ""))
                if dt and dt >= from_dt:
                    results.append({
                        "ticker":         symbol,
                        "title":          item.get("desc", item.get("subject", "")).strip(),
                        "subject":        item.get("subject", "").strip(),
                        "attachment_url": item.get("attchmntFile", ""),
                        "timestamp":      dt.isoformat(),
                        "exchange":       "NSE",
                    })
            return results
        except Exception as e:
            logger.warning(f"NSE fetch attempt {attempt+1} for {symbol} failed: {e}")
            time.sleep(1.5 * (attempt + 1))
    return []

def fetch_announcements(symbols: List[str], hours: int = 24) -> List[Dict]:
    """Fetch and deduplicate NSE announcements for all symbols."""
    from_dt = datetime.now() - timedelta(hours=hours)
    all_anns = []
    seen_urls = set()

    for symbol in symbols:
        items = _fetch_for_symbol(symbol, from_dt)
        for item in items:
            url_key = item.get("attachment_url") or f"{item['ticker']}_{item['timestamp']}"
            if url_key not in seen_urls:
                seen_urls.add(url_key)
                all_anns.append(item)
        time.sleep(0.4)  # rate-limit: ~2.5 req/s max

    all_anns.sort(key=lambda x: x["timestamp"], reverse=True)
    logger.info(f"Fetched {len(all_anns)} announcements for {len(symbols)} symbols")
    return all_anns

def fetch_pdf_text(url: str, max_pages: int = 60) -> str:
    """Download a PDF from NSE/BSE and extract text. Returns empty string on failure."""
    if not url:
        return ""
    # Make absolute URL
    if url.startswith("/"):
        url = f"{NSE_BASE}{url}"
    try:
        import pdfplumber, io
        headers = {"User-Agent": NSE_HEADERS["User-Agent"]}
        resp = requests.get(url, headers=headers, timeout=30)
        if resp.status_code != 200:
            return ""
        parts = []
        with pdfplumber.open(io.BytesIO(resp.content)) as pdf:
            for i, page in enumerate(pdf.pages[:max_pages]):
                text = page.extract_text()
                if text:
                    parts.append(text)
        return "\n\n".join(parts)
    except Exception as e:
        logger.warning(f"PDF fetch failed ({url}): {e}")
        return ""
