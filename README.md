# NKG Want List Plus

A small React app for organizing your [Noble Knight Games](https://www.nobleknight.com/)
"My Want List" pages into custom, overlapping groups (e.g. "My CWBBS Want
List", "Grail List"). It's a static single-page app with no backend — it
scrapes your public want-list URL(s) client-side and stores everything in
your browser's `localStorage`.

## Features

- **Sources** — add one or more Noble Knight "My Want List" share URLs and
  refresh them to (re)scrape items.
- **Items** — browse all scraped items (title, publisher, product line,
  stock #, price/condition, image), search and filter by source or group.
- **Groups** — create any number of named groups/tags. A single item can
  belong to many groups at once.
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

All data (sources, items, groups, settings) is stored only in your browser's
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

Routing uses `HashRouter` so client-side routes (`#/groups`, `#/sources`,
etc.) work on GitHub Pages without needing server-side rewrite rules.
