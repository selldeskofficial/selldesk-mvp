# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (localhost:5173)
npm run build      # production build → dist/
npm run preview    # serve dist/ locally
npm run lint       # ESLint
```

No test runner is configured.

## Environment

Copy `.env.example` to `.env` and set:
```
VITE_OPENROUTER_API_KEY=sk-or-v1-...
```

Without the key, AI features fall back to rule-based mock responses automatically — the app is fully functional without it.

## Architecture

Single-page React app (Vite + React 19). No router — screen state is managed in `App.jsx` with a `screen` string (`'home' | 'table' | 'results'`). Framer Motion `AnimatePresence` handles transitions between screens.

**Screen flow:**
```
HomeScreen → (onDataReady) → DataTable → (onAnalysisComplete) → ResultsDashboard
```
`App.jsx` owns all top-level state (`rows`, `results`, `csvWarning`) and passes callbacks down.

**Key files:**

- [src/App.jsx](src/App.jsx) — shell, screen routing, header, footer, `DemoModal` trigger
- [src/components/HomeScreen.jsx](src/components/HomeScreen.jsx) — landing page + CSV upload entry point
- [src/components/DataTable.jsx](src/components/DataTable.jsx) — editable menu table + context panel (weather/time/occasion) + triggers analysis
- [src/components/ResultsDashboard.jsx](src/components/ResultsDashboard.jsx) — metric cards, Recharts bar charts, flag list, recommendation cards
- [src/utils/ruleEngine.js](src/utils/ruleEngine.js) — pure functions; flags rows as danger/warning/success based on margin % and sold volume
- [src/utils/claudeApi.js](src/utils/claudeApi.js) — calls OpenRouter with 5 free model fallbacks; if all fail (e.g. 429 rate limits), returns rule-based mock recommendations. Returns `{ recs, source }` where `source` is `'ai' | 'rules'`
- [src/utils/csvParser.js](src/utils/csvParser.js) — parses uploaded CSVs; uses OpenRouter AI to infer column mapping, falls back to keyword heuristics if AI is unavailable

**Styling:** All CSS is in [src/index.css](src/index.css) (global tokens + landing) and [src/App.css](src/App.css) (layout, components, responsive). CSS custom properties in `:root` define the full design token set — warm beige palette, `--accent` blue, semantic danger/warning/success colours. No CSS modules or Tailwind.

**OpenRouter pattern:** Both `claudeApi.js` and `csvParser.js` iterate a `FREE_MODELS` array and `continue` on non-OK responses. Never throw on total failure — always degrade gracefully to local logic.

**Vite proxy:** `vite.config.js` proxies `/api/gemini` → Google Generative Language API. This is a leftover from an earlier iteration and is not currently used.
