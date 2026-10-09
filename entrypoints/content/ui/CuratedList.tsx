import { useMemo, useState } from "react";
import type { AppData } from "../../../types";
import { focusItemOnPage } from "../../../lib/focusItem";

interface CuratedListProps {
  data: AppData;
  groupId: string;
  onMoveItemInGroup: (
    groupId: string,
    itemId: string,
    direction: "up" | "down",
  ) => void;
  onItemMenu: (itemId: string) => void;
}

/** A curated list in its manually ranked order, titles only. */
export function CuratedList({
  data,
  groupId,
  onMoveItemInGroup,
  onItemMenu,
}: CuratedListProps) {
  const [showAcquired, setShowAcquired] = useState(false);
  const group = data.groups.find((g) => g.id === groupId);

  const pick = (ids: string[]) =>
    ids
      .map((id) => data.items.find((i) => i.id === id))
      .filter((i): i is NonNullable<typeof i> => Boolean(i));

  const ordered = useMemo(
    () => (group ? pick(group.itemOrder) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [group, data.items],
  );
  const acquired = useMemo(
    () => (group ? pick(group.acquiredIds ?? []) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [group, data.items],
  );

  if (!group) return <p className="empty">This list no longer exists.</p>;

  if (ordered.length === 0 && acquired.length === 0) {
    return (
      <p className="empty">
        Nothing here yet. Switch to "Add Items to Custom Lists" and tap an
        item's badge to add it to this list.
      </p>
    );
  }

  const menuButton = (item: { id: string; title: string }) => (
    <button
      className="nkgwlp-menu-btn small"
      aria-label={`Options for ${item.title}`}
      onClick={() => onItemMenu(item.id)}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="19" r="2" />
      </svg>
    </button>
  );

  return (
    <>
      <ul className="plain-list">
        {ordered.map((item, index) => (
          <li key={item.id} className="plain-row">
            <div className="plain-row-main">
              <div className="order-controls">
                <button
                  className="move-btn"
                  aria-label={`Move ${item.title} up`}
                  disabled={index === 0}
                  onClick={() => onMoveItemInGroup(group.id, item.id, "up")}
                >
                  ▲
                </button>
                <button
                  className="move-btn"
                  aria-label={`Move ${item.title} down`}
                  disabled={index === ordered.length - 1}
                  onClick={() => onMoveItemInGroup(group.id, item.id, "down")}
                >
                  ▼
                </button>
              </div>
              <button
                className="plain-title"
                onClick={() => focusItemOnPage(item)}
              >
                {item.title}
              </button>
              {menuButton(item)}
            </div>
          </li>
        ))}
      </ul>
      {acquired.length > 0 && (
        <div className="nkgwlp-acquired">
          <button
            className="nkgwlp-acquired-toggle"
            aria-expanded={showAcquired}
            onClick={() => setShowAcquired((v) => !v)}
          >
            {showAcquired ? "▾" : "▸"} Acquired ({acquired.length})
          </button>
          {showAcquired && (
            <ul className="plain-list">
              {acquired.map((item) => (
                <li key={item.id} className="plain-row">
                  <div className="plain-row-main">
                    <button
                      className="plain-title acquired-title"
                      onClick={() => focusItemOnPage(item)}
                    >
                      {item.title}
                    </button>
                    {menuButton(item)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
