import { useState } from "react";
import { useAppData } from "../context/AppDataContext";

export function GroupsPage() {
  const { data, addGroup, renameGroup, removeGroup } = useAppData();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addGroup(name.trim());
    setName("");
  };

  const itemCountFor = (groupId: string) =>
    data.items.filter((i) => i.groupIds.includes(groupId)).length;

  return (
    <div className="page">
      <h1>Groups</h1>
      <p className="hint">
        Groups act like tags — e.g. "My CWBBS Want List" or "Grail List" — and
        a single item can belong to as many groups as you like. Assign items
        to groups from the Items page.
      </p>

      <form className="row-form" onSubmit={handleAdd}>
        <input
          placeholder="New group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Add Group</button>
      </form>

      <ul className="group-list">
        {data.groups.map((group) => (
          <li key={group.id} className="group-item">
            {editingId === group.id ? (
              <form
                className="row-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editingName.trim()) {
                    renameGroup(group.id, editingName.trim());
                  }
                  setEditingId(null);
                }}
              >
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  autoFocus
                />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <span>
                  <strong>{group.name}</strong>{" "}
                  <span className="muted small">
                    ({itemCountFor(group.id)} items)
                  </span>
                </span>
                <div className="source-actions">
                  <button
                    onClick={() => {
                      setEditingId(group.id);
                      setEditingName(group.name);
                    }}
                  >
                    Rename
                  </button>
                  <button className="danger" onClick={() => removeGroup(group.id)}>
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
        {data.groups.length === 0 && (
          <li className="empty">No groups yet. Add one above.</li>
        )}
      </ul>
    </div>
  );
}
