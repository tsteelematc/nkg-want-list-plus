import { useCallback, useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    let cancelled = false;
    loadAppData().then((loaded) => {
      if (!cancelled) {
        setData(loaded);
        setReady(true);
      }
    });
    const unwatch = watchAppData((next) => {
      setData(next);
    });
    return () => {
      cancelled = true;
      unwatch();
    };
  }, []);

  const apply = useCallback((updater: (prev: AppData) => AppData) => {
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
