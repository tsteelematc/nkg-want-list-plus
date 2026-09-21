// Core data model for NKG Want List Plus.
// Persisted as a single AppData JSON blob in chrome.storage.local
// (see lib/storage.ts).

export interface ConditionOption {
  /** e.g. "MINT", "VG+", "NM" */
  condition: string;
  price: number;
  note?: string;
}

export interface Source {
  id: string;
  /** User-facing label; defaults to the page title captured on first visit. */
  name: string;
  /** The Noble Knight Games MyWantList URL this source was auto-detected from. */
  url: string;
  firstSeenAt: string;
  lastSyncedAt: string;
  lastItemCount?: number;
}

export interface Item {
  /** Derived from the NKG product id in the /P/{id}/{slug} URL */
  id: string;
  title: string;
  publisher?: string;
  productLine?: string;
  stockNumber?: string;
  imageUrl?: string;
  productUrl: string;
  conditions: ConditionOption[];
  /** Which source(s) this item was last seen on */
  sourceIds: string[];
  /** Many-to-many with Group (tag-style grouping) */
  groupIds: string[];
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface Group {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  /** Ordered list of Item ids belonging to this group; authoritative render order. */
  itemOrder: string[];
}

export interface AppData {
  version: number;
  sources: Source[];
  items: Item[];
  groups: Group[];
}

export const CURRENT_DATA_VERSION = 3;

export function createEmptyAppData(): AppData {
  return {
    version: CURRENT_DATA_VERSION,
    sources: [],
    items: [],
    groups: [],
  };
}
