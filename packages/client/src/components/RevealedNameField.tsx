import type { BookmarkFormApi } from "./bookmarkFormSchema";

import { BookmarkRomanizedNameField } from "./BookmarkRomanizedNameField";
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
  /** Whether to render the Romanized name field. Defaults to true. */
  showRomanized?: boolean;
}

/**
 * Right column of the banner grid: the Name field (title) with its fetch-title button, undo line,
 * and fetch feedback, plus the Romanized name field. `showTitle`/`showRomanized` let the placement
 * settings render either alone; with both (the default) the layout is identical to before —
 * `BookmarkTitleField` renders the romanized field in its slot, between the title and feedback.
 */
export function RevealedNameField({
  showTitle = true,
  showRomanized = true,
  ...props
}: RevealedNameFieldProps) {
  if (showTitle) {
    return (
      <BookmarkTitleField
        {...props}
        romanizedSlot={showRomanized ? <BookmarkRomanizedNameField form={props.form} /> : undefined}
      />
    );
  }
  if (showRomanized) {
    return (
      <div className="flex flex-col gap-4">
        <BookmarkRomanizedNameField form={props.form} />
      </div>
    );
  }
  return null;
}
