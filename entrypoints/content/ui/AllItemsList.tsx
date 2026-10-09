import { useMemo, useState } from "react";
import type { Group, Item } from "../../../types";
import { focusItemOnPage } from "../../../lib/focusItem";

interface AllItemsListProps {
  items: Item[];
  groups: Group[];
  onToggleGroup: (itemId: string, groupId: string) => void;
  onNewList: () => void;
}

/** Every item on the page, A–Z, with a badge showing how many lists it is on. */
export function AllItemsList({
  items,
  groups,
  onToggleGroup,
  onNewList,
}: AllItemsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedGroups = useMemo(
    () =>
      [...groups].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    [groups],
  );

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
      ),
    [items],
  );

  if (sorted.length === 0) {
    return (
      <p className="empty">
        No items detected on this page yet. Make sure your want list has
        finished loading.
      </p>
    );
  }

  return (
    <>
      <p className="hint">
        Tap a title to jump to it on the page. Tap the + or number to add it
        to your custom lists.
      </p>
      <ul className="plain-list">
      {sorted.map((item) => {
        const count = item.groupIds.filter((id) =>
          groups.some((g) => g.id === id),
        ).length;
        const expanded = expandedId === item.id;
        return (
          <li key={item.id} className="plain-row">
            <div className="plain-row-main">
              <button
                className="plain-title"
                onClick={() => focusItemOnPage(item)}
              >
                {item.title}
              </button>
              <button
                className={`count-badge ${count > 0 ? "has-lists" : ""}`}
                aria-label={`${item.title} is on ${count} lists. Edit lists`}
                aria-expanded={expanded}
                onClick={() => setExpandedId(expanded ? null : item.id)}
              >
                {count > 0 ? count : "+"}
              </button>
            </div>
            {expanded && (
              <div className="check-list">
                {groups.length === 0 && (
                  <span className="muted small">
                    No lists yet. Create your first one below.
                  </span>
                )}
                {sortedGroups.map((g) => (
                  <label key={g.id} className="check-row">
                    <input
                      type="checkbox"
                      checked={item.groupIds.includes(g.id)}
                      onChange={() => onToggleGroup(item.id, g.id)}
                    />
                    <span>{g.name}</span>
                  </label>
                ))}
                <button className="link-btn" onClick={onNewList}>
                  + New list…
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
    </>
  );
}
