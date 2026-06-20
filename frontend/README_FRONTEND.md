# ClaimGuard AI — Frontend (React + Vite + TypeScript)

White-theme enterprise healthcare dashboard for the ClaimGuard AI MVP. Navy text,
teal/blue accents, soft cards, Recharts charts, Lucide icons.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

The dev server proxies `/api/*` → `http://localhost:8000` (FastAPI). Start the
backend first. Override the API base with `VITE_API_BASE` if needed.

```bash
npm run build      # tsc -b && vite build  (type-check + production build)
npm run preview    # serve the production build
```

## Routes / pages

| Route | Page |
|---|---|
| `/` | Landing / Overview |
| `/claims` | Claims Dashboard (filter + search) |
| `/claims/new` | Claim Intake / Hospital Submission (live risk preview) |
| `/claims/:id` | Claim Review (auditor workspace + decision modal) |
| `/claims/:id/report` | Explainable Decision Report (print / export / waterfall) |
| `/agents/:claimId` | Multi-Agent Verification (animated Run Verification) |
| `/analytics` | Analytics Dashboard (Recharts) |
| `/fraud` | Fraud Investigation Workspace |
| `/forensics` | Forensic Analytics Lab (Benford, peer outliers, identity, network) |
| `/hospital` | Hospital Portal |
| `/audit` | Audit Logs |
| `/feedback` | Feedback Learning Loop |
| `/architecture` | System Architecture |
| `/demo-guide` | Demo Guide (5-min script) |

## Structure

```
src/
  main.tsx App.tsx          entry + router
  pages/                    14 route pages
  components/               Layout, RiskGauge, ClaimTable, AgentCard,
                            EvidenceTable, AuditTimeline, ScoreWaterfall, ui.tsx
  api/client.ts             typed axios client
  types/index.ts            shared types (mirror backend schemas)
  data/catalogue.ts         signal/agent/decision catalogues
  utils/                    format.ts (currency/dates/colors), useAsync.ts
  styles/index.css          Tailwind theme + component classes
```

## Reusable components

Layout · Sidebar/Topbar · StatCard · RiskBadge · StatusBadge · ClaimTable ·
RiskGauge · AgentCard · EvidenceTable · AuditTimeline · ScoreWaterfall · ChartCard ·
LoadingState · EmptyState · ErrorState · Modal · MvpBadge · PageIntro.

Every page shows a "What this page demonstrates" line and an **MVP Simulation**
badge. See [../docs/LIMITATIONS.md](../docs/LIMITATIONS.md).
