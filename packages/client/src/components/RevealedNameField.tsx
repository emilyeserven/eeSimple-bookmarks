import type { BookmarkFormApi } from "./bookmarkFormSchema";

import { BookmarkNamesField } from "./BookmarkNamesField";
import { BookmarkTitleField } from "./BookmarkTitleField";

export interface RevealedNameFieldProps {
  form: BookmarkFormApi;
  onTitleBlur: () => void;
  onTitleChange: () => void;
  onFetchTitleClick: (url: string) => void;
  isFetchTitlePending: boolean;
  isFetchMetadataPending: boolean;
  titleFetch: { previous: string } | null;
  onUndoTitleFetch: () => void;
  fetchTitleIsSuccess: boolean;
  fetchTitleIsError: boolean;
  fetchTitleErrorMessage: string | undefined;
  fetchedTitle: string | undefined;
  isReportingTitle: boolean;
  onStartReporting: () => void;
  expectedTitle: string;
  onExpectedTitleChange: (v: string) => void;
  onCancelReporting: () => void;
  /** Whether to render the Name (title) field. Defaults to true. */
  showTitle?: boolean;
  /** Whether to render the names field. Defaults to true. */
  showNames?: boolean;
}

/**
 * Right column of the banner grid: the Name field (title) with its fetch-title button, undo line,
 * and fetch feedback, plus the names field. `showTitle`/`showNames` let the placement
 * settings render either alone; with both (the default) the layout is identical to before —
 * `BookmarkTitleField` renders the names field in its slot, between the title and feedback.
 */
export function RevealedNameField({
  showTitle = true,
  showNames = true,
  ...props
}: RevealedNameFieldProps) {
  if (showTitle) {
    return (
      <BookmarkTitleField
        {...props}
        namesSlot={showNames ? <BookmarkNamesField form={props.form} /> : undefined}
      />
    );
  }
  if (showNames) {
    return (
      <div className="flex flex-col gap-4">
        <BookmarkNamesField form={props.form} />
      </div>
    );
  }
  return null;
}
