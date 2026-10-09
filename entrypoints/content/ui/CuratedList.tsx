import { useMemo } from "react";
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
  onToggleItemGroup: (itemId: string, groupId: string) => void;
}

/** A curated list in its manually ranked order, titles only. */
export function CuratedList({
  data,
  groupId,
  onMoveItemInGroup,
  onToggleItemGroup,
}: CuratedListProps) {
  const group = data.groups.find((g) => g.id === groupId);

  const ordered = useMemo(() => {
    if (!group) return [];
    return group.itemOrder
      .map((id) => data.items.find((i) => i.id === id))
      .filter((i): i is NonNullable<typeof i> => Boolean(i));
  }, [group, data.items]);

  if (!group) return <p className="empty">This list no longer exists.</p>;

  if (ordered.length === 0) {
    return (
      <p className="empty">
        Nothing here yet.         Switch to "Add Items to Custom Lists" and tap an item's badge to add it to this list.
      </p>
    );
  }

  return (
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
            <button
              className="remove-btn"
              aria-label={`Remove ${item.title} from ${group.name}`}
              onClick={() => onToggleItemGroup(item.id, group.id)}
            >
              ×
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
