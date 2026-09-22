# NKG Want List Plus

A mobile-first list manager for organizing items from [Noble Knight Games](https://www.nobleknight.com/)
want-list pages into your own ranked lists (for example: "My CWBBS Want List",
"Grail List"). This version runs as a browser extension and reads the live
want-list DOM directly, so it avoids CORS and proxy issues entirely.

## Features

- **Bottom-panel UI** — the extension injects a compact mobile-friendly panel
  onto Noble Knight want-list pages.
- **Lists** — create custom groups/lists. A single item can belong to many
  lists at once, and each list keeps its own independent order.
- **Compact rows** — each row shows only the title, publisher, and stock
  status. Tapping a row scrolls the matching product card on the real Noble
  Knight page into view instead of duplicating product details inside the panel.
- **No scraping proxy** — because the extension uses a content script, it
  reads the live DOM directly from the actual page you're already on.
- **Settings** — export/import JSON backups and manage list data from the
  options page.

## Install and test locally

1. Run `npm install`.
2. Run `npm run build` to generate the unpacked extension bundle.
3. Open `chrome://extensions` (or `edge://extensions`) in Chromium-based
   browsers.
4. Enable **Developer mode**.
5. Click **Load unpacked** and point it at the generated build folder:
   `.output/chrome-mv3`.
6. Visit a Noble Knight want-list page and reload the tab.
7. The panel should appear at the bottom of the page; tap rows to jump to the
   corresponding product card on the live page.

## Data & privacy

All data is stored locally in the browser via `chrome.storage.local`.
Nothing is uploaded to a server as part of the extension's normal list
management flow. Use the options page to export and import JSON backups when
moving data between machines.

## Development

```bash
npm install
npm run dev       # start WXT dev mode for extension development
npm run build     # production build for Chrome/Edge
npm run lint      # oxlint
npm run compile    # TypeScript type-check
```
