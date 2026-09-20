import { useState } from "react";
import { Link } from "react-router-dom";
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

  return (
    <div className="page">
      <h1>My Lists</h1>
      <p className="hint">
        Each list has its own order — e.g. "My CWBBS Want List" or "Grail
        List". Tap a list to view and reorder its items.
      </p>

      <form className="row-form" onSubmit={handleAdd}>
        <input
          placeholder="New list name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Add List</button>
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
                <Link to={`/groups/${group.id}`} className="group-link">
                  <strong>{group.name}</strong>{" "}
                  <span className="muted small">
                    ({group.itemOrder.length} items)
                  </span>
                </Link>
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
          <li className="empty">No lists yet. Add one above.</li>
        )}
      </ul>
    </div>
  );
}
