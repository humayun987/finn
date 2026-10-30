from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
import logging

logger = logging.getLogger(__name__)
_scheduler: BackgroundScheduler = None

def run_announcement_pipeline():
    try:
        from app.data.announcements import fetch_announcements
        from app.ai.classifier import classify_announcements_batch
        from app.db.queries import save_announcements, get_last_ann_timestamp
        from app.config import PORTFOLIO_SYMBOLS
        import asyncio

        logger.info("Running announcement pipeline...")
        raw = fetch_announcements(PORTFOLIO_SYMBOLS, hours=2)
        if not raw:
            logger.info("No new announcements")
            return
        classified = classify_announcements_batch(raw)
        # Run async save in sync context
        loop = asyncio.new_event_loop()
        loop.run_until_complete(save_announcements(classified))
        loop.close()
        logger.info(f"Saved {len(classified)} announcements")
    except Exception as e:
        logger.error(f"Announcement pipeline error: {e}")

def run_price_pipeline():
    try:
        from app.data.prices import fetch_prices, detect_anomalies
        from app.db.queries import save_price_alerts
        from app.config import PORTFOLIO_SYMBOLS
        import asyncio

        logger.info("Running price pipeline...")
        df = fetch_prices(PORTFOLIO_SYMBOLS, period="30d")
        alerts = detect_anomalies(df)
        if alerts:
            loop = asyncio.new_event_loop()
            loop.run_until_complete(save_price_alerts(alerts))
            loop.close()
            logger.info(f"Saved {len(alerts)} price alerts")
    except Exception as e:
        logger.error(f"Price pipeline error: {e}")

def start_scheduler():
    global _scheduler
    _scheduler = BackgroundScheduler(timezone="UTC")
    # Announcements every 30 min
    _scheduler.add_job(run_announcement_pipeline, IntervalTrigger(minutes=30), id="announcements", replace_existing=True)
    # EOD prices at 10:45 UTC (4:15 PM IST)
    _scheduler.add_job(run_price_pipeline, CronTrigger(hour=10, minute=45), id="eod_prices", replace_existing=True)
    _scheduler.start()
    logger.info("Scheduler started")

def stop_scheduler():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
