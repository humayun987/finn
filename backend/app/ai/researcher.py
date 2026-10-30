import anthropic
import json
import logging
from typing import Dict, List, Optional
from app.config import ANTHROPIC_API_KEY, COMPANY_NAMES, SECTORS, SONNET_MODEL

logger = logging.getLogger(__name__)
_client = None

def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    return _client

def _build_context(ticker: str, chunks: List[Dict]) -> str:
    """Organise chunks into a structured context block."""
    ar_chunks  = [c for c in chunks if c.get("doc_type") == "annual_report"]
    cc_chunks  = [c for c in chunks if c.get("doc_type") == "concall_transcript"]
    fin_chunks = [c for c in chunks if c.get("doc_type") == "screener_financials"]

    sections = []
    if fin_chunks:
        sections.append("=== STRUCTURED FINANCIALS (screener.in) ===\n" + fin_chunks[0]["content"])
    if ar_chunks:
        ar_text = "\n---\n".join(c["content"] for c in ar_chunks[:60])
        sections.append(f"=== ANNUAL REPORT EXCERPTS ({len(ar_chunks)} chunks) ===\n{ar_text}")
    if cc_chunks:
        cc_text = "\n---\n".join(c["content"] for c in cc_chunks[:40])
        sections.append(f"=== CONCALL TRANSCRIPT EXCERPTS ({len(cc_chunks)} chunks) ===\n{cc_text}")

    return "\n\n".join(sections)

def research_company(ticker: str, chunks: List[Dict]) -> Dict:
    """
    Full pull-side research using Claude Sonnet.
    chunks: all document chunks from DB for this ticker.
    Returns structured research dict.
    """
    if not chunks:
        return {
            "ticker": ticker,
            "error": "No documents available. Trigger ingestion first.",
            "status": "no_documents"
        }

    context = _build_context(ticker, chunks)
    name = COMPANY_NAMES.get(ticker, ticker)
    sector = SECTORS.get(ticker, "")

    system = """You are FINN, a forensic financial analyst. You analyse Indian listed companies.
CRITICAL: Base ALL analysis ONLY on the context provided. Do NOT use outside knowledge about the company.
If data is not in the context, write "not found in available documents" — never invent figures.
Be specific: every claim needs a number, a quarter, or a direct quote from management.
Never write vague language: no "well-positioned", no "strong momentum", no "cautiously optimistic"."""

    user = f"""Analyse {name} ({ticker}, sector: {sector}) using ONLY the following primary-source context.

{context[:150000]}

Return a single JSON object with this exact structure. Every field is required.
If data is unavailable for a field, use null or "not found in available documents".

{{
  "ticker": "{ticker}",
  "company_name": "{name}",
  "sector": "{sector}",
  "data_note": "brief note on which documents were available (e.g. FY24 AR + last 4 concalls)",

  "business_snapshot": {{
    "what_they_do": "2-3 sentences on the business from the documents",
    "segments": [{{"name":"Segment","revenue_share_pct":null,"ebitda_share_pct":null}}],
    "key_markets": ["India domestic"],
    "moat_claim": "Exact or close paraphrase of what management says differentiates them"
  }},

  "financial_snapshot": {{
    "revenue_ttm_cr": null,
    "revenue_cagr_3y_pct": null,
    "ebitda_margin_pct": null,
    "ebitda_margin_trend": "expanding|stable|compressing|unknown",
    "pat_ttm_cr": null,
    "roe_pct": null,
    "roce_pct": null,
    "de_ratio": null,
    "fcf_positive": null,
    "period_note": "e.g. FY24 TTM"
  }},

  "trajectory": {{
    "revenue_trend": "accelerating|stable|decelerating|unknown",
    "margin_trend": "expanding|stable|compressing|unknown",
    "key_driver": "What specifically is driving growth or decline — with figures",
    "key_concern": "The one thing in the data that should worry the investor — specific, named"
  }},

  "narrative_vs_numbers": {{
    "claims": [
      {{
        "management_said": "Exact or close paraphrase — include source period e.g. Q2 FY25 concall",
        "numbers_show": "What the actual filed numbers show vs this claim",
        "verdict": "exceeded|on_track|behind|too_early_to_tell"
      }}
    ],
    "track_record_summary": "X of Y guidance metrics delivered in last N quarters (from docs)",
    "biggest_divergence": "The single largest gap between management promise and delivery — specific"
  }},

  "guidance": {{
    "items": [
      {{
        "metric": "Revenue growth",
        "what_management_said": "15-18% for FY26",
        "source_period": "Q2 FY25 concall",
        "current_run_rate": "running at 12% YoY in H1 FY25",
        "likelihood": "achievable|stretched|unlikely",
        "reason": "one line"
      }}
    ],
    "capex_guided_cr": null,
    "capex_note": null
  }},

  "bull_case": {{
    "points": ["Specific bullish point with figure from docs", "Second point"],
    "key_catalyst": "The one near-term event or metric that confirms the bull case"
  }},

  "bear_case": {{
    "points": ["Specific risk with figure from docs", "Second risk"],
    "key_risk": "The single thing that breaks the investment case — specific and named"
  }}
}}"""

    try:
        resp = _get_client().messages.create(
            model=SONNET_MODEL,
            max_tokens=4000,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        raw = resp.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.rstrip("```").strip()
        result = json.loads(raw)
        result["status"] = "ok"
        return result
    except json.JSONDecodeError as e:
        logger.error(f"Research JSON parse error for {ticker}: {e}")
        return {"ticker": ticker, "status": "parse_error", "raw": resp.content[0].text[:500]}
    except Exception as e:
        logger.error(f"Research API error for {ticker}: {e}")
        return {"ticker": ticker, "status": "error", "error": str(e)}
