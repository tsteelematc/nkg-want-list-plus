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
    setDataState((prev) => ({
      ...prev,
      sources: prev.sources.filter((s) => s.id !== id),
      items: prev.items
        .map((item) => ({
          ...item,
          sourceIds: item.sourceIds.filter((sid) => sid !== id),
        }))
        .filter((item) => item.sourceIds.length > 0),
    }));
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
    setDataState((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        const has = item.groupIds.includes(groupId);
        return {
          ...item,
          groupIds: has
            ? item.groupIds.filter((gid) => gid !== groupId)
            : [...item.groupIds, groupId],
        };
      }),
    }));
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setDataState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
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
