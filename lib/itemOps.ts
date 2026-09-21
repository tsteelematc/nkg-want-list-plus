import { v4 as uuid } from "uuid";
import type { AppData, Group, Item, Source } from "../types";

/**
 * Pure, framework-agnostic mutation functions over AppData. Each function
 * takes the current data and returns the next data (never mutates in
 * place), so they're easy to reuse from both the content script's bottom
 * panel and the extension's options page, and easy to unit test.
 */

/**
 * Registers (or updates) the `Source` for the want-list page the content
 * script is currently running on, and merges in the items found there.
 * User-assigned `groupIds` are always preserved for items that already
 * existed.
 */
export function syncPageItems(
  data: AppData,
  page: { url: string; title: string },
  scraped: Item[],
): AppData {
  const now = new Date().toISOString();

  let source = data.sources.find((s) => s.url === page.url);
  const sources = source
    ? data.sources.map((s) =>
        s.id === source!.id
          ? { ...s, lastSyncedAt: now, lastItemCount: scraped.length }
          : s,
      )
    : [
        ...data.sources,
        (source = {
          id: uuid(),
          name: page.title || "My Want List",
          url: page.url,
          firstSeenAt: now,
          lastSyncedAt: now,
          lastItemCount: scraped.length,
        }),
      ];

  const existingById = new Map(data.items.map((i) => [i.id, i]));
  for (const scrapedItem of scraped) {
    const existing = existingById.get(scrapedItem.id);
    if (existing) {
      existingById.set(scrapedItem.id, {
        ...existing,
        ...scrapedItem,
        sourceIds: Array.from(new Set([...existing.sourceIds, source.id])),
        groupIds: existing.groupIds, // preserve user-assigned groups
        firstSeenAt: existing.firstSeenAt,
        lastSeenAt: now,
      });
    } else {
      existingById.set(scrapedItem.id, {
        ...scrapedItem,
        sourceIds: [source.id],
        firstSeenAt: now,
        lastSeenAt: now,
      });
    }
  }

  return { ...data, sources, items: Array.from(existingById.values()) };
}

export function removeSource(data: AppData, sourceId: string): AppData {
  const remainingItems = data.items
    .map((item) => ({
      ...item,
      sourceIds: item.sourceIds.filter((sid) => sid !== sourceId),
    }))
    .filter((item) => item.sourceIds.length > 0);
  const remainingItemIds = new Set(remainingItems.map((i) => i.id));
  return {
    ...data,
    sources: data.sources.filter((s) => s.id !== sourceId),
    items: remainingItems,
    groups: data.groups.map((g) => ({
      ...g,
      itemOrder: g.itemOrder.filter((itemId) => remainingItemIds.has(itemId)),
    })),
  };
}

export function renameSource(
  data: AppData,
  sourceId: string,
  name: string,
): AppData {
  return {
    ...data,
    sources: data.sources.map((s) => (s.id === sourceId ? { ...s, name } : s)),
  };
}

export function addGroup(
  data: AppData,
  name: string,
  color?: string,
): { data: AppData; group: Group } {
  const group: Group = {
    id: uuid(),
    name,
    color,
    createdAt: new Date().toISOString(),
    itemOrder: [],
  };
  return { data: { ...data, groups: [...data.groups, group] }, group };
}

export function renameGroup(
  data: AppData,
  groupId: string,
  name: string,
): AppData {
  return {
    ...data,
    groups: data.groups.map((g) => (g.id === groupId ? { ...g, name } : g)),
  };
}

export function removeGroup(data: AppData, groupId: string): AppData {
  return {
    ...data,
    groups: data.groups.filter((g) => g.id !== groupId),
    items: data.items.map((item) => ({
      ...item,
      groupIds: item.groupIds.filter((gid) => gid !== groupId),
    })),
  };
}

export function toggleItemGroup(
  data: AppData,
  itemId: string,
  groupId: string,
): AppData {
  const item = data.items.find((i) => i.id === itemId);
  if (!item) return data;
  const has = item.groupIds.includes(groupId);
  return {
    ...data,
    items: data.items.map((i) =>
      i.id === itemId
        ? {
            ...i,
            groupIds: has
              ? i.groupIds.filter((gid) => gid !== groupId)
              : [...i.groupIds, groupId],
          }
        : i,
    ),
    groups: data.groups.map((g) => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        itemOrder: has
          ? g.itemOrder.filter((id) => id !== itemId)
          : [...g.itemOrder, itemId],
      };
    }),
  };
}

export function moveItemInGroup(
  data: AppData,
  groupId: string,
  itemId: string,
  direction: "up" | "down",
): AppData {
  return {
    ...data,
    groups: data.groups.map((g) => {
      if (g.id !== groupId) return g;
      const index = g.itemOrder.indexOf(itemId);
      if (index === -1) return g;
      const swapWith = direction === "up" ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= g.itemOrder.length) return g;
      const itemOrder = [...g.itemOrder];
      const a = itemOrder[index];
      const b = itemOrder[swapWith];
      if (a === undefined || b === undefined) return g;
      itemOrder[index] = b;
      itemOrder[swapWith] = a;
      return { ...g, itemOrder };
    }),
  };
}

export function removeItem(data: AppData, itemId: string): AppData {
  return {
    ...data,
    items: data.items.filter((item) => item.id !== itemId),
    groups: data.groups.map((g) => ({
      ...g,
      itemOrder: g.itemOrder.filter((id) => id !== itemId),
    })),
  };
}

export type { Source };
