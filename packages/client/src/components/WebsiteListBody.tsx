import type { Website } from "@eesimple/types";

import { BulkActionBar } from "./bulk/BulkActionBar";
import { WebsiteBulkActions } from "./bulk/WebsiteBulkActions";
import { WebsiteListItem } from "./WebsiteListItem";
import { WebsiteTable } from "./WebsiteTable";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { COLUMN_CLASS, useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { useListSelection } from "../lib/useListSelection";

/** Bulk-action bar + table/card-grid body for the websites listing, owning the listing's selection. */
export function WebsiteListBody({
  filtered,
}: {
  filtered: Website[];
}) {
  const columns = useBookmarkColumns("websites-listing");
  const viewMode = useViewMode("websites-listing");

  const deletableIds = filtered.filter(w => !w.builtIn).map(w => w.id);
  const selection = useListSelection("websites-listing", deletableIds);
  useRegisterBulkSelect("websites-listing");

  return (
    <>
      <BulkActionBar
        count={selection.count}
        totalSelectable={deletableIds.length}
        onSelectAll={selection.selectAll}
        onClear={selection.clear}
        allSelected={selection.allSelected}
      >
        <WebsiteBulkActions
          selectedIds={selection.selectedIds}
          onDone={selection.clear}
        />
      </BulkActionBar>

      {filtered.length > 0 && viewMode === "table"
        ? (
          <WebsiteTable
            websites={filtered}
            selection={selection}
          />
        )
        : null}

      {filtered.length > 0 && viewMode !== "table"
        ? (
          <div
            className={`
              grid gap-2
              ${COLUMN_CLASS[columns]}
            `}
          >
            {filtered.map(website => (
              <WebsiteListItem
                key={website.id}
                website={website}
                selectable={!website.builtIn}
                selected={selection.isSelected(website.id)}
                onSelectToggle={() => selection.toggle(website.id)}
                inSelectionMode={selection.mode}
              />
            ))}
          </div>
        )
        : null}
    </>
  );
}
