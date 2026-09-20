import { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { scrapeWantList, ScrapeError } from "../lib/scraper";

export function SourcesPage() {
  const { data, addSource, updateSource, removeSource, mergeScrapedItems } =
    useAppData();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [busySourceId, setBusySourceId] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    addSource(name.trim(), url.trim());
    setName("");
    setUrl("");
  };

  const refresh = async (sourceId: string, sourceUrl: string) => {
    setBusySourceId(sourceId);
    updateSource(sourceId, { lastError: undefined });
    try {
      const items = await scrapeWantList(sourceUrl, data.settings.corsProxyUrl);
      mergeScrapedItems(sourceId, items);
    } catch (err) {
      const message =
        err instanceof ScrapeError
          ? err.message
          : `Unexpected error: ${(err as Error).message}`;
      updateSource(sourceId, { lastError: message });
    } finally {
      setBusySourceId(null);
    }
  };

  return (
    <div className="page">
      <h1>Want List Sources</h1>
      <p className="hint">
        Add one or more Noble Knight Games "My Want List" share URLs. Refresh
        each source to (re)scrape its items — existing group assignments are
        preserved across refreshes.
      </p>

      <form className="row-form" onSubmit={handleAdd}>
        <input
          placeholder="Label, e.g. Tom's Want List"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="https://www.nobleknight.com/MyWantList/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit">Add Source</button>
      </form>

      <ul className="source-list">
        {data.sources.map((source) => (
          <li key={source.id} className="source-item">
            <div className="source-main">
              <strong>{source.name}</strong>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.url}
              </a>
              <div className="meta">
                {source.lastScrapedAt ? (
                  <span>
                    Last scraped {new Date(source.lastScrapedAt).toLocaleString()}
                    {" · "}
                    {source.lastItemCount ?? 0} items
                  </span>
                ) : (
                  <span>Never scraped</span>
                )}
              </div>
              {source.lastError && (
                <div className="error">{source.lastError}</div>
              )}
            </div>
            <div className="source-actions">
              <button
                onClick={() => refresh(source.id, source.url)}
                disabled={busySourceId === source.id}
              >
                {busySourceId === source.id ? "Refreshing…" : "Refresh"}
              </button>
              <button className="danger" onClick={() => removeSource(source.id)}>
                Remove
              </button>
            </div>
          </li>
        ))}
        {data.sources.length === 0 && (
          <li className="empty">No sources yet. Add one above to get started.</li>
        )}
      </ul>
    </div>
  );
}
