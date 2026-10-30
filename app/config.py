import os
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
HAIKU_MODEL: str = os.getenv("ANTHROPIC_HAIKU_MODEL", "claude-3-5-haiku-20241022")
SONNET_MODEL: str = os.getenv("ANTHROPIC_SONNET_MODEL", "claude-3-5-sonnet-20241022")
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
UPSTASH_REDIS_URL: str = os.getenv("UPSTASH_REDIS_URL", "")
UPSTASH_REDIS_TOKEN: str = os.getenv("UPSTASH_REDIS_TOKEN", "")

PORTFOLIO_SYMBOLS: List[str] = [
    "RELIANCE", "TCS", "INFY", "HDFCBANK", "ITC",
    "ZOMATO", "NYKAA", "DELHIVERY", "TRENT", "JIOFIN",
    "DIXON", "POLYCAB", "JSWSTEEL", "BAJFINANCE",
    "NTPC", "COALINDIA", "ONGC",
    "SUNPHARMA", "MARUTI", "TATAMOTORS",
]

COMPANY_NAMES: Dict[str, str] = {
    "RELIANCE": "Reliance Industries", "TCS": "Tata Consultancy Services",
    "INFY": "Infosys", "HDFCBANK": "HDFC Bank", "ITC": "ITC Limited",
    "ZOMATO": "Zomato", "NYKAA": "Nykaa (FSN E-Commerce)",
    "DELHIVERY": "Delhivery", "TRENT": "Trent Limited",
    "JIOFIN": "Jio Financial Services", "DIXON": "Dixon Technologies",
    "POLYCAB": "Polycab India", "JSWSTEEL": "JSW Steel",
    "BAJFINANCE": "Bajaj Finance", "NTPC": "NTPC Limited",
    "COALINDIA": "Coal India", "ONGC": "ONGC",
    "SUNPHARMA": "Sun Pharmaceutical", "MARUTI": "Maruti Suzuki",
    "TATAMOTORS": "Tata Motors",
}

SECTORS: Dict[str, str] = {
    "RELIANCE": "Energy/Retail/Telecom", "TCS": "IT Services",
    "INFY": "IT Services", "HDFCBANK": "Banking", "ITC": "FMCG",
    "ZOMATO": "Food Delivery", "NYKAA": "Beauty E-commerce",
    "DELHIVERY": "Logistics", "TRENT": "Retail",
    "JIOFIN": "NBFC/Fintech", "DIXON": "Electronics EMS",
    "POLYCAB": "Wires & Cables", "JSWSTEEL": "Steel",
    "BAJFINANCE": "NBFC", "NTPC": "Power", "COALINDIA": "Mining",
    "ONGC": "Oil & Gas", "SUNPHARMA": "Pharma",
    "MARUTI": "Auto", "TATAMOTORS": "Auto/EV",
}

CATEGORY_PRIORITY: Dict[str, int] = {
    "results": 1, "M&A": 1,
    "management_change": 2, "litigation": 2, "fund_raise": 2, "credit_rating": 2,
    "capex": 3, "dividend": 3,
    "press_release": 4, "earnings_call": 4,
    "investor_meetings": 5, "bonus_split": 5, "pledging": 5, "insider_trading": 5,
    "postal_ballot": 6, "agm_egm": 6,
    "unclassified": 9,
}

MATERIAL_CATEGORIES = {"results", "M&A", "management_change", "litigation", "fund_raise", "credit_rating", "capex", "dividend"}
ALL_CATEGORIES = list(CATEGORY_PRIORITY.keys())

DEFAULT_PRICE_THRESHOLD_PCT: float = 5.0
DEFAULT_VOLUME_MULTIPLIER: float = 2.0

RESEARCH_CACHE_TTL: int = 86400   # 24h
PRICE_CACHE_TTL: int = 3600       # 1h
ANN_CACHE_TTL: int = 1800         # 30min
