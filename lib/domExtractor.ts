import type { ConditionOption, Item } from "../types";

export function findProductCardElement(
  doc: ParentNode = document,
  item: Pick<Item, "id" | "productUrl">,
): HTMLElement | null {
  const href = item.productUrl ? new URL(item.productUrl).pathname : "";
  const candidateSelectors = [
    `a[href*="/P/${item.id}/"]`,
    `a[href*="/P/${item.id}"]`,
    href ? `a[href="${href}"]` : null,
    href ? `a[href="${href}/"]` : null,
    href ? `a[href*="${href}"]` : null,
  ].filter((selector): selector is string => Boolean(selector));

  for (const selector of candidateSelectors) {
    const link = doc.querySelector<HTMLAnchorElement>(selector);
    const card = link?.closest(
      ".product-card-wrapper, .product-card, article, [data-product-id]",
    );
    if (card instanceof HTMLElement) return card;
  }

  return null;
}

/**
 * Extracts items directly from the live NKG want-list DOM. No fetch/CORS
 * proxy needed — the content script already has the real page in front of
 * it. Pagination (if the want list spans multiple `?page=N` URLs) is
 * handled naturally: the content script re-runs and calls this again each
 * time the user navigates to another page of their own want list.
 */
export function extractItemsFromDocument(doc: Document = document): Item[] {
  const now = new Date().toISOString();
  const cards = Array.from(doc.querySelectorAll(".product-card-wrapper"));
  const items: Item[] = [];

  for (const card of cards) {
    const link = card.querySelector<HTMLAnchorElement>("a.image-col[href]");
    const href = link?.getAttribute("href") ?? "";
    const idMatch = href.match(/\/P\/(\d+)\//);
    if (!idMatch?.[1]) continue;
    const id = idMatch[1];

    const title =
      card.querySelector(".product-details-wrapper .name")?.textContent?.trim() ??
      "Untitled item";

    const publisherRaw = card
      .querySelector(".product-details-wrapper .publisher")
      ?.textContent?.trim();
    const publisher = publisherRaw?.replace(/^By:\s*/i, "").trim() || undefined;

    const productLineRaw = card
      .querySelector(".product-details-wrapper .product-line")
      ?.textContent?.trim();
    const productLine =
      productLineRaw?.replace(/^Product Line:\s*/i, "").trim() || undefined;

    let stockNumber: string | undefined;
    for (const p of Array.from(
      card.querySelectorAll(".product-details-wrapper p"),
    )) {
      const text = p.textContent?.trim() ?? "";
      const stockMatch = text.match(/^Stock #:\s*(.+)$/i);
      if (stockMatch?.[1]) {
        stockNumber = stockMatch[1].trim();
        break;
      }
    }

    const bgEl = card.querySelector<HTMLElement>(".bg-img-container");
    const imageUrl = extractBackgroundImageUrl(
      bgEl?.style.backgroundImage ?? bgEl?.getAttribute("style") ?? "",
    );

    const productUrl = href
      ? new URL(href, "https://www.nobleknight.com").toString()
      : "";

    const conditions: ConditionOption[] = [];
    for (const conditionEl of Array.from(card.querySelectorAll(".condition"))) {
      const conditionValue = conditionEl
        .querySelector(".condition-value")
        ?.textContent?.trim();
      const priceText = conditionEl
        .querySelector(".price")
        ?.textContent?.trim();
      const price = priceText
        ? parseFloat(priceText.replace(/[^0-9.]/g, ""))
        : NaN;
      const note = conditionEl
        .querySelector(".condition-note")
        ?.textContent?.trim()
        ?.replace(/^\((.*)\)$/, "$1");
      if (conditionValue) {
        conditions.push({
          condition: conditionValue,
          price: Number.isFinite(price) ? price : 0,
          note: note || undefined,
        });
      }
    }

    items.push({
      id,
      title,
      publisher,
      productLine,
      stockNumber,
      imageUrl,
      productUrl,
      conditions,
      sourceIds: [],
      groupIds: [],
      firstSeenAt: now,
      lastSeenAt: now,
    });
  }

  return items;
}

function extractBackgroundImageUrl(styleValue: string): string | undefined {
  const match = styleValue.match(/url\((['"]?)(.*?)\1\)/);
  return match ? match[2] : undefined;
}
