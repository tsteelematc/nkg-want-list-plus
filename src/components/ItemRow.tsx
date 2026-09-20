import { useState } from "react";
import type { Group, Item } from "../types";

export interface OrderControls {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemoveFromGroup: () => void;
}

export interface GroupChipControls {
  groups: Group[];
  activeGroupIds: string[];
  onToggleGroup: (groupId: string) => void;
}

interface ItemRowProps {
  item: Item;
  sourceNames: string[];
  orderControls?: OrderControls;
  groupChips?: GroupChipControls;
  onRemoveItemEntirely?: () => void;
}

/**
 * Compact, mobile-first list row: small thumbnail on the right, title +
 * publisher only. Tap the row to expand an inline accordion with full
 * details (price/condition, stock #, product line, source) and actions.
 */
export function ItemRow({
  item,
  sourceNames,
  orderControls,
  groupChips,
  onRemoveItemEntirely,
}: ItemRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="item-row">
      <div className="item-row-main">
        {orderControls && (
          <div className="order-controls">
            <button
              className="move-btn"
              aria-label={`Move ${item.title} up`}
              disabled={!orderControls.canMoveUp}
              onClick={(e) => {
                e.stopPropagation();
                orderControls.onMoveUp();
              }}
            >
              ▲
            </button>
            <button
              className="move-btn"
              aria-label={`Move ${item.title} down`}
              disabled={!orderControls.canMoveDown}
              onClick={(e) => {
                e.stopPropagation();
                orderControls.onMoveDown();
              }}
            >
              ▼
            </button>
          </div>
        )}

        <button
          className="item-row-tap-target"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <div className="item-row-text">
            <span className="item-title">{item.title}</span>
            {item.publisher && (
              <span className="item-publisher">{item.publisher}</span>
            )}
          </div>
        </button>

        {item.imageUrl ? (
          <img
            className="item-thumb"
            src={item.imageUrl}
            alt=""
            loading="lazy"
          />
        ) : (
          <div className="item-thumb item-thumb-placeholder" aria-hidden="true" />
        )}
      </div>

      {expanded && (
        <div className="item-row-detail">
          {item.productLine && <p className="muted">{item.productLine}</p>}
          {item.stockNumber && (
            <p className="muted">Stock #: {item.stockNumber}</p>
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
          {sourceNames.length > 0 && (
            <p className="muted small">From: {sourceNames.join(", ")}</p>
          )}
          <p className="muted small">
            <a href={item.productUrl} target="_blank" rel="noreferrer">
              View on Noble Knight
            </a>
          </p>

          {groupChips && (
            <div className="group-chips">
              {groupChips.groups.map((g) => {
                const active = groupChips.activeGroupIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    className={`chip ${active ? "chip-active" : ""}`}
                    onClick={() => groupChips.onToggleGroup(g.id)}
                  >
                    {g.name}
                  </button>
                );
              })}
              {groupChips.groups.length === 0 && (
                <span className="muted small">
                  Create a group on the Groups tab to start organizing.
                </span>
              )}
            </div>
          )}

          <div className="item-row-actions">
            {orderControls && (
              <button
                className="danger small"
                onClick={orderControls.onRemoveFromGroup}
              >
                Remove from this list
              </button>
            )}
            {onRemoveItemEntirely && (
              <button className="danger small" onClick={onRemoveItemEntirely}>
                Delete item
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
