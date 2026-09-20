# NKG Want List Plus

A mobile-first list manager for organizing your [Noble Knight Games](https://www.nobleknight.com/)
"My Want List" pages into your own ranked lists (e.g. "My CWBBS Want List",
"Grail List"). It's a static single-page app with no backend — it scrapes
your public want-list URL(s) client-side and stores everything in your
browser's `localStorage`.

## Features

- **Lists (home tab)** — create any number of named lists. A single item can
  belong to many lists at once, and **each list keeps its own independent
  order** (an item can be #1 in "Grail List" and #5 in "CWBBS Want List").
  Reorder items with simple move up/down controls — no drag-and-drop needed.
- **Items tab** — browse/search everything scraped from your sources and
  assign items to any number of lists.
- **Compact rows** — each row shows just the title, publisher, and a small
  thumbnail; tap a row to expand full details (price/condition, stock #,
  product line, source, link to the product page).
- **Sources** — add one or more Noble Knight "My Want List" share URLs and
  refresh them to (re)scrape items.
- **Settings** — configure the CORS proxy used for scraping, export/import a
  JSON backup, or paste a saved page's HTML as a fallback import method.

## Why a CORS proxy / paste-HTML fallback?

Browsers block cross-origin requests to `nobleknight.com` from a page hosted
on GitHub Pages, so the app fetches want-list pages through a configurable
CORS proxy (default: `https://api.allorigins.win/raw?url=`). Public proxies
can be rate-limited or go down, so as a fallback you can manually save/copy a
want-list page's HTML source and paste it into the Settings page to import
items without a proxy at all.

## Data & privacy

All data (sources, items, lists, settings) is stored only in your browser's
`localStorage` — nothing is sent to a server other than the scrape requests
themselves. Use **Settings → Export JSON backup** regularly, or to move your
data to another browser/device.

## Development

```bash
npm install
npm run dev       # start local dev server
npm run build     # type-check + production build to dist/
npm run lint      # oxlint
npm run preview   # preview the production build locally
```

## Deployment (GitHub Pages)

A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the app and
publishes `dist/` to GitHub Pages on every push to `main`. In the repo
settings, set **Settings → Pages → Source** to "GitHub Actions".

`vite.config.ts` sets `base: '/nkg-want-list-plus/'` to match this repo name
so built asset paths resolve correctly under
`https://<user>.github.io/nkg-want-list-plus/`. If you rename/fork the repo,
update `base` to match.

The UI is mobile-first (bottom tab navigation, single-column lists,
large tap targets) with responsive breakpoints that widen content on larger
screens. Routing uses `HashRouter` so client-side routes (`#/groups/:id`,
`#/sources`, etc.) work on GitHub Pages without needing server-side rewrite
rules.
