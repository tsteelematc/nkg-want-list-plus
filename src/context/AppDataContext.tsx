import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { v4 as uuid } from "uuid";
import type { AppData, Group, Item, Source } from "../types";
import { loadAppData, saveAppData } from "../lib/storage";

interface AppDataContextValue {
  data: AppData;
  setData: (data: AppData) => void;

  addSource: (name: string, url: string) => Source;
  updateSource: (id: string, patch: Partial<Source>) => void;
  removeSource: (id: string) => void;

  mergeScrapedItems: (sourceId: string, scraped: Item[]) => void;

  addGroup: (name: string, color?: string) => Group;
  renameGroup: (id: string, name: string) => void;
  removeGroup: (id: string) => void;

  toggleItemGroup: (itemId: string, groupId: string) => void;
  moveItemInGroup: (
    groupId: string,
    itemId: string,
    direction: "up" | "down",
  ) => void;
  removeItem: (itemId: string) => void;

  setCorsProxyUrl: (url: string) => void;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(
  undefined,
);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData>(() => loadAppData());

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  const setData = useCallback((next: AppData) => setDataState(next), []);

  const addSource = useCallback((name: string, url: string): Source => {
    const source: Source = { id: uuid(), name, url };
    setDataState((prev) => ({ ...prev, sources: [...prev.sources, source] }));
    return source;
  }, []);

  const updateSource = useCallback((id: string, patch: Partial<Source>) => {
    setDataState((prev) => ({
      ...prev,
      sources: prev.sources.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  const removeSource = useCallback((id: string) => {
    setDataState((prev) => {
      const remainingItems = prev.items
        .map((item) => ({
          ...item,
          sourceIds: item.sourceIds.filter((sid) => sid !== id),
        }))
        .filter((item) => item.sourceIds.length > 0);
      const remainingItemIds = new Set(remainingItems.map((i) => i.id));
      return {
        ...prev,
        sources: prev.sources.filter((s) => s.id !== id),
        items: remainingItems,
        groups: prev.groups.map((g) => ({
          ...g,
          itemOrder: g.itemOrder.filter((itemId) => remainingItemIds.has(itemId)),
        })),
      };
    });
  }, []);

  const mergeScrapedItems = useCallback((sourceId: string, scraped: Item[]) => {
    setDataState((prev) => {
      const existingById = new Map(prev.items.map((i) => [i.id, i]));
      const now = new Date().toISOString();
      for (const scrapedItem of scraped) {
        const existing = existingById.get(scrapedItem.id);
        if (existing) {
          existingById.set(scrapedItem.id, {
            ...existing,
            ...scrapedItem,
            sourceIds: Array.from(
              new Set([...existing.sourceIds, sourceId]),
            ),
            groupIds: existing.groupIds, // preserve user-assigned groups
            firstSeenAt: existing.firstSeenAt,
            lastSeenAt: now,
          });
        } else {
          existingById.set(scrapedItem.id, {
            ...scrapedItem,
            sourceIds: [sourceId],
            firstSeenAt: now,
            lastSeenAt: now,
          });
        }
      }
      return {
        ...prev,
        items: Array.from(existingById.values()),
        sources: prev.sources.map((s) =>
          s.id === sourceId
            ? {
                ...s,
                lastScrapedAt: now,
                lastItemCount: scraped.length,
                lastError: undefined,
              }
            : s,
        ),
      };
    });
  }, []);

  const addGroup = useCallback((name: string, color?: string): Group => {
    const group: Group = {
      id: uuid(),
      name,
      color,
      createdAt: new Date().toISOString(),
      itemOrder: [],
    };
    setDataState((prev) => ({ ...prev, groups: [...prev.groups, group] }));
    return group;
  }, []);

  const renameGroup = useCallback((id: string, name: string) => {
    setDataState((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === id ? { ...g, name } : g)),
    }));
  }, []);

  const removeGroup = useCallback((id: string) => {
    setDataState((prev) => ({
      ...prev,
      groups: prev.groups.filter((g) => g.id !== id),
      items: prev.items.map((item) => ({
        ...item,
        groupIds: item.groupIds.filter((gid) => gid !== id),
      })),
    }));
  }, []);

  const toggleItemGroup = useCallback((itemId: string, groupId: string) => {
    setDataState((prev) => {
      const item = prev.items.find((i) => i.id === itemId);
      if (!item) return prev;
      const has = item.groupIds.includes(groupId);
      return {
        ...prev,
        items: prev.items.map((i) =>
          i.id === itemId
            ? {
                ...i,
                groupIds: has
                  ? i.groupIds.filter((gid) => gid !== groupId)
                  : [...i.groupIds, groupId],
              }
            : i,
        ),
        groups: prev.groups.map((g) => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            itemOrder: has
              ? g.itemOrder.filter((id) => id !== itemId)
              : [...g.itemOrder, itemId],
          };
        }),
      };
    });
  }, []);

  const moveItemInGroup = useCallback(
    (groupId: string, itemId: string, direction: "up" | "down") => {
      setDataState((prev) => ({
        ...prev,
        groups: prev.groups.map((g) => {
          if (g.id !== groupId) return g;
          const index = g.itemOrder.indexOf(itemId);
          if (index === -1) return g;
          const swapWith = direction === "up" ? index - 1 : index + 1;
          if (swapWith < 0 || swapWith >= g.itemOrder.length) return g;
          const itemOrder = [...g.itemOrder];
          [itemOrder[index], itemOrder[swapWith]] = [
            itemOrder[swapWith],
            itemOrder[index],
          ];
          return { ...g, itemOrder };
        }),
      }));
    },
    [],
  );

  const removeItem = useCallback((itemId: string) => {
    setDataState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
      groups: prev.groups.map((g) => ({
        ...g,
        itemOrder: g.itemOrder.filter((id) => id !== itemId),
      })),
    }));
  }, []);

  const setCorsProxyUrl = useCallback((url: string) => {
    setDataState((prev) => ({
      ...prev,
      settings: { ...prev.settings, corsProxyUrl: url },
    }));
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      setData,
      addSource,
      updateSource,
      removeSource,
      mergeScrapedItems,
      addGroup,
      renameGroup,
      removeGroup,
      toggleItemGroup,
      moveItemInGroup,
      removeItem,
      setCorsProxyUrl,
    }),
    [
      data,
      setData,
      addSource,
      updateSource,
      removeSource,
      mergeScrapedItems,
      addGroup,
      renameGroup,
      removeGroup,
      toggleItemGroup,
      moveItemInGroup,
      removeItem,
      setCorsProxyUrl,
    ],
  );

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return ctx;
}
