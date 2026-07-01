import type { GroupRowProps, SortableHandle } from "./levelGroupRowTypes";

import { useState } from "react";

import { LevelGroupEditRow } from "./LevelGroupEditRow";
import { LevelGroupSummaryRow } from "./LevelGroupSummaryRow";

type LevelGroupRowContentProps = GroupRowProps & SortableHandle;

/**
 * The form fields of a level-group row (everything inside the sortable drag wrapper). Coordinates
 * between the collapsed summary view and the expanded edit view.
 */
export function LevelGroupRowContent(props: LevelGroupRowContentProps) {
  const [isEditing, setIsEditing] = useState(false);

  return isEditing
    ? (
      <LevelGroupEditRow
        {...props}
        onDone={() => setIsEditing(false)}
      />
    )
    : (
      <LevelGroupSummaryRow
        {...props}
        onEdit={() => setIsEditing(true)}
      />
    );
}
