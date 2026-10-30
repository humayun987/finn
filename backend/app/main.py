from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting FINN backend...")
    from app.scheduler import start_scheduler
    start_scheduler()
    yield
    from app.scheduler import stop_scheduler
    stop_scheduler()
    logger.info("FINN backend shut down")

app = FastAPI(title="FINN API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import push, pull, portfolio, chat as chat_api

app.include_router(push.router,      prefix="/api/push",      tags=["push"])
app.include_router(pull.router,      prefix="/api/pull",      tags=["pull"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])
app.include_router(chat_api.router,  prefix="/api/chat",      tags=["chat"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "finn-backend"}
