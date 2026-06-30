import type { ListSelection } from "../lib/useListSelection";
import type { PropertyGroup } from "@eesimple/types";

import { PropertyGroupListItem } from "./PropertyGroupListItem";
import { COLUMN_CLASS, useBookmarkColumns } from "../lib/bookmarkColumns";

/** Card-grid view of the property-group listing. */
export function PropertyGroupGrid({
  groups,
  selection,
}: {
  groups: PropertyGroup[];
  selection: ListSelection;
}) {
  const columns = useBookmarkColumns("property-groups-listing");

  return (
    <div
      className={`
        grid gap-2
        ${COLUMN_CLASS[columns]}
      `}
    >
      {groups.map(group => (
        <PropertyGroupListItem
          key={group.id}
          group={group}
          selectable
          selected={selection.isSelected(group.id)}
          onSelectToggle={() => selection.toggle(group.id)}
          inSelectionMode={selection.mode}
        />
      ))}
    </div>
  );
}
