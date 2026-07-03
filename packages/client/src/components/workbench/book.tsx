/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { Book } from "@eesimple/types";

import { BookGeneralForm } from "../BookGeneralForm";
import { BookImageTab } from "../BookImageTab";

import { useBookBySlug, useBooks, useDeleteBook } from "@/hooks/useBooks";
import { useConnectors } from "@/hooks/useConnectors";
import { useMediaProperties } from "@/hooks/useMediaProperties";
import { kavitaSeriesUrl } from "@/lib/kavita";

/** The linked Kavita series name, deep-linked into Kavita's web UI when the connector is enabled. */
function KavitaSeriesValue({
  book,
}: {
  book: Book;
}) {
  const {
    data: connectors,
  } = useConnectors();
  if (book.kavitaSeriesId === null) return (
    <span
      className="text-muted-foreground"
    >Not linked
    </span>
  );
  const name = book.kavitaSeriesName ?? `Series #${book.kavitaSeriesId}`;
  const baseUrl = connectors?.kavita.enabled ? connectors.kavita.baseUrl : null;
  if (!baseUrl || book.kavitaLibraryId === null) return <span>{name}</span>;
  return (
    <a
      href={kavitaSeriesUrl(baseUrl, book.kavitaLibraryId, book.kavitaSeriesId)}
      target="_blank"
      rel="noreferrer"
      className="hover:underline"
    >
      {name}
    </a>
  );
}

function BookGeneralView({
  entity: book,
}: {
  entity: Book;
}) {
  const {
    data: mediaProperties,
  } = useMediaProperties();
  const mediaProperty = book.mediaPropertyId
    ? (mediaProperties ?? []).find(prop => prop.id === book.mediaPropertyId)
    : undefined;

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Added</dt>
        <dd>{new Date(book.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd className="font-mono">{book.slug}</dd>
        <dt className="text-muted-foreground">Media property</dt>
        <dd>{mediaProperty?.name ?? <span className="text-muted-foreground">None</span>}</dd>
        {book.releaseYear != null
          ? (
            <>
              <dt className="text-muted-foreground">Release year</dt>
              <dd>{book.releaseYear}</dd>
            </>
          )
          : null}
        <dt className="text-muted-foreground">Kavita series</dt>
        <dd>
          <KavitaSeriesValue book={book} />
        </dd>
        <dt className="text-muted-foreground">Sort order</dt>
        <dd>{book.sortOrder}</dd>
        {book.bookmarkCount != null
          ? (
            <>
              <dt className="text-muted-foreground">Bookmarks</dt>
              <dd>{book.bookmarkCount}</dd>
            </>
          )
          : null}
      </dl>
    </div>
  );
}

/** Single source of truth for a book's view/edit UI (main pane routes + right panel). */
export const bookWorkbench: EntityWorkbench<Book> = {
  useBySlug: (slug) => {
    const {
      book, isLoading,
    } = useBookBySlug(slug);
    return {
      entity: book,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useBooks();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: book => book.name,
  useDelete: () => {
    const mutation = useDeleteBook();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Book not found.",
  navAriaLabel: "Book sections",
  getSlug: book => book.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Media property, Kavita link, release year, and metadata.",
        render: BookGeneralView,
      },
      edit: {
        title: "General",
        description: "Name, media property, Kavita link, and release year.",
        render: ({
          entity,
        }) => <BookGeneralForm book={entity} />,
      },
    },
    {
      key: "image",
      label: "Image",
      view: {
        title: "Image",
        description: "The book's cover image.",
        render: ({
          entity,
        }) => (
          <BookImageTab
            book={entity}
            readOnly
          />
        ),
      },
      edit: {
        title: "Image",
        description: "Upload a cover, or pull it from Kavita or the book's ISBN.",
        render: ({
          entity,
        }) => <BookImageTab book={entity} />,
      },
    },
  ],
};
