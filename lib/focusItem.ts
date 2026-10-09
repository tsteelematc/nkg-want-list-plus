import type { Item } from "../types";
import { findProductCardElement } from "./domExtractor";

/** Smooth-scrolls the item's product card into view and briefly outlines it. */
export function focusItemOnPage(item: Item): void {
  const card = findProductCardElement(document, item);
  if (!card) return;

  card.scrollIntoView({ behavior: "smooth", block: "center" });

  const previousOutline = card.style.outline;
  const previousOutlineOffset = card.style.outlineOffset;
  card.style.outline = "2px solid #005996";
  card.style.outlineOffset = "2px";
  window.setTimeout(() => {
    card.style.outline = previousOutline;
    card.style.outlineOffset = previousOutlineOffset;
  }, 1200);
}
