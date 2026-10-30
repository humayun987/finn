from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_SERVICE_KEY
import logging
import redis as redis_lib
from app.config import UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN
import json

logger = logging.getLogger(__name__)

_supabase: Client = None
_redis = None

def get_client() -> Client:
    global _supabase
    if _supabase is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        _supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase

def get_redis():
    global _redis
    if _redis is None and UPSTASH_REDIS_URL:
        try:
            _redis = redis_lib.from_url(
                UPSTASH_REDIS_URL,
                password=UPSTASH_REDIS_TOKEN,
                decode_responses=True,
                socket_connect_timeout=3,
            )
            _redis.ping()
            logger.info("Redis connected")
        except Exception as e:
            logger.warning(f"Redis unavailable, using no cache: {e}")
            _redis = None
    return _redis

def cache_get(key: str):
    r = get_redis()
    if r is None:
        return None
    try:
        val = r.get(key)
        return json.loads(val) if val else None
    except Exception:
        return None

def cache_set(key: str, value, ttl: int = 3600) -> None:
    r = get_redis()
    if r is None:
        return
    try:
        r.setex(key, ttl, json.dumps(value, default=str))
    except Exception:
        pass

def cache_delete(key: str) -> None:
    r = get_redis()
    if r is None:
        return
    try:
        r.delete(key)
    except Exception:
        pass
