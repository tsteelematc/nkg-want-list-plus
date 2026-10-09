import { useEffect, useMemo, useState } from "react";
import type { Item } from "../../../types";
import { useAppData } from "../../../lib/useAppData";
import { extractItemsFromDocument } from "../../../lib/domExtractor";
import { AllItemsList } from "./AllItemsList";
import { CuratedList } from "./CuratedList";
import { DONATE_OPTIONS } from "../../../lib/donate";
import "./panel.css";

const ALL = "__all__";
const NEW = "__new__";

// What the popup header is currently showing.
type HeaderMode = "idle" | "creating" | "menu" | "renaming" | "deleting";

export function FabPanel() {
  const appData = useAppData();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<string>(ALL);
  const [mode, setMode] = useState<HeaderMode>("idle");
  const [donating, setDonating] = useState(false);
  const [nameInput, setNameInput] = useState("");
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

  const activeGroup = groups.find((g) => g.id === activeView);

  const closeMode = () => {
    setNameInput("");
    setMode("idle");
  };

  const startCreating = () => {
    setNameInput("");
    setMode("creating");
  };

  const pageItemsWithGroups = pageItems.map(
    (item) => appData.data.items.find((i) => i.id === item.id) ?? item,
  );

  return (
    <div className="nkgwlp-root">
      {open && (
        <>
          <div className="nkgwlp-popup" role="dialog" aria-label="Want list">
            <div className="nkgwlp-popup-header">
              {mode === "creating" || mode === "renaming" ? (
                <form
                  className="nkgwlp-new-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const name = nameInput.trim();
                    if (name) {
                      if (mode === "renaming" && activeGroup) {
                        appData.renameGroup(activeGroup.id, name);
                      } else {
                        appData.addGroup(name);
                        setView(ALL);
                      }
                    }
                    closeMode();
                  }}
                >
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder={
                      mode === "renaming" ? "List name" : "New list name"
                    }
                    aria-label={
                      mode === "renaming" ? "List name" : "New list name"
                    }
                  />
                  <button type="submit">
                    {mode === "renaming" ? "Save" : "Add"}
                  </button>
                  <button
                    type="button"
                    className="nkgwlp-cancel"
                    onClick={closeMode}
                  >
                    Cancel
                  </button>
                </form>
              ) : mode === "menu" && activeGroup ? (
                <div className="nkgwlp-new-form nkgwlp-confirm">
                  <span className="nkgwlp-confirm-text">
                    {activeGroup.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(activeGroup.name);
                      setMode("renaming");
                    }}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className="nkgwlp-danger"
                    onClick={() => setMode("deleting")}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="nkgwlp-cancel"
                    autoFocus
                    onClick={closeMode}
                  >
                    Cancel
                  </button>
                </div>
              ) : mode === "deleting" && activeGroup ? (
                <div className="nkgwlp-new-form nkgwlp-confirm">
                  <span className="nkgwlp-confirm-text">
                    Delete "{activeGroup.name}"?
                  </span>
                  <button
                    type="button"
                    className="nkgwlp-danger"
                    onClick={() => {
                      appData.removeGroup(activeGroup.id);
                      setView(ALL);
                      closeMode();
                    }}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="nkgwlp-cancel"
                    autoFocus
                    onClick={closeMode}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <select
                    className="nkgwlp-switcher"
                    value={activeView}
                    onChange={(e) => {
                      if (e.target.value === NEW) {
                        startCreating();
                      } else {
                        setView(e.target.value);
                      }
                    }}
                    aria-label="Choose list"
                  >
                    <option value={ALL}>
                      Add Items to Custom Lists ({pageItemsWithGroups.length})
                    </option>
                    {[...groups]
                      .sort((a, b) =>
                        a.name.localeCompare(b.name, undefined, {
                          sensitivity: "base",
                        }),
                      )
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.itemOrder.length})
                        </option>
                      ))}
                    <option value={NEW}>+ New list…</option>
                  </select>
                  {activeGroup && (
                    <button
                      className="nkgwlp-menu-btn"
                      aria-label={`Manage list ${activeGroup.name}`}
                      onClick={() => setMode("menu")}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="19" r="2" />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="nkgwlp-content">
              {donating ? (
                <div className="nkgwlp-donate">
                  <p className="muted small">
                    NKG Want List Plus is free. If it's useful, a small tip
                    keeps it going. Thank you!
                  </p>
                  <ul className="plain-list">
                    {DONATE_OPTIONS.map((o) => (
                      <li key={o.label} className="plain-row">
                        <a
                          className="plain-title nkgwlp-donate-link"
                          href={o.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {o.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : activeView === ALL ? (
                <AllItemsList
                  items={pageItemsWithGroups}
                  groups={groups}
                  onToggleGroup={appData.toggleItemGroup}
                  onNewList={startCreating}
                />
              ) : (
                <CuratedList
                  data={appData.data}
                  groupId={activeView}
                  onMoveItemInGroup={appData.moveItemInGroup}
                  onToggleItemGroup={appData.toggleItemGroup}
                />
              )}
            </div>
            <div className="nkgwlp-footer">
              <span>NKG Want List Plus</span>
              <button
                className="nkgwlp-tip"
                onClick={() => setDonating((v) => !v)}
              >
                {donating ? (
                  "← Back"
                ) : (
                  <>
                    <svg
                      className="nkgwlp-tip-icon"
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M14.5 9.5c-.4-.9-1.4-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2.1-.6-2.5-1.5M12 6.5V8m0 8v1.5" />
                    </svg>
                    Tip
                  </>
                )}
              </button>
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
