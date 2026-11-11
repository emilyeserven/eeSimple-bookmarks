import type {
  MymindImportCard,
  MymindImportCardResult,
  MymindImportInput,
  MymindImportOptions,
  MymindImportResult,
} from "@eesimple/types";

/** Client-only option: whether URL-less cards (images, notes, highlights) become link-less bookmarks. */
export interface MymindImportFormOptions extends MymindImportOptions {
  includeUrlless: boolean;
}

export const DEFAULT_MYMIND_IMPORT_OPTIONS: MymindImportFormOptions = {
  includeUrlless: true,
  nestPrefixedTags: true,
  applyAutofill: true,
  keepCreatedDate: true,
  matchMediaTypes: true,
  categoryId: null,
};

/** Cards per request: small enough for smooth progress and short requests, well under the server cap. */
export const MYMIND_CLIENT_BATCH_SIZE = 20;

export interface MymindImportSummary {
  results: MymindImportCardResult[];
  createdTagCount: number;
  created: number;
  duplicates: number;
  failed: number;
}

/**
 * Post the cards to `POST /api/imports/mymind` in sequential batches, reporting progress after each.
 * A batch whose request fails marks its cards as failed (with the error) and the run continues, so
 * one bad batch never loses the rest of the import.
 */
export async function runMymindImport(
  cards: MymindImportCard[],
  options: MymindImportOptions,
  send: (input: MymindImportInput) => Promise<MymindImportResult>,
  onProgress?: (done: number, total: number) => void,
  batchSize = MYMIND_CLIENT_BATCH_SIZE,
): Promise<MymindImportSummary> {
  const results: MymindImportCardResult[] = [];
  let createdTagCount = 0;
  for (let start = 0; start < cards.length; start += batchSize) {
    const batch = cards.slice(start, start + batchSize);
    try {
      const response = await send({
        cards: batch,
        options,
      });
      results.push(...response.results);
      createdTagCount += response.createdTagCount;
    }
    catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      results.push(...batch.map(card => ({
        title: card.title,
        url: card.url,
        outcome: "failed" as const,
        bookmarkId: null,
        error,
      })));
    }
    onProgress?.(results.length, cards.length);
  }
  return {
    results,
    createdTagCount,
    created: results.filter(result => result.outcome === "created").length,
    duplicates: results.filter(result => result.outcome === "duplicate").length,
    failed: results.filter(result => result.outcome === "failed").length,
  };
}
