import { useEffect, useMemo, useRef, useState } from "react";
import type { Item } from "../../../types";
import { useAppData } from "../../../lib/useAppData";
import { extractItemsFromDocument } from "../../../lib/domExtractor";
import { PageItemsTab } from "./PageItemsTab";
import { ListsTab } from "./ListsTab";
import { ListDetailView } from "./ListDetailView";
import "./panel.css";

type Tab = "page" | "lists";

const MIN_PANEL_HEIGHT = 220;
const MAX_PANEL_HEIGHT = 560;
const COLLAPSED_PANEL_HEIGHT = 62;
const PANEL_HEIGHT_STORAGE_KEY = "nkgwlp-panel-height";

function readSavedPanelHeight(): number {
  try {
    const raw = window.localStorage.getItem(PANEL_HEIGHT_STORAGE_KEY);
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return Math.min(
        MAX_PANEL_HEIGHT,
        Math.max(MIN_PANEL_HEIGHT, parsed),
      );
    }
  } catch {
    // Ignore storage access issues and fall back to a sane default.
  }

  return 320;
}

export function BottomPanel() {
  const appData = useAppData();
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<Tab>("page");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [panelHeight, setPanelHeight] = useState(() => readSavedPanelHeight());
  const dragStartY = useRef<number | null>(null);
  const dragStartHeight = useRef<number | null>(null);
  const dragMovedRef = useRef(false);
  const [pageItems, setPageItems] = useState<Item[]>(() =>
    extractItemsFromDocument(document),
  );

  const page = useMemo(
    () => ({ url: location.href, title: document.title }),
    [],
  );

  useEffect(() => {
    const updatePanelHeight = () => {
      const next = Math.min(
        Math.max(window.innerHeight * 0.45, MIN_PANEL_HEIGHT),
        MAX_PANEL_HEIGHT,
      );
      setPanelHeight((current) => {
        if (current < MIN_PANEL_HEIGHT || current > MAX_PANEL_HEIGHT) {
          return next;
        }
        return current;
      });
    };

    updatePanelHeight();
    window.addEventListener("resize", updatePanelHeight);
    return () => window.removeEventListener("resize", updatePanelHeight);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(PANEL_HEIGHT_STORAGE_KEY, String(panelHeight));
    } catch {
      // Storage can fail in private/incognito contexts; ignore silently.
    }
  }, [panelHeight]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (dragStartY.current === null || dragStartHeight.current === null) {
        return;
      }

      const delta = dragStartY.current - event.clientY;
      const next = Math.min(
        MAX_PANEL_HEIGHT,
        Math.max(MIN_PANEL_HEIGHT, dragStartHeight.current + delta),
      );
      dragMovedRef.current = Math.abs(dragStartY.current - event.clientY) > 4;
      setPanelHeight(next);
    };

    const onPointerUp = () => {
      dragStartY.current = null;
      dragStartHeight.current = null;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

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
    <div
      className={`nkgwlp-panel ${open ? "nkgwlp-panel-open" : ""}`}
      style={{ height: `${open ? panelHeight : COLLAPSED_PANEL_HEIGHT}px` }}
    >
      <div
        className="nkgwlp-resize-handle"
        onPointerDown={(event) => {
          dragStartY.current = event.clientY;
          dragStartHeight.current = panelHeight;
          dragMovedRef.current = false;
          event.preventDefault();
        }}
        aria-hidden="true"
      />

      <button
        className="nkgwlp-handle"
        onClick={() => {
          if (dragMovedRef.current) {
            dragMovedRef.current = false;
            return;
          }
          setOpen((v) => !v);
        }}
        aria-expanded={open}
      >
        <span className="nkgwlp-handle-title">NKG Want List Plus</span>
        <span className="nkgwlp-handle-meta">
          {open ? `${pageItemsWithGroups.length} items` : "Open"}
        </span>
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
              All Want List Items
            </button>
            <button
              className={tab === "lists" ? "active" : ""}
              onClick={() => setTab("lists")}
            >
              Curated Want Lists
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
