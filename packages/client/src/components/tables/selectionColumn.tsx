import type { ListSelection } from "../../lib/useListSelection";
import type { ColumnDef } from "@tanstack/react-table";

import i18n from "../../i18n";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface SelectionColumnArgs<T> {
  getId: (row: T) => string;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  /** Shift-click range select from the last-toggled anchor; falls back to `toggle` when unset. */
  selectRange?: (id: string) => void;
  allSelected: boolean;
  /** True while ≥1 row is selected — keeps every checkbox visible, not just hovered ones. */
  anySelected: boolean;
  onToggleAll: () => void;
  /** Rows that can't be selected (e.g. built-ins) render no checkbox. */
  canSelect?: (row: T) => boolean;
}

/**
 * A left-most checkbox column for the shared `DataTable`. Checkboxes are hidden by default and
 * revealed when the table is hovered (the `group/seltable` wrapper) or once anything is selected, so
 * the column adds no visual noise until needed. Checkbox clicks never trigger row navigation: the
 * Radix checkbox carries `role=checkbox` and the wrapper carries `data-no-row-click`, both of which
 * the table's interactive-target guard already skips.
 */
export function selectionColumn<T>({
  getId,
  isSelected,
  toggle,
  selectRange,
  allSelected,
  anySelected,
  onToggleAll,
  canSelect,
}: SelectionColumnArgs<T>): ColumnDef<T> {
  const revealClass = (visible: boolean) => cn(
    `
      flex items-center opacity-0 transition-opacity
      group-hover/seltable:opacity-100
      focus-within:opacity-100
    `,
    visible && "opacity-100",
  );
  return {
    id: "__select",
    enableSorting: false,
    enableResizing: false,
    size: 36,
    header: () => (
      <div
        data-no-row-click
        className={revealClass(anySelected)}
      >
        <Checkbox
          aria-label={i18n.t("Select all")}
          checked={allSelected}
          onCheckedChange={() => onToggleAll()}
        />
      </div>
    ),
    cell: ({
      row,
    }) => {
      if (canSelect && !canSelect(row.original)) return null;
      const id = getId(row.original);
      const selected = isSelected(id);
      return (
        <div
          data-no-row-click
          className={revealClass(anySelected || selected)}
        >
          {/* Drive selection off `onClick` (not `onCheckedChange`) so a shift-click can range-select;
              the checkbox is controlled by `checked`, and keyboard activation fires click too. */}
          <Checkbox
            aria-label={i18n.t("Select row")}
            checked={selected}
            onClick={e => (e.shiftKey && selectRange ? selectRange(id) : toggle(id))}
          />
        </div>
      );
    },
  };
}

/** Build a selection column straight from a {@link ListSelection}, wiring select-all to it. */
export function listingSelectionColumn<T>(
  selection: ListSelection,
  getId: (row: T) => string,
  canSelect?: (row: T) => boolean,
): ColumnDef<T> {
  return selectionColumn<T>({
    getId,
    isSelected: selection.isSelected,
    toggle: selection.toggle,
    selectRange: selection.selectRange,
    allSelected: selection.allSelected,
    anySelected: selection.count > 0,
    onToggleAll: () => (selection.allSelected ? selection.clear() : selection.selectAll()),
    canSelect,
  });
}
