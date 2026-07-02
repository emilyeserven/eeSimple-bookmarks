/**
 * Embedded-outline (bookmark tree) extraction for PDFs, backing the Kavita table-of-contents
 * import. Kavita's own ToC endpoint is EPUB-only — for PDFs the middleware downloads the raw file
 * and reads the outline here with pdf.js. Outline-only use: no worker file, no canvas, and the
 * ~5 MB pdfjs module is loaded lazily so middleware cold-start is unaffected.
 */

import type { KavitaTocEntry } from "@eesimple/types";

/** The subset of pdf.js' `PDFDocumentProxy` needed to resolve outline destinations (stubbed in tests). */
export interface OutlineDocLike {
  getDestination: (id: string) => Promise<unknown[] | null>;
  getPageIndex: (ref: object) => Promise<number>;
}

/** The subset of a pdf.js outline node this module reads (stubbed in tests). */
export interface OutlineItemLike {
  title: string;
  dest: string | unknown[] | null;
  items?: OutlineItemLike[];
}

/**
 * Resolve one outline destination to a 1-based page number, or `null` when it can't be resolved.
 * A dest is either a named destination (string → `getDestination`) or an explicit array whose
 * first element is a page reference object (→ `getPageIndex`, 0-based) or, from some producers,
 * a plain 0-based page number.
 */
async function resolveDestPage(doc: OutlineDocLike, dest: string | unknown[] | null): Promise<number | null> {
  try {
    const explicit = typeof dest === "string" ? await doc.getDestination(dest) : dest;
    if (!Array.isArray(explicit) || explicit.length === 0) return null;
    const target = explicit[0];
    if (typeof target === "number" && Number.isInteger(target) && target >= 0) return target + 1;
    if (typeof target === "object" && target !== null) {
      return (await doc.getPageIndex(target)) + 1;
    }
    return null;
  }
  catch {
    return null;
  }
}

/**
 * Flatten a pdf.js outline to `KavitaTocEntry[]`: the top two levels in document order (deeper
 * levels dropped), each resolved to its 1-based start page. Entries whose destination can't be
 * resolved (or with an empty title) are skipped rather than failing the whole ToC. Sequential
 * resolution keeps document order and bounds concurrent work.
 */
export async function outlineToTocEntries(
  doc: OutlineDocLike,
  outline: OutlineItemLike[],
): Promise<KavitaTocEntry[]> {
  const entries: KavitaTocEntry[] = [];
  const twoLevels = outline.flatMap(item => [item, ...(item.items ?? [])]);
  for (const item of twoLevels) {
    const title = typeof item.title === "string" ? item.title.trim() : "";
    if (!title) continue;
    const page = await resolveDestPage(doc, item.dest);
    if (page === null) continue;
    entries.push({
      title,
      page,
    });
  }
  return entries;
}

/**
 * Extract the embedded outline from PDF bytes. Returns `[]` when the PDF simply has no outline,
 * and `null` when the file can't be read at all (encrypted, corrupt). Never throws.
 */
export async function extractPdfToc(data: Uint8Array): Promise<KavitaTocEntry[] | null> {
  try {
    const {
      getDocument,
    } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    // No workerSrc configured: in Node, pdf.js falls back to its in-process "fake worker",
    // which is all outline-only extraction needs.
    const task = getDocument({
      data,
      disableFontFace: true,
      verbosity: 0,
    });
    const doc = await task.promise;
    try {
      const outline = await doc.getOutline();
      if (!outline) return [];
      // Adapt the real proxy to the stub-friendly interface (pdf.js types its page refs narrowly).
      const docLike: OutlineDocLike = {
        getDestination: id => doc.getDestination(id),
        getPageIndex: ref => doc.getPageIndex(ref as Parameters<typeof doc.getPageIndex>[0]),
      };
      return await outlineToTocEntries(docLike, outline as OutlineItemLike[]);
    }
    finally {
      await task.destroy();
    }
  }
  catch {
    return null;
  }
}
