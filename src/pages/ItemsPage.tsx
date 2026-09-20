import { useMemo, useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { ItemRow } from "../components/ItemRow";

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

  const sourceNamesFor = (sourceIds: string[]) =>
    sourceIds
      .map((id) => data.sources.find((s) => s.id === id)?.name)
      .filter((n): n is string => Boolean(n));

  return (
    <div className="page">
      <h1>All Items</h1>
      <p className="hint">
        Browse everything scraped from your sources. Tap an item to assign it
        to one or more lists.
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
          <option value="all">All lists</option>
          <option value="ungrouped">Not on a list</option>
          {data.groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <ul className="item-list">
        {filteredItems.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            sourceNames={sourceNamesFor(item.sourceIds)}
            groupChips={{
              groups: data.groups,
              activeGroupIds: item.groupIds,
              onToggleGroup: (groupId) => toggleItemGroup(item.id, groupId),
            }}
            onRemoveItemEntirely={() => removeItem(item.id)}
          />
        ))}
        {filteredItems.length === 0 && (
          <li className="empty">
            No items match your filters yet. Add and refresh a source first.
          </li>
        )}
      </ul>
    </div>
  );
}
