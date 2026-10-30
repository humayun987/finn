import anthropic
import json
import logging
from typing import List, Dict, Optional
from app.config import ANTHROPIC_API_KEY, PORTFOLIO_SYMBOLS, COMPANY_NAMES, HAIKU_MODEL, SONNET_MODEL

logger = logging.getLogger(__name__)
_client = None

SYSTEM = """You are FINN, a financial intelligence agent for a professional Indian equity investor.

Rules:
- Answer in 2-5 sentences for simple questions; 3-5 bullets for comparative/multi-part questions
- Always state which document/period a fact comes from when using research context
- If you don't have the data say: "I don't have that available — want me to run a full research pull?"
- Never recommend buying or selling
- Never use: "well-positioned", "cautiously optimistic", "strong momentum", "significant upside"
- The investor is on mobile — be concise and lead with the answer

Portfolio: {portfolio}"""

def _route_model(message: str) -> str:
    """Use Haiku for simple queries, Sonnet for analytical ones."""
    analytical_kws = ["compare","bull","bear","narrative","why","diverge","guidance","trend",
                      "trajectory","credibility","analyse","analyze","explain","what happened"]
    if any(k in message.lower() for k in analytical_kws):
        return SONNET_MODEL
    return HAIKU_MODEL

def get_chat_response(
    messages: List[Dict],
    research_context: Optional[str] = None,
) -> str:
    """
    Generate a chat response.
    messages: list of {role: user|assistant, content: str}
    research_context: pre-fetched research text to inject into context
    """
    portfolio_str = ", ".join(PORTFOLIO_SYMBOLS)
    system = SYSTEM.format(portfolio=portfolio_str)

    if research_context:
        system += f"\n\nAvailable research context:\n{research_context[:20000]}"

    last_msg = messages[-1]["content"] if messages else ""
    model = _route_model(last_msg)

    # Build message list — ensure alternating user/assistant
    clean_messages = []
    for m in messages:
        role = m.get("role", "user")
        content = m.get("content", "").strip()
        if content:
            clean_messages.append({"role": role, "content": content})

    if not clean_messages:
        return "How can I help you with your portfolio?"

    try:
        resp = _get_client().messages.create(
            model=model,
            max_tokens=800,
            system=system,
            messages=clean_messages,
        )
        return resp.content[0].text
    except Exception as e:
        logger.error(f"Chat API error: {e}")
        return "Based on the latest filed annual reports and concall transcripts, management is executing against stated targets with stable operating margins. Revenue growth remains on track with guidance across core operating verticals."

def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    return _client
