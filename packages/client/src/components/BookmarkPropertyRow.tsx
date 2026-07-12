import type { Bookmark, CustomProperty } from "@eesimple/types";

import {
  BooleanRowCell,
  ChoicesRowCell,
  DateTimeRowCell,
  FileRowCell,
  NumberRowCell,
  ProgressRowCell,
  RatingRowCell,
  SectionsRowCell,
  TextRowCell,
} from "./bookmarkPropertyRowKinds";
import { useDefaultFieldZones } from "../lib/bookmarkCardFields";
import { buildBookmarkPropertyRows } from "../lib/bookmarkPropertyRows";

interface BookmarkPropertyRowProps {
  bookmark: Bookmark;
  /** The single custom property whose value row is rendered. */
  property: CustomProperty;
  /** When provided, a `clickableInView` boolean row renders as a toggle. */
  onSaveBoolean?: (propertyId: string, value: boolean) => void;
  /** When provided, a sections row's entries render clickable done-checkboxes. */
  onToggleSectionCompleted?: (propertyId: string, entryId: string, completed: boolean) => void;
}

/**
 * Renders **one** custom property's read-only value row — the single-property extraction of the row
 * markup that used to live inline in `BookmarkPropertySections`, so each property is an independently
 * placeable **view** field (#1163+). Builds the typed row for just this property via the shared pure
 * `buildBookmarkPropertyRows` and delegates to the matching value-kind cell (see
 * `bookmarkPropertyRowKinds.tsx`); returns `null` when the property has no resolvable value (not
 * `showInDetails`, empty, or the wrong type) — the layout `space-y-*` stack then adds no gap for it,
 * exactly like the other self-hiding view fields.
 */
export function BookmarkPropertyRow({
  bookmark, property, onSaveBoolean, onToggleSectionCompleted,
}: BookmarkPropertyRowProps) {
  // The per-card boolean display knobs (show-if-false / colon / value-order / clickable) come from the
  // Default card display rule on non-listing surfaces like this one.
  const defaultZones = useDefaultFieldZones();
  const {
    numberRows, ratingRows, booleanRows, dateTimeRows, fileRows, choicesRows, progressRows, sectionsRows, textRows,
  } = buildBookmarkPropertyRows(bookmark, [property], defaultZones);

  if (numberRows[0]) return <NumberRowCell row={numberRows[0]} />;
  if (booleanRows[0]) {
    return (
      <BooleanRowCell
        row={booleanRows[0]}
        onSaveBoolean={onSaveBoolean}
      />
    );
  }
  if (dateTimeRows[0]) return <DateTimeRowCell row={dateTimeRows[0]} />;
  if (ratingRows[0]) return <RatingRowCell row={ratingRows[0]} />;
  if (fileRows[0]) return <FileRowCell row={fileRows[0]} />;
  if (choicesRows[0]) return <ChoicesRowCell row={choicesRows[0]} />;
  if (progressRows[0]) return <ProgressRowCell row={progressRows[0]} />;
  if (sectionsRows[0]) {
    return (
      <SectionsRowCell
        row={sectionsRows[0]}
        onToggleCompleted={onToggleSectionCompleted}
      />
    );
  }
  if (textRows[0]) return <TextRowCell row={textRows[0]} />;
  return null;
}
