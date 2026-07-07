import type { DraftEntityName } from "./entityNames/draftEntityName";
import type { Book, KavitaSeriesResult } from "@eesimple/types";

import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { useCreateBook } from "../hooks/useBooks";
import { useCreateEntityNames } from "../hooks/useEntityNames";
import { useFetchIsbnMetadata } from "../hooks/useFetchIsbnMetadata";
import i18n from "../i18n";
import { entriesFromDrafts } from "./entityNames/draftEntityName";
import { useMediaProperties } from "../hooks/useMediaProperties";
import { describeError } from "../lib/apiError";
import { notifyError } from "../lib/notifications";

import { booksApi } from "@/lib/api/taxonomies";

/** The Kavita linkage a lookup fills in; held together so the "linked" chip and payload stay in sync. */
export interface KavitaLink {
  kavitaSeriesId: number | null;
  kavitaLibraryId: number | null;
  kavitaSeriesName: string | null;
  releaseYear: number | null;
}

export const EMPTY_KAVITA: KavitaLink = {
  kavitaSeriesId: null,
  kavitaLibraryId: null,
  kavitaSeriesName: null,
  releaseYear: null,
};

export interface BookFormProps {
  /** Called with the created book (e.g. to select it in the opener, or navigate to its edit page). */
  onCreated?: (book: Book) => void;
}

/**
 * The full controller for `BookForm`: owns every piece of state, the create/lookup mutations, and
 * the applyCandidate/handleIsbnLookup/handleSubmit handlers. `BookForm` itself is then just the JSX
 * wiring — this keeps the component's own hook-density (previously 14 hooks) out of its complexity
 * score, mirroring `useBookmarkFormController`.
 */
export function useBookFormController({
  onCreated,
}: BookFormProps) {
  const createBook = useCreateBook();
  const createNames = useCreateEntityNames();
  const {
    data: mediaProperties,
  } = useMediaProperties();
  const isbnFetch = useFetchIsbnMetadata();
  const importIsbnCover = useMutation({
    mutationFn: (bookId: string) => booksApi.images.autoFetch(bookId, "isbn-cover"),
  });

  const [name, setName] = useState("");
  const [nameDrafts, setNameDrafts] = useState<DraftEntityName[]>([]);
  const [mediaPropertyId, setMediaPropertyId] = useState<string>("");
  const [kavita, setKavita] = useState<KavitaLink>(EMPTY_KAVITA);
  const [addMediaPropertyOpen, setAddMediaPropertyOpen] = useState(false);
  const [isbnInput, setIsbnInput] = useState("");
  const [isbnReleaseYear, setIsbnReleaseYear] = useState<number | null>(null);
  const [isbnCoverAvailable, setIsbnCoverAvailable] = useState(false);

  function applyCandidate(series: KavitaSeriesResult) {
    // Fill the name only when empty, so a deliberate title isn't overwritten by a search pick.
    setName(current => current.trim() || series.name);
    setKavita({
      kavitaSeriesId: series.seriesId,
      kavitaLibraryId: series.libraryId,
      kavitaSeriesName: series.name,
      releaseYear: series.releaseYear,
    });
  }

  async function handleIsbnLookup(explicitIsbn?: string): Promise<void> {
    const trimmed = (explicitIsbn ?? isbnInput).trim();
    if (!trimmed) return;
    if (explicitIsbn) setIsbnInput(explicitIsbn);
    let result;
    try {
      result = await isbnFetch.mutateAsync({
        isbn: trimmed,
      });
    }
    catch (err) {
      notifyError(describeError(err, i18n.t("Could not fetch book metadata")));
      return;
    }
    // Fill the name only when empty, so a deliberate title isn't overwritten by the lookup.
    const title = result.title;
    if (title) setName(current => current.trim() || title);
    if (result.year) {
      const parsedYear = parseInt(result.year, 10);
      if (!Number.isNaN(parsedYear)) setIsbnReleaseYear(parsedYear);
    }
    setIsbnCoverAvailable(Boolean(result.coverUrl));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    createBook.mutate(
      {
        name: trimmed,
        mediaPropertyId: mediaPropertyId || null,
        isbn: isbnInput.trim() || null,
        ...kavita,
        releaseYear: kavita.releaseYear ?? isbnReleaseYear,
      },
      {
        onSuccess: (book) => {
          if (isbnCoverAvailable) importIsbnCover.mutate(book.id);
          const entries = entriesFromDrafts(nameDrafts);
          if (entries.length > 0) {
            createNames.mutate({
              ownerType: "book",
              ownerId: book.id,
              entries,
            });
          }
          onCreated?.(book);
        },
      },
    );
  }

  return {
    createBook,
    mediaProperties,
    isbnFetch,
    name,
    setName,
    nameDrafts,
    setNameDrafts,
    mediaPropertyId,
    setMediaPropertyId,
    kavita,
    setKavita,
    addMediaPropertyOpen,
    setAddMediaPropertyOpen,
    isbnInput,
    setIsbnInput,
    applyCandidate,
    handleIsbnLookup,
    handleSubmit,
  };
}
