import type { AppData } from "../types";
import { CURRENT_DATA_VERSION, createEmptyAppData } from "../types";

const STORAGE_KEY = "nkg-want-list-plus:data";

export function loadAppData(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createEmptyAppData();
  try {
    const parsed = JSON.parse(raw) as AppData;
    return migrate(parsed);
  } catch (err) {
    console.error("Failed to parse stored app data, starting fresh.", err);
    return createEmptyAppData();
  }
}

export function saveAppData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Migrates raw persisted/imported data forward to CURRENT_DATA_VERSION.
 * Each step only knows how to go from its own version to the next, so
 * migrations compose safely regardless of how old the stored data is.
 */
function migrate(data: AppData): AppData {
  let result = data;
  const version = result.version ?? 0;

  if (version < 1) {
    result = { ...createEmptyAppData(), ...result, version: 1 };
  }

  if (result.version < 2) {
    result = migrateV1ToV2(result);
  }

  // Safety net: ensure we always land on the current version even if a
  // future migration step forgets to bump it.
  return { ...result, version: CURRENT_DATA_VERSION };
}

/**
 * v1 -> v2: adds Group.itemOrder (authoritative per-group item ordering).
 * Backfills each group's order from the existing items' groupIds membership,
 * preserving the items array's existing order as a stable starting point.
 */
function migrateV1ToV2(data: AppData): AppData {
  const groups = (data.groups ?? []).map((group) => {
    const legacyGroup = group as typeof group & { itemOrder?: string[] };
    if (Array.isArray(legacyGroup.itemOrder)) {
      return legacyGroup as AppData["groups"][number];
    }
    const itemOrder = (data.items ?? [])
      .filter((item) => item.groupIds?.includes(group.id))
      .map((item) => item.id);
    return { ...group, itemOrder };
  });

  return { ...data, groups, version: 2 };
}

export function exportAppDataToFile(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `nkg-want-list-plus-backup-${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function importAppDataFromFile(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as AppData;
        resolve(migrate(parsed));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
