import { useRef, useState } from "react";
import { useAppData } from "../../lib/useAppData";
import {
  exportAppDataToFile,
  importAppDataFromFile,
} from "../../lib/storage";

export function App() {
  const appData = useAppData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renamingSourceId, setRenamingSourceId] = useState<string | null>(
    null,
  );

  if (!appData.ready) {
    return (
      <div className="page">
        <p>Loading…</p>
      </div>
    );
  }

  const { data } = appData;

  const handleImportFile = async (file: File) => {
    setImportError(null);
    try {
      const imported = await importAppDataFromFile(file);
      appData.replaceAllData(imported);
    } catch (err) {
      setImportError(
        `Couldn't import that file: ${(err as Error).message}`,
      );
    }
  };

  return (
    <div className="page">
      <header>
        <h1>NKG Want List Plus — Settings</h1>
        <p className="hint">
          Manage your lists and Noble Knight want-list sources, or back up
          your data.
        </p>
      </header>

      <section>
        <h2>My Lists</h2>
        <ul className="row-list">
          {data.groups.map((group) => (
            <li key={group.id} className="row">
              {renamingGroupId === group.id ? (
                <form
                  className="rename-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.elements.namedItem(
                      "name",
                    ) as HTMLInputElement;
                    const name = input.value.trim();
                    if (name) appData.renameGroup(group.id, name);
                    setRenamingGroupId(null);
                  }}
                >
                  <input name="name" defaultValue={group.name} autoFocus />
                  <button type="submit">Save</button>
                </form>
              ) : (
                <>
                  <span className="row-title">{group.name}</span>
                  <span className="meta">{group.itemOrder.length} items</span>
                  <div className="row-actions">
                    <button onClick={() => setRenamingGroupId(group.id)}>
                      Rename
                    </button>
                    <button
                      className="danger"
                      onClick={() => appData.removeGroup(group.id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
          {data.groups.length === 0 && (
            <li className="empty">
              No lists yet. Create one from the bottom panel on a Noble
              Knight want-list page.
            </li>
          )}
        </ul>
      </section>

      <section>
        <h2>Want-List Sources</h2>
        <p className="hint">
          Auto-detected each time you visit a Noble Knight "My Want List"
          page.
        </p>
        <ul className="row-list">
          {data.sources.map((source) => (
            <li key={source.id} className="row">
              {renamingSourceId === source.id ? (
                <form
                  className="rename-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.elements.namedItem(
                      "name",
                    ) as HTMLInputElement;
                    const name = input.value.trim();
                    if (name) appData.renameSource(source.id, name);
                    setRenamingSourceId(null);
                  }}
                >
                  <input name="name" defaultValue={source.name} autoFocus />
                  <button type="submit">Save</button>
                </form>
              ) : (
                <>
                  <div className="row-main">
                    <span className="row-title">{source.name}</span>
                    <a href={source.url} target="_blank" rel="noreferrer" className="meta">
                      {source.url}
                    </a>
                    <span className="meta">
                      Last synced:{" "}
                      {new Date(source.lastSyncedAt).toLocaleString()} (
                      {source.lastItemCount ?? 0} items)
                    </span>
                  </div>
                  <div className="row-actions">
                    <button onClick={() => setRenamingSourceId(source.id)}>
                      Rename
                    </button>
                    <button
                      className="danger"
                      onClick={() => appData.removeSource(source.id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
          {data.sources.length === 0 && (
            <li className="empty">
              No want-list pages visited yet. Open your Noble Knight "My
              Want List" page to get started.
            </li>
          )}
        </ul>
      </section>

      <section>
        <h2>Backup &amp; Restore</h2>
        <div className="row-actions">
          <button onClick={() => exportAppDataToFile(data)}>
            Export backup (JSON)
          </button>
          <button onClick={() => fileInputRef.current?.click()}>
            Import backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = "";
            }}
          />
        </div>
        {importError && <p className="error">{importError}</p>}
      </section>

      <section>
        <h2>Danger Zone</h2>
        <button
          className="danger"
          onClick={() => {
            if (
              confirm(
                "Delete all lists, sources, and items? This can't be undone unless you have a backup.",
              )
            ) {
              appData.clearAllData();
            }
          }}
        >
          Clear all data
        </button>
      </section>
    </div>
  );
}
