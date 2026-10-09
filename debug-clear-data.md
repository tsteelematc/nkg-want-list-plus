# Debugging "Clear all data" — prompts

1. clear all data does not seem to work
2. still doesnt work
3. nah, extension options, clear, no apparent behavior, return to nkg want list, lists still there, refresh, still there, am i doing wrong or not working
4. unless you npm run build doesn't update same as me, since i did not run it manually this time
5. no feedback, not clearing, maybe some console.logs for debugging
6. (pasted console output from the NKG want-list page: tracking-prevention, reCAPTCHA noise, and `[NKG WLP clear-debug] Syncing page items. {itemCount: 17}`)
7. ah, finally saw confirmation and it worked, any cleanup needed before committing this, also put my prompts into debug-clear-data.md

## Root cause

The options page opened in Chrome's embedded `chrome://extensions` dialog, where
`confirm()` is silently blocked, so the Clear button always behaved as cancelled.

## Fix

- Replaced `confirm()` with an inline "Yes, delete everything" / "Cancel" confirmation.
- Added a success message after clearing.
- Options page now opens in its own tab (`manifest.open_in_tab` meta tag in `entrypoints/options/index.html`).
