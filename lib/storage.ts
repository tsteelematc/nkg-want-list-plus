import { storage } from "#imports";
import type { AppData } from "../types";
import { CURRENT_DATA_VERSION, createEmptyAppData } from "../types";

const appDataItem = storage.defineItem<AppData>("local:appData", {
  fallback: createEmptyAppData(),
});

export async function loadAppData(): Promise<AppData> {
  try {
    const raw = await appDataItem.getValue();
    return migrate(raw);
  } catch (err) {
    console.error("Failed to load stored app data, starting fresh.", err);
    return createEmptyAppData();
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  await appDataItem.setValue(data);
}

export function watchAppData(
  callback: (data: AppData) => void,
): () => void {
  return appDataItem.watch((newValue) => {
    callback(migrate(newValue ?? createEmptyAppData()));
  });
}

/**
 * Migrates raw persisted/imported data forward to CURRENT_DATA_VERSION.
 * Each step only knows how to go from its own version to the next, so
 * migrations compose safely regardless of how old the stored/imported data
 * is (e.g. a JSON backup exported from the earlier standalone web app).
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

  if (result.version < 3) {
    result = migrateV2ToV3(result);
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

/**
 * v2 -> v3: drops the standalone web app's `settings.corsProxyUrl` (no
 * longer needed now that item data comes from the live DOM via a content
 * script) and updates `Source` semantics — imported v2 sources become
 * read-only historical records; new sources are auto-registered by the
 * content script when it runs on a want-list page.
 */
function migrateV2ToV3(data: AppData): AppData {
  const legacyData = data as AppData & {
    settings?: { corsProxyUrl?: string };
  };
  const { settings: _settings, ...rest } = legacyData;
  const sources = (rest.sources ?? []).map((source) => {
    const legacySource = source as typeof source & {
      lastScrapedAt?: string;
      lastError?: string;
    };
    return {
      id: legacySource.id,
      name: legacySource.name,
      url: legacySource.url,
      firstSeenAt: legacySource.firstSeenAt ?? legacySource.lastScrapedAt ?? new Date().toISOString(),
      lastSyncedAt: legacySource.lastSyncedAt ?? legacySource.lastScrapedAt ?? new Date().toISOString(),
      lastItemCount: legacySource.lastItemCount,
    };
  });

  return { ...rest, sources, version: 3 };
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
