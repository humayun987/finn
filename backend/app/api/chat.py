from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import logging

from app.ai.chat import get_chat_response
from app.db.queries import get_research, get_document_chunks
from app.config import PORTFOLIO_SYMBOLS

router = APIRouter()
logger = logging.getLogger(__name__)

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    ticker_context: Optional[str] = None  # optional: pull research for this ticker

@router.post("/")
async def chat(req: ChatRequest):
    msgs = [{"role": m.role, "content": m.content} for m in req.messages]

    # Auto-detect ticker mentions in last message for context injection
    last = msgs[-1]["content"].lower() if msgs else ""
    context_text = None
    for ticker in PORTFOLIO_SYMBOLS:
        if ticker.lower() in last or (req.ticker_context and req.ticker_context.upper() == ticker):
            cached = await get_research(ticker)
            if cached and cached.get("result"):
                import json
                context_text = f"Research for {ticker}:\n{json.dumps(cached['result'], indent=2)}"
            break

    response = get_chat_response(msgs, research_context=context_text)
    return {"response": response}
