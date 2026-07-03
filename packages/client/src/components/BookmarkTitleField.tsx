import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { ReactNode } from "react";

import { Loader2, Sparkles } from "lucide-react";

import { TitleFetchFeedback } from "./BookmarkTitleFeedback";
import { isFetchableUrl } from "../lib/url";

import { Button } from "@/components/ui/button";

/**
 * The title-field render props. The title-fetch/feedback handlers are optional so the field can be
 * placed via the standard-field zone (which threads the whole render-props bag) as well as by the
 * Name cluster in the banner grid. When absent the fetch button is inert and the feedback is empty.
 */
export interface BookmarkTitleFieldProps {
  form: BookmarkFormApi;
  onTitleBlur?: () => void;
  onTitleChange?: () => void;
  onFetchTitleClick?: (url: string) => void;
  isFetchTitlePending?: boolean;
  isFetchMetadataPending?: boolean;
  titleFetch?: { previous: string } | null;
  onUndoTitleFetch?: () => void;
  fetchTitleIsSuccess?: boolean;
  fetchTitleIsError?: boolean;
  fetchTitleErrorMessage?: string | undefined;
  fetchedTitle?: string | undefined;
  isReportingTitle?: boolean;
  onStartReporting?: () => void;
  expectedTitle?: string;
  onExpectedTitleChange?: (v: string) => void;
  onCancelReporting?: () => void;
  /** Optional field (typically the romanized-name input) rendered between the title and its feedback. */
  romanizedSlot?: ReactNode;
}

/**
 * The Name field: a title textarea with its fetch-title button, an optional slot (used for the
 * romanized-name field when co-located), the undo line, and the fetch feedback. Extracted from
 * `RevealedNameField` so the title can be placed independently by the standard-field zone.
 */
export function BookmarkTitleField({
  form,
  onTitleBlur = () => undefined,
  onTitleChange = () => undefined,
  onFetchTitleClick = () => undefined,
  isFetchTitlePending = false,
  isFetchMetadataPending = false,
  titleFetch = null,
  onUndoTitleFetch = () => undefined,
  fetchTitleIsSuccess = false,
  fetchTitleIsError = false,
  fetchTitleErrorMessage,
  fetchedTitle,
  isReportingTitle = false,
  onStartReporting = () => undefined,
  expectedTitle = "",
  onExpectedTitleChange = () => undefined,
  onCancelReporting = () => undefined,
  romanizedSlot,
}: BookmarkTitleFieldProps) {
  return (
    <div className="flex flex-col gap-4">
      <form.Subscribe selector={state => state.values.url}>
        {url => (
          <form.AppField name="title">
            {field => (
              <field.TextareaField
                label="Name"
                rows={1}
                inputClassName="min-h-9"
                onBlur={onTitleBlur}
                onChange={onTitleChange}
                action={(
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Fetch title from URL"
                    aria-label="Fetch title from URL"
                    disabled={!isFetchableUrl(url) || isFetchTitlePending || isFetchMetadataPending}
                    onClick={() => onFetchTitleClick(url)}
                  >
                    {isFetchTitlePending || isFetchMetadataPending
                      ? <Loader2 className="size-4 animate-spin" />
                      : <Sparkles className="size-4" />}
                  </Button>
                )}
              />
            )}
          </form.AppField>
        )}
      </form.Subscribe>

      {romanizedSlot}

      {titleFetch && (
        <p className="text-sm text-muted-foreground">
          Changed from
          {" "}
          <span className="font-mono">{titleFetch.previous}</span>
          {" · "}
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={onUndoTitleFetch}
          >
            Undo
          </Button>
        </p>
      )}

      <TitleFetchFeedback
        isSuccess={fetchTitleIsSuccess}
        isError={fetchTitleIsError}
        errorMessage={fetchTitleErrorMessage}
        fetchedTitle={fetchedTitle}
        isReportingTitle={isReportingTitle}
        onStartReporting={onStartReporting}
        expectedTitle={expectedTitle}
        onExpectedTitleChange={onExpectedTitleChange}
        onCancelReporting={onCancelReporting}
        getFormUrl={() => form.getFieldValue("url")}
        getFormTitle={() => form.getFieldValue("title")}
      />
    </div>
  );
}
