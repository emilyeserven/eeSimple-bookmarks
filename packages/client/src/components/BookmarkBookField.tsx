import type { Bookmark } from "@eesimple/types";

import { BookmarkKavitaDetailLink } from "./BookmarkKavitaField";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useBooks } from "../hooks/useBooks";

import { Combobox } from "@/components/Combobox";
import { Label } from "@/components/ui/label";

interface BookmarkBookFieldProps {
  bookmark: Bookmark;
  /** Persists the selection (`bookId`, or `null` to unlink) — the controller's immediate-save handler. */
  onSelect: (bookId: string | null) => void;
}

/**
 * Link a bookmark to a Book from the Books taxonomy. Replaces the old direct Kavita series picker:
 * book selection now flows through the Books taxonomy, and a book carries the Kavita linkage that
 * powers cover / table-of-contents / deep-link features. Inline "Create book" opens the full
 * book-create dialog (with its own Kavita lookup). A bookmark still carrying a legacy direct Kavita
 * link (no book) shows that link read-only below, so old links stay reachable.
 */
export function BookmarkBookField({
  bookmark,
  onSelect,
}: BookmarkBookFieldProps) {
  const {
    data: books,
  } = useBooks();
  const bookCreate = useEntityCreateOption("book", book => onSelect(book.id));

  const showLegacyKavita = bookmark.bookId === null && bookmark.kavitaSeriesId !== null;

  return (
    <div className="space-y-1.5">
      <Label htmlFor="bookmark-book">Book</Label>
      <Combobox
        id="bookmark-book"
        aria-label="Book"
        options={(books ?? []).map(book => ({
          value: book.id,
          label: book.name,
        }))}
        value={bookmark.bookId ?? undefined}
        onValueChange={value => onSelect(value ?? null)}
        placeholder="No book"
        searchPlaceholder="Search books…"
        emptyText="No books found."
        createOption={bookCreate.createOption}
      />
      {bookCreate.modal}
      {showLegacyKavita
        ? (
          <p className="text-xs text-muted-foreground">
            Legacy Kavita link:
            {" "}
            <BookmarkKavitaDetailLink bookmark={bookmark} />
          </p>
        )
        : null}
    </div>
  );
}
