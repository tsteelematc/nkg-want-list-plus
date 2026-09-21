import { useState } from "react";
import type { Group } from "../../../types";

interface ListsTabProps {
  groups: Group[];
  itemCountByGroup: (groupId: string) => number;
  onOpenGroup: (groupId: string) => void;
  onAddGroup: (name: string) => void;
  onRemoveGroup: (groupId: string) => void;
}

/**
 * Home view of the "My Lists" tab: shows all groups (lists) with an item
 * count, tap one to open its ordered detail view.
 */
export function ListsTab({
  groups,
  itemCountByGroup,
  onOpenGroup,
  onAddGroup,
  onRemoveGroup,
}: ListsTabProps) {
  const [newName, setNewName] = useState("");

  return (
    <div>
      <form
        className="add-group-form"
        onSubmit={(e) => {
          e.preventDefault();
          const name = newName.trim();
          if (!name) return;
          onAddGroup(name);
          setNewName("");
        }}
      >
        <input
          placeholder="New list name, e.g. Grail List"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit">+ Add list</button>
      </form>

      <ul className="group-list">
        {groups.map((g) => (
          <li key={g.id} className="group-item">
            <button className="group-link" onClick={() => onOpenGroup(g.id)}>
              <span className="group-name">{g.name}</span>
              <span className="meta">
                {itemCountByGroup(g.id)} item
                {itemCountByGroup(g.id) === 1 ? "" : "s"}
              </span>
            </button>
            <button
              className="danger small"
              onClick={() => onRemoveGroup(g.id)}
              aria-label={`Delete list ${g.name}`}
            >
              Delete
            </button>
          </li>
        ))}
        {groups.length === 0 && (
          <li className="empty">
            No lists yet. Add one above, e.g. "Grail List" or "CWBBS Want
            List".
          </li>
        )}
      </ul>
    </div>
  );
}
