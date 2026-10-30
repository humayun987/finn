import anthropic
import json
import logging
from typing import List, Dict
from app.config import ANTHROPIC_API_KEY, CATEGORY_PRIORITY, MATERIAL_CATEGORIES, ALL_CATEGORIES, HAIKU_MODEL

logger = logging.getLogger(__name__)
_client = None

def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    return _client

def classify_announcements_batch(announcements: List[Dict]) -> List[Dict]:
    """Classify a batch of announcements using Claude Haiku (cheap). Returns annotated list."""
    if not announcements:
        return []

    BATCH = 40  # max items per API call
    results = []
    for i in range(0, len(announcements), BATCH):
        batch = announcements[i:i + BATCH]
        results.extend(_classify_batch(batch))
    return results

def _classify_batch(batch: List[Dict]) -> List[Dict]:
    items_text = "\n".join(
        f"[{i}] TICKER:{a['ticker']} | TITLE:{(a.get('title') or '')[:120]} | SUBJECT:{(a.get('subject') or '')[:80]}"
        for i, a in enumerate(batch)
    )

    prompt = f"""Classify each NSE/BSE corporate announcement. Return ONLY a JSON array.

Categories: {', '.join(ALL_CATEGORIES)}

Items:
{items_text}

Rules:
- summary: max 15 words, must include a specific fact/number if visible in title; never generic
- confidence: 0.0-1.0
- Use "unclassified" only for routine compliance paperwork with no investment relevance

Return format (one object per item, no extra text):
[{{"index":0,"category":"results","summary":"Q2 FY25 results — revenue and PAT filed","confidence":0.95}},...]"""

    try:
        resp = _get_client().messages.create(
            model=HAIKU_MODEL,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = resp.content[0].text.strip()
        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        classifications = json.loads(raw)
    except Exception as e:
        logger.error(f"Classification API error: {e}")
        classifications = []

    cls_map = {c.get("index"): c for c in classifications if isinstance(c, dict)}
    output = []
    for i, ann in enumerate(batch):
        cls = cls_map.get(i, {})
        cat = cls.get("category", "unclassified")
        if cat not in CATEGORY_PRIORITY:
            cat = "unclassified"
        output.append({
            **ann,
            "category":    cat,
            "summary":     cls.get("summary", (ann.get("title") or "")[:100]),
            "priority":    CATEGORY_PRIORITY.get(cat, 9),
            "is_material": cat in MATERIAL_CATEGORIES,
            "confidence":  cls.get("confidence", 0.5),
            "enrichment":  None,
        })
    output.sort(key=lambda x: x["priority"])
    return output
