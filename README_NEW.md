# Benchmark Storyteller

Compare your email campaign performance against vertical benchmarks (Retail & Media) and generate narrative insights plus actionable recommendations.

## Features
- Vertical benchmarks (retail, media) seeded locally
- Tabbed UI isolates vertical context (prevents cross-vertical mismatch)
- Grouped bar chart (Recharts) with performance coloring
- Narrative story & data-driven recommendations
- SQLite persistence (better-sqlite3, WAL)

## Tech Stack
Next.js App Router · React 18 · TypeScript · SQLite (better-sqlite3) · PapaParse · Recharts

## Prerequisites
Node 20.x (native module). If using nvm:
```bash
nvm use 20
```

## Install & Run
```bash
npm install
npm run dev
```
Visit http://localhost:3000

Production:
```bash
npm run build
npm start
```

## Data Population
Campaigns are seeded internally. External CSV uploads are intentionally disabled in this prototype (platform-managed data only).

## URL State
Active vertical persisted via ?v=retail|media.

## Scripts
- dev – start dev server
- build – production build
- start – run built app
- test – lightweight comparison sanity check

Run tests:
```bash
npm test
```

## Roadmap Ideas
- Persist selected campaign in query params
- Editable benchmarks via UI
- Automated regression tests (Vitest/Jest)
- Advanced recommendation heuristics / ML

## License
Internal prototype (add appropriate license if distributing externally).
