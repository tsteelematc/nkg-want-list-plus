import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppData, Group, Item } from "../types";
import { createEmptyAppData } from "../types";
import { loadAppData, saveAppData, watchAppData } from "./storage";
import * as ops from "./itemOps";

/**
 * React hook wrapping the AppData store. Loads from chrome.storage.local on
 * mount, persists on every change, and stays in sync with other contexts
 * (e.g. the options page open in another tab, or the panel on a second
 * want-list tab) via storage.watch.
 */
export function useAppData() {
  const [data, setData] = useState<AppData>(() => createEmptyAppData());
  const [ready, setReady] = useState(false);
  // Mirrors `ready` in a ref so `apply` (called from effects that may fire
  // before the initial load resolves) can synchronously bail out instead of
  // reading stale state. Without this guard, a sync that runs before
  // `loadAppData()` resolves would persist the empty default AppData over
  // whatever the user actually had saved, effectively wiping their data.
  const readyRef = useRef(false);
  // Buffers `apply` calls that arrive before the initial load resolves so
  // they aren't silently dropped (e.g. the content script's very first
  // `syncPageItems` call, which can fire before storage has loaded).
  const pendingUpdatesRef = useRef<Array<(prev: AppData) => AppData>>([]);

  useEffect(() => {
    let cancelled = false;
    loadAppData().then((loaded) => {
      if (cancelled) return;
      let next = loaded;
      for (const updater of pendingUpdatesRef.current) {
        next = updater(next);
      }
      pendingUpdatesRef.current = [];
      setData(next);
      readyRef.current = true;
      setReady(true);
      if (next !== loaded) {
        void saveAppData(next);
      }
    });
    const unwatch = watchAppData((next) => {
      if (!readyRef.current) return;
      setData(next);
    });
    return () => {
      cancelled = true;
      unwatch();
    };
  }, []);

  const apply = useCallback((updater: (prev: AppData) => AppData) => {
    if (!readyRef.current) {
      // Defer until the initial load resolves; queued updaters are applied
      // in order on top of the freshly loaded data.
      pendingUpdatesRef.current.push(updater);
      return;
    }
    setData((prev) => {
      const next = updater(prev);
      void saveAppData(next);
      return next;
    });
  }, []);

  const syncPageItems = useCallback(
    (page: { url: string; title: string }, scraped: Item[]) => {
      apply((prev) => ops.syncPageItems(prev, page, scraped));
    },
    [apply],
  );

  const removeSource = useCallback(
    (sourceId: string) => apply((prev) => ops.removeSource(prev, sourceId)),
    [apply],
  );

  const renameSource = useCallback(
    (sourceId: string, name: string) =>
      apply((prev) => ops.renameSource(prev, sourceId, name)),
    [apply],
  );

  const addGroup = useCallback(
    (name: string, color?: string): Group => {
      let created!: Group;
      apply((prev) => {
        const { data: next, group } = ops.addGroup(prev, name, color);
        created = group;
        return next;
      });
      return created;
    },
    [apply],
  );

  const renameGroup = useCallback(
    (groupId: string, name: string) =>
      apply((prev) => ops.renameGroup(prev, groupId, name)),
    [apply],
  );

  const removeGroup = useCallback(
    (groupId: string) => apply((prev) => ops.removeGroup(prev, groupId)),
    [apply],
  );

  const toggleItemGroup = useCallback(
    (itemId: string, groupId: string) =>
      apply((prev) => ops.toggleItemGroup(prev, itemId, groupId)),
    [apply],
  );

  const moveItemInGroup = useCallback(
    (groupId: string, itemId: string, direction: "up" | "down") =>
      apply((prev) => ops.moveItemInGroup(prev, groupId, itemId, direction)),
    [apply],
  );

  const removeItem = useCallback(
    (itemId: string) => apply((prev) => ops.removeItem(prev, itemId)),
    [apply],
  );

  const replaceAllData = useCallback(
    (next: AppData) => apply(() => next),
    [apply],
  );

  const clearAllData = useCallback(
    () => apply(() => createEmptyAppData()),
    [apply],
  );

  return useMemo(
    () => ({
      data,
      ready,
      syncPageItems,
      removeSource,
      renameSource,
      addGroup,
      renameGroup,
      removeGroup,
      toggleItemGroup,
      moveItemInGroup,
      removeItem,
      replaceAllData,
      clearAllData,
    }),
    [
      data,
      ready,
      syncPageItems,
      removeSource,
      renameSource,
      addGroup,
      renameGroup,
      removeGroup,
      toggleItemGroup,
      moveItemInGroup,
      removeItem,
      replaceAllData,
      clearAllData,
    ],
  );
}
