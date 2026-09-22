import { createRoot } from "react-dom/client";
import { BottomPanel } from "./ui/BottomPanel";

// NKG's own site links to this page inconsistently — we've observed both
// "/MyWantList/<token>" (public shareable list) and "/Wantlist" /
// "/WantList" (the logged-in user's own list) in the wild. Chrome/Edge
// match patterns compare the path literally (case-sensitive), so rather
// than trying to enumerate every casing variant, we match the whole
// nobleknight.com origin and do a case-insensitive runtime check before
// mounting anything.
const WANT_LIST_PATH_RE = /want.?list/i;

export default defineContentScript({
  matches: ["*://www.nobleknight.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    if (!WANT_LIST_PATH_RE.test(location.pathname)) return;

    // No fetch/CORS proxy needed — the content script already has direct
    // access to the live want-list DOM. Item extraction + storage syncing
    // happens inside <BottomPanel>, which re-runs whenever the page's item
    // list changes (e.g. lazy-loaded content).
    const ui = await createShadowRootUi(ctx, {
      name: "nkg-want-list-plus-panel",
      position: "modal",
      zIndex: 2147483000,
      anchor: "body",
      onMount: (uiContainer) => {
        uiContainer.style.position = "fixed";
        uiContainer.style.left = "0";
        uiContainer.style.right = "0";
        uiContainer.style.bottom = "0";
        uiContainer.style.zIndex = "2147483647";
        uiContainer.style.pointerEvents = "none";

        const root = createRoot(uiContainer);
        root.render(<BottomPanel />);
        return root;
      },
      onRemove: (root) => root?.unmount(),
    });

    ui.mount();
  },
});
