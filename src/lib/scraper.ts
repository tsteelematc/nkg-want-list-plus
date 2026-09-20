import type { ConditionOption, Item } from "../types";

export class ScrapeError extends Error {}

/**
 * Fetches a Noble Knight Games want-list URL through a CORS proxy and parses
 * out all items, following pagination if the list spans multiple pages.
 */
export async function scrapeWantList(
  wantListUrl: string,
  corsProxyUrl: string,
  maxPages = 25,
): Promise<Item[]> {
  const items = new Map<string, Item>();
  let pageUrl: string | null = wantListUrl;
  let pagesFetched = 0;

  while (pageUrl && pagesFetched < maxPages) {
    const html = await fetchHtmlViaProxy(pageUrl, corsProxyUrl);
    const doc = parseHtml(html);
    const sizeBefore = items.size;
    for (const item of extractItemsFromDocument(doc)) {
      items.set(item.id, item);
    }
    pagesFetched++;
    // Stop if a page brought no new items to avoid looping when a site
    // doesn't actually support the ?page= pagination fallback.
    if (items.size === sizeBefore && pagesFetched > 1) break;
    pageUrl = findNextPageUrl(doc, pageUrl, items.size);
  }

  if (items.size === 0) {
    throw new ScrapeError(
      "No items were found on that page. The proxy may have returned an error page, or the want list is empty/private.",
    );
  }

  return Array.from(items.values());
}

async function fetchHtmlViaProxy(
  targetUrl: string,
  corsProxyUrl: string,
): Promise<string> {
  const proxied = corsProxyUrl + encodeURIComponent(targetUrl);
  let response: Response;
  try {
    response = await fetch(proxied);
  } catch (err) {
    throw new ScrapeError(
      `Network error while fetching via proxy: ${(err as Error).message}`,
    );
  }
  if (!response.ok) {
    throw new ScrapeError(
      `Proxy request failed with status ${response.status}. Try a different CORS proxy in Settings, or use the "Paste HTML" fallback import.`,
    );
  }
  return response.text();
}

function parseHtml(html: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(html, "text/html");
}

/** Parses a saved HTML page (used by the "Paste HTML" fallback importer). */
export function parsePastedHtml(html: string): Item[] {
  const doc = parseHtml(html);
  const items = extractItemsFromDocument(doc);
  if (items.length === 0) {
    throw new ScrapeError(
      "No items were found in the pasted HTML. Make sure you copied the full page source of a want-list page.",
    );
  }
  return items;
}

function extractItemsFromDocument(doc: Document): Item[] {
  const now = new Date().toISOString();
  const cards = Array.from(doc.querySelectorAll(".product-card-wrapper"));
  const items: Item[] = [];

  for (const card of cards) {
    const link = card.querySelector<HTMLAnchorElement>("a.image-col[href]");
    const href = link?.getAttribute("href") ?? "";
    const idMatch = href.match(/\/P\/(\d+)\//);
    if (!idMatch) continue;
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
      if (stockMatch) {
        stockNumber = stockMatch[1].trim();
        break;
      }
    }

    const bgEl = card.querySelector<HTMLElement>(".bg-img-container");
    const imageUrl = extractBackgroundImageUrl(bgEl?.style.backgroundImage ?? bgEl?.getAttribute("style") ?? "");

    const productUrl = href ? new URL(href, "https://www.nobleknight.com").toString() : "";

    const conditions: ConditionOption[] = [];
    for (const conditionEl of Array.from(card.querySelectorAll(".condition"))) {
      const conditionValue = conditionEl
        .querySelector(".condition-value")
        ?.textContent?.trim();
      const priceText = conditionEl.querySelector(".price")?.textContent?.trim();
      const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, "")) : NaN;
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

/**
 * Determines whether there's another page of results to fetch. Looks for
 * standard pagination links first, then falls back to comparing the
 * advertised item count against how many we've collected so far.
 */
function findNextPageUrl(
  doc: Document,
  currentPageUrl: string,
  itemsCollectedSoFar: number,
): string | null {
  const nextLink = doc.querySelector<HTMLAnchorElement>(
    'a[rel="next"], .pagination a[aria-label="Next"], .pagination-next a',
  );
  if (nextLink?.href) {
    return nextLink.href;
  }

  const countLabel = Array.from(doc.querySelectorAll("label")).find((el) =>
    /\d+\s+Items?/i.test(el.textContent ?? ""),
  );
  const countMatch = countLabel?.textContent?.match(/(\d+)\s+Items?/i);
  const totalItems = countMatch ? parseInt(countMatch[1], 10) : undefined;

  if (totalItems && itemsCollectedSoFar < totalItems) {
    const url = new URL(currentPageUrl);
    const currentPage = parseInt(url.searchParams.get("page") ?? "1", 10);
    url.searchParams.set("page", String(currentPage + 1));
    return url.toString();
  }

  return null;
}
