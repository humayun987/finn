import requests
import pdfplumber
import io
import logging
from typing import List, Dict, Optional
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

SCREENER_BASE = "https://www.screener.in"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}

def get_company_page(ticker: str) -> Dict:
    """Scrape screener.in for financial tables, doc links, and description."""
    url = f"{SCREENER_BASE}/company/{ticker}/"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        if resp.status_code != 200:
            logger.warning(f"screener.in returned {resp.status_code} for {ticker}")
            return {}
    except Exception as e:
        logger.error(f"screener.in fetch error for {ticker}: {e}")
        return {}

    soup = BeautifulSoup(resp.text, "html.parser")
    result: Dict = {
        "ticker": ticker, "name": "", "description": "",
        "annual_reports": [], "concall_transcripts": [], "financials": {}
    }

    # Name
    h1 = soup.find("h1")
    result["name"] = h1.get_text(strip=True) if h1 else ticker

    # Description
    about = soup.find("div", class_="about") or soup.find("p", class_="sub")
    if about:
        result["description"] = about.get_text(" ", strip=True)[:600]

    # Financial tables: profit-loss, balance-sheet, cash-flow, ratios
    for sec_id in ["profit-loss", "balance-sheet", "cash-flow", "ratios"]:
        section = soup.find("section", id=sec_id)
        if not section:
            continue
        rows: Dict[str, List[str]] = {}
        for tr in section.find_all("tr"):
            cells = [td.get_text(strip=True) for td in tr.find_all(["td", "th"])]
            if cells and cells[0] and len(cells) > 1:
                rows[cells[0]] = cells[1:]
        if rows:
            result["financials"][sec_id] = rows

    # Document links: look for anchor tags pointing to PDFs
    ar_seen, cc_seen = set(), set()
    for a in soup.find_all("a", href=True):
        text = a.get_text(strip=True)
        href = a["href"] or ""
        if not href:
            continue
        full = href if href.startswith("http") else f"{SCREENER_BASE}{href}"
        tl = text.lower()
        if (("annual" in tl and "report" in tl) or "annual-report" in href.lower()):
            if full not in ar_seen:
                ar_seen.add(full)
                result["annual_reports"].append({"label": text or "Annual Report", "url": full})
        elif any(k in tl for k in ["concall", "transcript", "earnings call", "investor call"]):
            if full not in cc_seen:
                cc_seen.add(full)
                result["concall_transcripts"].append({"label": text or "Concall", "url": full})

    # Limit: 3 ARs (most recent), 6 concall transcripts
    result["annual_reports"]      = result["annual_reports"][-3:]
    result["concall_transcripts"] = result["concall_transcripts"][-6:]

    return result

def extract_pdf_text(url: str, max_pages: int = 60) -> str:
    """Download a PDF and extract all text. Returns empty string on failure."""
    if not url:
        return ""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=40, stream=True)
        if resp.status_code != 200:
            logger.warning(f"PDF {url} returned {resp.status_code}")
            return ""
        content = b""
        for chunk in resp.iter_content(chunk_size=1024 * 256):
            content += chunk
            if len(content) > 30 * 1024 * 1024:  # 30 MB cap
                break
        parts = []
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for i, page in enumerate(pdf.pages[:max_pages]):
                try:
                    text = page.extract_text()
                    if text:
                        parts.append(text.strip())
                except Exception:
                    pass
        return "\n\n".join(parts)
    except Exception as e:
        logger.error(f"extract_pdf_text failed ({url}): {e}")
        return ""

def chunk_text(text: str, chunk_size: int = 2000, overlap: int = 200) -> List[str]:
    """Split text into overlapping chunks."""
    if not text:
        return []
    paragraphs = text.split("\n\n")
    chunks, current = [], ""
    for para in paragraphs:
        if len(current) + len(para) < chunk_size:
            current += para + "\n\n"
        else:
            if current.strip():
                chunks.append(current.strip())
            # Overlap: keep last bit of previous chunk
            current = current[-overlap:] + para + "\n\n" if overlap else para + "\n\n"
    if current.strip():
        chunks.append(current.strip())
    return chunks

def ingest_company(ticker: str) -> Dict:
    """
    Full ingestion pipeline for a ticker:
    1. Scrape screener.in
    2. Download + parse PDFs
    3. Return list of chunks ready for DB storage.
    """
    logger.info(f"Starting ingestion for {ticker}")
    page = get_company_page(ticker)
    if not page:
        return {"ticker": ticker, "chunks": [], "error": "screener.in fetch failed"}

    all_chunks: List[Dict] = []
    chunk_idx = 0

    def process_docs(docs: List[Dict], doc_type: str):
        nonlocal chunk_idx
        for doc in docs:
            url = doc.get("url", "")
            label = doc.get("label", doc_type)
            logger.info(f"  Fetching {doc_type}: {label} ({url[:80]})")
            text = extract_pdf_text(url)
            if not text:
                logger.warning(f"  No text extracted from {url}")
                continue
            for chunk in chunk_text(text):
                all_chunks.append({
                    "ticker":      ticker,
                    "doc_type":    doc_type,
                    "label":       label,
                    "chunk_index": chunk_idx,
                    "content":     chunk,
                })
                chunk_idx += 1
            logger.info(f"  Got {chunk_idx} chunks so far")

    process_docs(page.get("annual_reports", []),      "annual_report")
    process_docs(page.get("concall_transcripts", []), "concall_transcript")

    # Also store the screener financials as a special chunk
    import json
    fin_text = json.dumps(page.get("financials", {}), indent=2)
    if fin_text:
        all_chunks.append({
            "ticker":      ticker,
            "doc_type":    "screener_financials",
            "label":       "Structured Financials (screener.in)",
            "chunk_index": chunk_idx,
            "content":     fin_text[:4000],
        })

    logger.info(f"Ingestion complete for {ticker}: {len(all_chunks)} chunks")
    return {"ticker": ticker, "name": page.get("name", ""), "chunks": all_chunks, "description": page.get("description", "")}
