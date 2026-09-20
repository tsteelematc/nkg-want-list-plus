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

/** Placeholder for future schema migrations; currently a no-op passthrough. */
function migrate(data: AppData): AppData {
  if (!data.version || data.version < CURRENT_DATA_VERSION) {
    return {
      ...createEmptyAppData(),
      ...data,
      version: CURRENT_DATA_VERSION,
    };
  }
  return data;
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
