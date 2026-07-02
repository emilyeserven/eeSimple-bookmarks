import type { Bookmark, SectionEntry } from "@eesimple/types";

import { useMutation } from "@tanstack/react-query";

import { useConnectors } from "../hooks/useConnectors";
import { kavitaApi } from "../lib/api/kavita";
import { describeError } from "../lib/apiError";
import { kavitaTocToSections } from "../lib/kavita";
import { notifyError, notifySuccess } from "../lib/notifications";

interface UseKavitaSectionsImportParams {
  bookmark: Bookmark;
  /** Replaces the sections editor's local value for the property — the Properties tab's `handleSectionsChange`. */
  onApply: (propertyId: string, value: { exhaustive: boolean;
    sections: SectionEntry[]; }) => void;
}

/**
 * "Import from Kavita" sub-hook for the Page Sections editor: fetches the linked series' table of
 * contents through the middleware proxy and replaces the editor's local sections (review-then-save
 * — nothing persists until the tab's Save changes). Extracted from `useBookmarkPropertiesForm` so
 * its hook count stays within the fallow cap, mirroring `useBookmarkIsbn`.
 */
export function useKavitaSectionsImport({
  bookmark,
  onApply,
}: UseKavitaSectionsImportParams) {
  const {
    data: connectors,
  } = useConnectors();
  const tocFetch = useMutation({
    mutationFn: (seriesId: number) => kavitaApi.getToc(seriesId),
  });

  const canImportSections = Boolean(connectors?.kavita.enabled) && bookmark.kavitaSeriesId !== null;

  async function handleSectionsImport(propertyId: string): Promise<void> {
    if (bookmark.kavitaSeriesId === null) return;
    try {
      const toc = await tocFetch.mutateAsync(bookmark.kavitaSeriesId);
      const sections = kavitaTocToSections(toc);
      if (sections.length === 0) {
        notifyError("This book has no table of contents in Kavita");
        return;
      }
      // A full ToC covers the whole book; the user can untick Exhaustive before saving.
      onApply(propertyId, {
        exhaustive: true,
        sections,
      });
      notifySuccess(`Imported ${sections.length} sections from Kavita — review and save`);
    }
    catch (err) {
      notifyError(describeError(err, "Could not import the table of contents from Kavita"));
    }
  }

  return {
    canImportSections,
    handleSectionsImport,
    isSectionsImportPending: tocFetch.isPending,
  };
}
