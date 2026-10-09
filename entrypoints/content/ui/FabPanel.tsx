import { useEffect, useMemo, useState } from "react";
import type { Item } from "../../../types";
import { useAppData } from "../../../lib/useAppData";
import { extractItemsFromDocument } from "../../../lib/domExtractor";
import { AllItemsList } from "./AllItemsList";
import { CuratedList } from "./CuratedList";
import "./panel.css";

const ALL = "__all__";

export function FabPanel() {
  const appData = useAppData();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<string>(ALL);
  const [pageItems, setPageItems] = useState<Item[]>(() =>
    extractItemsFromDocument(document),
  );

  // Strip pagination query params so every page of the same paginated
  // want list (e.g. "?page=2") resolves to the same Source.
  const page = useMemo(() => {
    const url = new URL(location.href);
    for (const key of ["page", "Page", "p", "PageNumber", "pagenumber"]) {
      url.searchParams.delete(key);
    }
    return { url: url.toString(), title: document.title };
  }, []);

  // Re-extract whenever the want-list DOM changes (e.g. lazy-loaded items)
  // and keep storage in sync.
  useEffect(() => {
    const resync = () => {
      const items = extractItemsFromDocument(document);
      setPageItems(items);
      appData.syncPageItems(page, items);
    };

    resync();

    const listContainer =
      document.querySelector(".product-card-wrapper")?.parentElement ??
      document.body;
    const observer = new MutationObserver(resync);
    observer.observe(listContainer, { childList: true, subtree: true });
    return () => observer.disconnect();
    // `appData.syncPageItems` is stable (see useAppData) and `page` is memoized.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const { groups } = appData.data;
  const activeView =
    view === ALL || groups.some((g) => g.id === view) ? view : ALL;

  const pageItemsWithGroups = pageItems.map(
    (item) => appData.data.items.find((i) => i.id === item.id) ?? item,
  );

  return (
    <div className="nkgwlp-root">
      {open && (
        <>
          <div className="nkgwlp-scrim" onClick={() => setOpen(false)} />
          <div className="nkgwlp-popup" role="dialog" aria-label="Want list">
            <div className="nkgwlp-popup-header">
              <select
                className="nkgwlp-switcher"
                value={activeView}
                onChange={(e) => setView(e.target.value)}
                aria-label="Choose list"
              >
                <option value={ALL}>
                  All items ({pageItemsWithGroups.length})
                </option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.itemOrder.length})
                  </option>
                ))}
              </select>
              <button
                className="nkgwlp-close"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="nkgwlp-content">
              {activeView === ALL ? (
                <AllItemsList
                  items={pageItemsWithGroups}
                  groups={groups}
                  onToggleGroup={appData.toggleItemGroup}
                  onNavigate={() => setOpen(false)}
                />
              ) : (
                <CuratedList
                  data={appData.data}
                  groupId={activeView}
                  onMoveItemInGroup={appData.moveItemInGroup}
                  onToggleItemGroup={appData.toggleItemGroup}
                  onNavigate={() => setOpen(false)}
                />
              )}
            </div>
          </div>
        </>
      )}
      <button
        className="nkgwlp-fab"
        aria-label="Open want list"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "×" : "☰"}
      </button>
    </div>
  );
}
