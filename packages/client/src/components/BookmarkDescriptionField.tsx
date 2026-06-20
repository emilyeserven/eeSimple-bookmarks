import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { useBookmarkScanHandlers } from "./useBookmarkScanHandlers";
import type { useFetchMetadata } from "../hooks/useFetchMetadata";

import { Loader2, Sparkles } from "lucide-react";

import { isFetchableUrl } from "../lib/url";

import { Button } from "@/components/ui/button";

type ScanHandlers = ReturnType<typeof useBookmarkScanHandlers>;

interface BookmarkDescriptionFieldProps {
  form: BookmarkFormApi;
  fetchMetadata: ReturnType<typeof useFetchMetadata>;
  runFetchDescription: ScanHandlers["runFetchDescription"];
}

/**
 * The bookmark form's "Description" field with its fetch-from-URL button. Operates on the shared
 * form instance passed in.
 */
export function BookmarkDescriptionField({
  form,
  fetchMetadata,
  runFetchDescription,
}: BookmarkDescriptionFieldProps) {
  return (
    <form.Subscribe selector={state => state.values.url}>
      {url => (
        <form.AppField name="description">
          {field => (
            <field.TextareaField
              label="Description"
              action={(
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Fetch description from URL"
                  aria-label="Fetch description from URL"
                  disabled={!isFetchableUrl(url) || fetchMetadata.isPending}
                  onClick={() => void runFetchDescription(url, {
                    force: true,
                  })}
                >
                  {fetchMetadata.isPending
                    ? <Loader2 className="size-4 animate-spin" />
                    : <Sparkles className="size-4" />}
                </Button>
              )}
            />
          )}
        </form.AppField>
      )}
    </form.Subscribe>
  );
}
