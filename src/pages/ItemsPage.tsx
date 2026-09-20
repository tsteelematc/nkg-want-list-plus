import { useMemo, useState } from "react";
import { useAppData } from "../context/AppDataContext";

export function ItemsPage() {
  const { data, toggleItemGroup, removeItem } = useAppData();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.items.filter((item) => {
      if (q && !item.title.toLowerCase().includes(q)) return false;
      if (sourceFilter !== "all" && !item.sourceIds.includes(sourceFilter))
        return false;
      if (groupFilter === "ungrouped" && item.groupIds.length > 0) return false;
      if (
        groupFilter !== "all" &&
        groupFilter !== "ungrouped" &&
        !item.groupIds.includes(groupFilter)
      )
        return false;
      return true;
    });
  }, [data.items, search, sourceFilter, groupFilter]);

  const sourceName = (id: string) =>
    data.sources.find((s) => s.id === id)?.name ?? "Unknown source";

  return (
    <div className="page">
      <h1>Items</h1>
      <p className="hint">
        Browse all scraped items and assign each one to any number of groups.
      </p>

      <div className="filters">
        <input
          placeholder="Search title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
        >
          <option value="all">All sources</option>
          {data.sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
        >
          <option value="all">All groups</option>
          <option value="ungrouped">Ungrouped</option>
          {data.groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div className="item-grid">
        {filteredItems.map((item) => (
          <div className="item-card" key={item.id}>
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.title} loading="lazy" />
            )}
            <div className="item-body">
              <a href={item.productUrl} target="_blank" rel="noreferrer">
                <strong>{item.title}</strong>
              </a>
              {item.publisher && <div className="muted">By: {item.publisher}</div>}
              {item.productLine && (
                <div className="muted">{item.productLine}</div>
              )}
              {item.stockNumber && (
                <div className="muted">Stock #: {item.stockNumber}</div>
              )}
              {item.conditions.length > 0 && (
                <ul className="conditions">
                  {item.conditions.map((c, idx) => (
                    <li key={idx}>
                      {c.condition} — ${c.price.toFixed(2)}
                      {c.note && ` (${c.note})`}
                    </li>
                  ))}
                </ul>
              )}
              <div className="muted small">
                From: {item.sourceIds.map(sourceName).join(", ")}
              </div>

              <div className="group-chips">
                {data.groups.map((g) => {
                  const active = item.groupIds.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      className={`chip ${active ? "chip-active" : ""}`}
                      onClick={() => toggleItemGroup(item.id, g.id)}
                    >
                      {g.name}
                    </button>
                  );
                })}
                {data.groups.length === 0 && (
                  <span className="muted small">
                    Create a group on the Groups page to start organizing.
                  </span>
                )}
              </div>

              <button className="danger small" onClick={() => removeItem(item.id)}>
                Remove item
              </button>
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="empty">
            No items match your filters yet. Add and refresh a source first.
          </div>
        )}
      </div>
    </div>
  );
}
