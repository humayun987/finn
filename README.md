# FINN — Financial Intelligence Agent
ENAM AI Engineer Build Challenge | antigravity

## What it does
- **Push**: Filtered digest of NSE filings — classified, prioritised, enriched with headline numbers or exec bios
- **Pull**: On-demand research for any NSE-listed company, grounded in annual reports + concall transcripts
- **Chat**: Conversational Q&A routed to the right model (Haiku for simple, Sonnet for analysis)

## Stack
- **Backend**: FastAPI (Python) on Render
- **Frontend**: Next.js 14 + Tailwind on Vercel
- **DB**: Supabase (PostgreSQL for all storage)
- **Cache**: Upstash Redis (optional)
- **AI**: Anthropic Claude Haiku (bulk) + Sonnet (reasoning)
- **Data**: yfinance + NSE API + screener.in

## Setup

### 1. Clone and install
```bash
git clone <your-repo>
cd finn/backend && pip install -r requirements.txt
cd finn/frontend && npm install
```

### 2. Environment variables

**Backend** (`backend/.env`):
```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
UPSTASH_REDIS_URL=rediss://...   # optional
UPSTASH_REDIS_TOKEN=...          # optional
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Database
Run `supabase_schema.sql` in your Supabase SQL editor.

### 4. Run locally
```bash
# Terminal 1 — backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm run dev
```

### 5. Deploy

**Backend → Render**
- New Web Service → connect repo → root directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Add env vars in Render dashboard

**Frontend → Vercel**
```bash
cd frontend
vercel --prod
# Set NEXT_PUBLIC_API_URL=https://your-render-url.onrender.com
```

## Architecture
```
NSE API → fetch_announcements() → classify (Haiku) → enrich (Haiku) → Supabase
yfinance → detect_anomalies() → Supabase

screener.in → PDFs → pdfplumber → chunks → Supabase
chunks → researcher (Sonnet) → research_cache → API → Frontend
```

## Model routing
| Task | Model | Cost/call |
|---|---|---|
| Classify 40 announcements | claude-haiku-5-5 | ~$0.001 |
| Enrich results filing | claude-haiku-5-5 | ~$0.001 |
| Full pull research | claude-sonnet-4-6 | ~$0.05 |
| Chat (simple) | claude-haiku-5-5 | ~$0.001 |
| Chat (analytical) | claude-sonnet-4-6 | ~$0.02 |
