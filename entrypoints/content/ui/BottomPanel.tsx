import { useEffect, useMemo, useState } from "react";
import type { Item } from "../../../types";
import { useAppData } from "../../../lib/useAppData";
import { extractItemsFromDocument } from "../../../lib/domExtractor";
import { PageItemsTab } from "./PageItemsTab";
import { ListsTab } from "./ListsTab";
import { ListDetailView } from "./ListDetailView";
import "./panel.css";

type Tab = "page" | "lists";

export function BottomPanel() {
  const appData = useAppData();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("page");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [pageItems, setPageItems] = useState<Item[]>(() =>
    extractItemsFromDocument(document),
  );

  const page = useMemo(
    () => ({ url: location.href, title: document.title }),
    [],
  );

  // Re-extract whenever the want-list DOM changes (e.g. NKG lazy-loads more
  // items after the initial render) and keep storage in sync.
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
    // Only re-run this setup once per mount; `appData.syncPageItems` is
    // stable (see useAppData) and `page` is memoized.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageItemsWithGroups = pageItems.map((item) => {
    const stored = appData.data.items.find((i) => i.id === item.id);
    return stored ?? item;
  });

  const itemCountByGroup = (groupId: string) =>
    appData.data.groups.find((g) => g.id === groupId)?.itemOrder.length ?? 0;

  return (
    <div className={`nkgwlp-panel ${open ? "nkgwlp-panel-open" : ""}`}>
      <button
        className="nkgwlp-handle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="nkgwlp-handle-title">NKG Want List Plus</span>
        <span className="nkgwlp-handle-caret">{open ? "▾" : "▴"}</span>
      </button>

      {open && (
        <div className="nkgwlp-body">
          <div className="nkgwlp-tabs">
            <button
              className={tab === "page" ? "active" : ""}
              onClick={() => {
                setTab("page");
                setSelectedGroupId(null);
              }}
            >
              On this page
            </button>
            <button
              className={tab === "lists" ? "active" : ""}
              onClick={() => setTab("lists")}
            >
              My Lists
            </button>
          </div>

          <div className="nkgwlp-content">
            {tab === "page" && (
              <PageItemsTab
                items={pageItemsWithGroups}
                groups={appData.data.groups}
                onToggleGroup={appData.toggleItemGroup}
              />
            )}

            {tab === "lists" &&
              (selectedGroupId ? (
                <ListDetailView
                  data={appData.data}
                  groupId={selectedGroupId}
                  onBack={() => setSelectedGroupId(null)}
                  onMoveItemInGroup={appData.moveItemInGroup}
                  onToggleItemGroup={appData.toggleItemGroup}
                  onRemoveItem={appData.removeItem}
                />
              ) : (
                <ListsTab
                  groups={appData.data.groups}
                  itemCountByGroup={itemCountByGroup}
                  onOpenGroup={setSelectedGroupId}
                  onAddGroup={(name) => appData.addGroup(name)}
                  onRemoveGroup={appData.removeGroup}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
