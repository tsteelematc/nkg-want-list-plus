import type { Group, Item } from "../../../types";
import { findProductCardElement } from "../../../lib/domExtractor";

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

function getStockBadge(item: Item): { label: string; isInStock: boolean } {
  if (item.conditions.length > 0) {
    return { label: "In stock", isInStock: true };
  }

  if (item.stockNumber) {
    return { label: "In stock", isInStock: true };
    // return { label: `Stock # ${item.stockNumber}`, isInStock: true };
  }

  return { label: "Not in stock", isInStock: false };
}

/**
 * Compact, mobile-first row: title, publisher, and a small stock badge.
 * Clicking the row scrolls the matching item card into view on the actual
 * Noble Knight page; the extension is a list manager, not a duplicate mini
 * product viewer.
 */
export function ItemRow({
  item,
  sourceNames,
  orderControls,
  groupChips,
  onRemoveItemEntirely,
}: ItemRowProps) {
  const stock = getStockBadge(item);

  const onActivate = () => {
    const card = findProductCardElement(document, item);
    if (!card) return;

    const top = card.getBoundingClientRect().top + window.scrollY - 24;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });

    const previousOutline = card.style.outline;
    const previousOutlineOffset = card.style.outlineOffset;
    card.style.outline = "2px solid #005996";
    card.style.outlineOffset = "2px";
    window.setTimeout(() => {
      card.style.outline = previousOutline;
      card.style.outlineOffset = previousOutlineOffset;
    }, 1200);
  };

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
          onClick={onActivate}
          aria-label={`Focus ${item.title} on the Noble Knight page`}
        >
          <div className="item-row-text">
            <span className="item-title">{item.title}</span>
            <span className="item-row-subline">
              {item.publisher && (
                <span className="item-publisher">{item.publisher}</span>
              )}
              <span
                className={`stock-badge ${stock.isInStock ? "in-stock" : "out-of-stock"}`}
              >
                {stock.label}
              </span>
            </span>
          </div>
        </button>
      </div>

      {(groupChips || sourceNames.length > 0 || onRemoveItemEntirely || orderControls) && (
        <div className="item-row-footer">
          {sourceNames.length > 0 && (
            <span className="muted small">From: {sourceNames.join(", ")}</span>
          )}

          {groupChips && (
            <div className="group-chips">
              {groupChips.groups.map((g) => {
                const active = groupChips.activeGroupIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    className={`chip ${active ? "chip-active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      groupChips.onToggleGroup(g.id);
                    }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  orderControls.onRemoveFromGroup();
                }}
              >
                Remove from this list
              </button>
            )}
            {onRemoveItemEntirely && (
              <button
                className="danger small"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveItemEntirely();
                }}
              >
                Delete item
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
