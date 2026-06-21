import type { BookmarkFormApi } from "./bookmarkFormSchema";

import { Loader2, Sparkles } from "lucide-react";

import { TitleFetchFeedback } from "./BookmarkTitleFeedback";
import { isFetchableUrl } from "../lib/url";

import { Button } from "@/components/ui/button";

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
}

/** Right column: the Name field with its fetch-title button, undo line, and fetch feedback. */
export function RevealedNameField({
  form,
  onTitleBlur,
  onTitleChange,
  onFetchTitleClick,
  isFetchTitlePending,
  isFetchMetadataPending,
  titleFetch,
  onUndoTitleFetch,
  fetchTitleIsSuccess,
  fetchTitleIsError,
  fetchTitleErrorMessage,
  fetchedTitle,
  isReportingTitle,
  onStartReporting,
  expectedTitle,
  onExpectedTitleChange,
  onCancelReporting,
}: RevealedNameFieldProps) {
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
