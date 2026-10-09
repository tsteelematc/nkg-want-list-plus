# Publishing and promotion notes

## Recommended release path

Start with the **Chrome Web Store**, then consider publishing separately to
**Microsoft Edge Add-ons** after confirming the extension works as expected in
Edge. Consider Firefox later if there is user demand and time for a dedicated
compatibility pass.

The project is a WXT-based Chromium extension with a Chrome Manifest V3 build,
icons, and an `npm run zip` packaging script. Its current README describes
local installation in Chrome and Edge. The extension is designed for Noble
Knight Games want-list pages and stores list data locally in browser storage.

## First-release checklist

- Set a real initial version number and verify the generated package.
- Test the packaged extension on real Noble Knight want-list pages in Chrome;
  test Edge separately before listing there.
- Prepare a clear store description, screenshots, and a concise explanation of
  the extension's single purpose.
- Write a truthful privacy policy and clearly disclose local storage and the
  page access the extension requires. Keep permission explanations narrow.
- Submit the ZIP and listing information through the relevant store dashboard,
  then allow time for review.

Official guides:

- [Chrome Web Store: publish an item](https://developer.chrome.com/docs/webstore/publish/)
- [Chrome Web Store: prepare your extension](https://developer.chrome.com/docs/webstore/prepare/)
- [Chrome Web Store: privacy disclosures](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/)
- [Microsoft Edge Add-ons: publish an extension](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)
- [Mozilla Add-ons: submit an add-on](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)

Note: `private: true` in `package.json` affects npm package publishing; it does
not prevent submitting a browser-extension ZIP to an extension store.

## Local promotion idea

1. Create a simple, mobile-friendly landing page with links to the store
   listing(s), a short demo, an install walkthrough, privacy/support
   information, and a note that installation is done on desktop Chrome/Edge.
2. Record two short videos: a roughly one-minute use/demo clip and a separate
   installation walkthrough. Once the store listing is live, show the normal
   store installation flow rather than developer-mode installation.
3. Put a QR code on a bulletin-board flyer that points to the landing page,
   rather than directly to one store. Include a short URL below the QR code.
   This lets one flyer support more than one store listing later.
4. Start by asking a local game store or hobby club if you can post the flyer.
   Explain the benefit plainly (organize a Noble Knight want list into ranked
   custom lists) and don't suggest that Noble Knight endorses the extension.

Keep the initial outreach small: Chrome listing, tested install, landing page,
two videos, and one QR flyer. Expand to Edge and broader outreach after getting
feedback from a few local users.
