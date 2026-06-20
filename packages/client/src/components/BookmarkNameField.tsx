import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { useBookmarkScanHandlers } from "./useBookmarkScanHandlers";
import type { useFetchMetadata } from "../hooks/useFetchMetadata";
import type { useFetchTitle } from "../hooks/useFetchTitle";

import { Loader2, Sparkles } from "lucide-react";

import { looksLikeYouTube } from "./bookmarkFormSchema";
import { TitleFetchFeedback } from "./BookmarkTitleFeedback";
import { isFetchableUrl } from "../lib/url";

import { Button } from "@/components/ui/button";

type ScanHandlers = ReturnType<typeof useBookmarkScanHandlers>;

interface BookmarkNameFieldProps {
  form: BookmarkFormApi;
  fetchTitle: ReturnType<typeof useFetchTitle>;
  fetchMetadata: ReturnType<typeof useFetchMetadata>;
  /** The last title-fetch result, shown as an "undo" affordance. */
  titleFetch: { previous: string } | null;
  /** Clears the title-fetch undo banner when the user edits the name. */
  onTitleEdited: () => void;
  undoTitleFetch: () => void;
  runFetchTitle: ScanHandlers["runFetchTitle"];
  runYouTubeEnrichment: ScanHandlers["runYouTubeEnrichment"];
  isReportingTitle: boolean;
  setIsReportingTitle: (value: boolean) => void;
  expectedTitle: string;
  setExpectedTitle: (value: string) => void;
  /** Runs the autofill rules when the name field loses focus. */
  onNameBlur: () => void;
}

/**
 * The bookmark form's "Name" field: the title textarea with its fetch-from-URL button, the
 * title-fetch undo banner, and the success/error feedback (incl. incorrect-title reporting).
 * Operates on the shared form instance passed in.
 */
export function BookmarkNameField({
  form,
  fetchTitle,
  fetchMetadata,
  titleFetch,
  onTitleEdited,
  undoTitleFetch,
  runFetchTitle,
  runYouTubeEnrichment,
  isReportingTitle,
  setIsReportingTitle,
  expectedTitle,
  setExpectedTitle,
  onNameBlur,
}: BookmarkNameFieldProps) {
  return (
    <>
      <form.Subscribe selector={state => state.values.url}>
        {url => (
          <form.AppField name="title">
            {field => (
              <field.TextareaField
                label="Name"
                rows={1}
                inputClassName="min-h-9"
                onBlur={onNameBlur}
                onChange={onTitleEdited}
                action={(
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Fetch title from URL"
                    aria-label="Fetch title from URL"
                    disabled={!isFetchableUrl(url) || fetchTitle.isPending || fetchMetadata.isPending}
                    onClick={() => {
                      const yt = looksLikeYouTube(url);
                      if (!yt) {
                        void runFetchTitle(url, {
                          force: true,
                        });
                      }
                      void runYouTubeEnrichment(url, {
                        fillTitle: true,
                        force: true,
                      });
                    }}
                  >
                    {fetchTitle.isPending || fetchMetadata.isPending
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
            onClick={undoTitleFetch}
          >
            Undo
          </Button>
        </p>
      )}

      <TitleFetchFeedback
        isSuccess={fetchTitle.isSuccess}
        isError={fetchTitle.isError}
        errorMessage={fetchTitle.error?.message}
        fetchedTitle={fetchTitle.data?.title}
        isReportingTitle={isReportingTitle}
        onStartReporting={() => setIsReportingTitle(true)}
        expectedTitle={expectedTitle}
        onExpectedTitleChange={setExpectedTitle}
        onCancelReporting={() => {
          setIsReportingTitle(false);
          setExpectedTitle("");
        }}
        getFormUrl={() => form.getFieldValue("url")}
        getFormTitle={() => form.getFieldValue("title")}
      />
    </>
  );
}
