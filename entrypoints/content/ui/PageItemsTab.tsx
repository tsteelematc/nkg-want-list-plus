import type { Group, Item } from "../../../types";
import { ItemRow } from "./ItemRow";

interface PageItemsTabProps {
  items: Item[];
  groups: Group[];
  onToggleGroup: (itemId: string, groupId: string) => void;
}

/**
 * Shows the items detected on the current want-list page, with group-chip
 * controls to quickly assign/unassign each one to a list. No ordering UI
 * here — ordering only makes sense inside a specific list (see
 * ListDetailView).
 */
export function PageItemsTab({
  items,
  groups,
  onToggleGroup,
}: PageItemsTabProps) {
  if (items.length === 0) {
    return (
      <p className="empty">
        No items detected on this page yet. Make sure your want list has
        finished loading.
      </p>
    );
  }

  return (
    <ul className="item-list">
      {items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          sourceNames={[]}
          groupChips={{
            groups,
            activeGroupIds: item.groupIds,
            onToggleGroup: (groupId) => onToggleGroup(item.id, groupId),
          }}
        />
      ))}
    </ul>
  );
}
