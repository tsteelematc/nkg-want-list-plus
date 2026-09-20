import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";
import { ItemRow } from "../components/ItemRow";

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { data, moveItemInGroup, toggleItemGroup, removeItem } = useAppData();
  const [showAddItems, setShowAddItems] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  const group = data.groups.find((g) => g.id === groupId);

  const orderedItems = useMemo(() => {
    if (!group) return [];
    return group.itemOrder
      .map((itemId) => data.items.find((i) => i.id === itemId))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [group, data.items]);

  const availableToAdd = useMemo(() => {
    if (!group) return [];
    const q = addSearch.trim().toLowerCase();
    return data.items.filter((item) => {
      if (item.groupIds.includes(group.id)) return false;
      if (q && !item.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [group, data.items, addSearch]);

  if (!group) {
    return (
      <div className="page">
        <p className="empty">
          This list no longer exists. <Link to="/">Back to lists</Link>
        </p>
      </div>
    );
  }

  const sourceNamesFor = (sourceIds: string[]) =>
    sourceIds
      .map((id) => data.sources.find((s) => s.id === id)?.name)
      .filter((n): n is string => Boolean(n));

  return (
    <div className="page">
      <p className="breadcrumb">
        <Link to="/">‹ All lists</Link>
      </p>
      <h1>{group.name}</h1>
      <p className="hint">
        {orderedItems.length} item{orderedItems.length === 1 ? "" : "s"} —
        use the arrows to reorder this list. Tap an item for details.
      </p>

      <button
        className="add-items-toggle"
        onClick={() => setShowAddItems((v) => !v)}
      >
        {showAddItems ? "Close" : "+ Add items to this list"}
      </button>

      {showAddItems && (
        <div className="add-items-panel">
          <input
            placeholder="Search all items…"
            value={addSearch}
            onChange={(e) => setAddSearch(e.target.value)}
          />
          <ul className="add-items-list">
            {availableToAdd.map((item) => (
              <li key={item.id} className="add-items-row">
                <span className="item-title">{item.title}</span>
                <button onClick={() => toggleItemGroup(item.id, group.id)}>
                  Add
                </button>
              </li>
            ))}
            {availableToAdd.length === 0 && (
              <li className="muted small">
                {data.items.length === 0
                  ? "No items scraped yet — add a source on the Sources tab first."
                  : "Every item is already on this list."}
              </li>
            )}
          </ul>
        </div>
      )}

      <ul className="item-list">
        {orderedItems.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            sourceNames={sourceNamesFor(item.sourceIds)}
            orderControls={{
              canMoveUp: index > 0,
              canMoveDown: index < orderedItems.length - 1,
              onMoveUp: () => moveItemInGroup(group.id, item.id, "up"),
              onMoveDown: () => moveItemInGroup(group.id, item.id, "down"),
              onRemoveFromGroup: () => toggleItemGroup(item.id, group.id),
            }}
            onRemoveItemEntirely={() => removeItem(item.id)}
          />
        ))}
        {orderedItems.length === 0 && (
          <li className="empty">
            No items in this list yet. Use "+ Add items to this list" above,
            or add items from the Items tab.
          </li>
        )}
      </ul>
    </div>
  );
}
