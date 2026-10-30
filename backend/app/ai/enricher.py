import anthropic
import json
import logging
from typing import Dict, Optional
from app.config import ANTHROPIC_API_KEY, HAIKU_MODEL
from app.data.announcements import fetch_pdf_text

logger = logging.getLogger(__name__)
_client = None

def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    return _client

def enrich_announcement(ann: Dict) -> Dict:
    """Route to the right enricher based on category. Returns updated ann dict."""
    cat = ann.get("category")
    try:
        if cat == "results":
            ann["enrichment"] = _enrich_results(ann)
        elif cat == "management_change":
            ann["enrichment"] = _enrich_mgmt_change(ann)
        elif cat == "M&A":
            ann["enrichment"] = _enrich_ma(ann)
        elif cat == "credit_rating":
            ann["enrichment"] = _enrich_rating(ann)
        elif cat == "dividend":
            ann["enrichment"] = _enrich_dividend(ann)
    except Exception as e:
        logger.error(f"Enrichment failed for {ann.get('ticker')} {cat}: {e}")
    return ann

def _clean_json(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return raw.strip()

def _enrich_results(ann: Dict) -> Optional[Dict]:
    pdf_url = ann.get("attachment_url", "")
    filing_text = fetch_pdf_text(pdf_url, max_pages=30) if pdf_url else ""
    if not filing_text:
        filing_text = f"Title: {ann.get('title','')}\nSubject: {ann.get('subject','')}"

    prompt = f"""Extract headline financial figures for {ann['ticker']} from this results filing text.
Extract ONLY numbers explicitly stated. Set to null if not found. Return valid JSON only.

Filing text (first 6000 chars):
{filing_text[:6000]}

Return:
{{
  "period": "Q2 FY25",
  "revenue":  {{"current":null,"prev_quarter":null,"prev_year":null,"unit":"Cr"}},
  "ebitda":   {{"current":null,"prev_quarter":null,"prev_year":null,"unit":"Cr"}},
  "ebitda_margin_pct": {{"current":null,"prev_quarter":null,"prev_year":null}},
  "pbt":      {{"current":null,"prev_quarter":null,"prev_year":null,"unit":"Cr"}},
  "pat":      {{"current":null,"prev_quarter":null,"prev_year":null,"unit":"Cr"}},
  "key_highlight": "one sentence with the single most important number from the filing"
}}"""

    try:
        resp = _get_client().messages.create(
            model=HAIKU_MODEL,
            max_tokens=600,
            messages=[{"role": "user", "content": prompt}],
        )
        data = json.loads(_clean_json(resp.content[0].text))
        # Compute QoQ / YoY percentages
        for metric in ["revenue", "ebitda", "pbt", "pat"]:
            m = data.get(metric, {})
            if m and m.get("current") and m.get("prev_quarter"):
                m["qoq_pct"] = round(((m["current"] - m["prev_quarter"]) / m["prev_quarter"]) * 100, 1)
            if m and m.get("current") and m.get("prev_year"):
                m["yoy_pct"] = round(((m["current"] - m["prev_year"]) / m["prev_year"]) * 100, 1)
        return data
    except Exception as e:
        logger.error(f"Results enrichment parse error: {e}")
        return None

def _enrich_mgmt_change(ann: Dict) -> Optional[Dict]:
    title = ann.get("title", "")
    subject = ann.get("subject", "")
    combined = f"{title}\n{subject}"
    prompt = f"""Extract management change details from this NSE announcement for {ann['ticker']}.
Text: {combined[:800]}

Return JSON only:
{{
  "change_type": "appointment|resignation|retirement|re-appointment",
  "role": "CEO|CFO|MD|Director|...",
  "person_name": "Full Name or null",
  "effective_date": "YYYY-MM-DD or null",
  "incoming_background": "Brief professional background if you know this person [external context]",
  "outgoing_context": "Reason for leaving if mentioned, else null"
}}"""
    try:
        resp = _get_client().messages.create(
            model=HAIKU_MODEL,
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
        return json.loads(_clean_json(resp.content[0].text))
    except Exception as e:
        logger.error(f"Mgmt change enrichment error: {e}")
        return None

def _enrich_ma(ann: Dict) -> Optional[Dict]:
    combined = f"{ann.get('title','')} {ann.get('subject','')}".strip()
    prompt = f"""Extract M&A details from: {combined[:600]}
Return JSON: {{"deal_type":"acquisition|merger|demerger|JV|stake_sale","target_entity":"name or null","deal_size_cr":null,"stake_pct":null,"strategic_rationale":"from text or null"}}"""
    try:
        resp = _get_client().messages.create(model=HAIKU_MODEL, max_tokens=300,
            messages=[{"role": "user", "content": prompt}])
        return json.loads(_clean_json(resp.content[0].text))
    except Exception as e:
        logger.error(f"M&A enrichment error: {e}")
        return None

def _enrich_rating(ann: Dict) -> Optional[Dict]:
    combined = f"{ann.get('title','')} {ann.get('subject','')}".strip()
    prompt = f"""Extract credit rating details from: {combined[:500]}
Return JSON: {{"agency":"CRISIL|ICRA|CARE|India Ratings|null","instrument":"NCDs|bank facilities|null","rating":"AA+|null","outlook":"Stable|Positive|Negative|Watch|null","action":"assigned|upgraded|downgraded|reaffirmed"}}"""
    try:
        resp = _get_client().messages.create(model=HAIKU_MODEL, max_tokens=200,
            messages=[{"role": "user", "content": prompt}])
        return json.loads(_clean_json(resp.content[0].text))
    except Exception as e:
        return None

def _enrich_dividend(ann: Dict) -> Optional[Dict]:
    combined = f"{ann.get('title','')} {ann.get('subject','')}".strip()
    prompt = f"""Extract dividend details from: {combined[:500]}
Return JSON: {{"amount_per_share":null,"dividend_type":"interim|final","record_date":"YYYY-MM-DD or null"}}"""
    try:
        resp = _get_client().messages.create(model=HAIKU_MODEL, max_tokens=150,
            messages=[{"role": "user", "content": prompt}])
        return json.loads(_clean_json(resp.content[0].text))
    except Exception as e:
        return None
