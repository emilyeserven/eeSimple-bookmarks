import type { useListSelection } from "../lib/useListSelection";
import type { CustomProperty } from "@eesimple/types";

import { PropertyPreview } from "./PropertyPreview";
import { COLUMN_CLASS } from "../lib/bookmarkColumns";

/** Card-grid view of the custom-property listing: one {@link PropertyPreview} per property. */
export function CustomPropertyGrid({
  filtered,
  allProperties,
  columns,
  selection,
}: {
  filtered: CustomProperty[];
  allProperties: CustomProperty[];
  columns: number;
  selection: ReturnType<typeof useListSelection>;
}) {
  return (
    <div
      className={`
        grid gap-3
        ${COLUMN_CLASS[columns]}
      `}
    >
      {filtered.map(property => (
        <PropertyPreview
          key={property.id}
          property={property}
          allProperties={allProperties}
          selectable={!property.builtIn}
          selected={selection.isSelected(property.id)}
          onSelectToggle={() => selection.toggle(property.id)}
          inSelectionMode={selection.mode}
        />
      ))}
    </div>
  );
}
