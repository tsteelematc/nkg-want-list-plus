import { useMemo } from "react";
import type { AppData } from "../../../types";
import { ItemRow } from "./ItemRow";

interface ListDetailViewProps {
  data: AppData;
  groupId: string;
  onBack: () => void;
  onMoveItemInGroup: (
    groupId: string,
    itemId: string,
    direction: "up" | "down",
  ) => void;
  onToggleItemGroup: (itemId: string, groupId: string) => void;
  onRemoveItem: (itemId: string) => void;
}

/**
 * The core "want list" screen: a single list's items in their
 * manually-ranked order, with move up/down controls. Mirrors
 * GroupDetailPage from the original standalone web app.
 */
export function ListDetailView({
  data,
  groupId,
  onBack,
  onMoveItemInGroup,
  onToggleItemGroup,
  onRemoveItem,
}: ListDetailViewProps) {
  const group = data.groups.find((g) => g.id === groupId);

  const orderedItems = useMemo(() => {
    if (!group) return [];
    return group.itemOrder
      .map((itemId) => data.items.find((i) => i.id === itemId))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [group, data.items]);

  if (!group) {
    return (
      <div>
        <p className="empty">This list no longer exists.</p>
        <button onClick={onBack}>‹ All lists</button>
      </div>
    );
  }

  const sourceNamesFor = (sourceIds: string[]) =>
    sourceIds
      .map((id) => data.sources.find((s) => s.id === id)?.name)
      .filter((n): n is string => Boolean(n));

  return (
    <div>
      <p className="breadcrumb">
        <button className="link-btn" onClick={onBack}>
          ‹ All lists
        </button>
      </p>
      <h2>{group.name}</h2>
      <p className="hint">
        {orderedItems.length} item{orderedItems.length === 1 ? "" : "s"} — use
        the arrows to reorder. Tap an item to jump to it on the page.
      </p>

      <ul className="item-list">
        {orderedItems.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            sourceNames={sourceNamesFor(item.sourceIds)}
            orderControls={{
              canMoveUp: index > 0,
              canMoveDown: index < orderedItems.length - 1,
              onMoveUp: () => onMoveItemInGroup(group.id, item.id, "up"),
              onMoveDown: () => onMoveItemInGroup(group.id, item.id, "down"),
              onRemoveFromGroup: () => onToggleItemGroup(item.id, group.id),
            }}
            onRemoveItemEntirely={() => onRemoveItem(item.id)}
          />
        ))}
        {orderedItems.length === 0 && (
          <li className="empty">
            No items in this list yet. Go to "On this page" and tap a list
            chip on an item to add it here.
          </li>
        )}
      </ul>
    </div>
  );
}
