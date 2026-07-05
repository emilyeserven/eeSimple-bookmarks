/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { Book } from "@eesimple/types";

import i18n from "../../i18n";
import { BookGeneralForm } from "../BookGeneralForm";
import { BookImageTab } from "../BookImageTab";
import { EntityNamesTabView } from "../entityNames/EntityNamesTab";

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
    >{i18n.t("Not linked")}
    </span>
  );
  const name = book.kavitaSeriesName ?? i18n.t("Series #{{seriesId}}", {
    seriesId: book.kavitaSeriesId,
  });
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
        <dt className="text-muted-foreground">{i18n.t("Added")}</dt>
        <dd>{new Date(book.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">{i18n.t("Slug")}</dt>
        <dd className="font-mono">{book.slug}</dd>
        <dt className="text-muted-foreground">{i18n.t("Names")}</dt>
        <dd>
          <EntityNamesTabView
            ownerType="book"
            ownerId={book.id}
          />
        </dd>
        <dt className="text-muted-foreground">{i18n.t("Media property")}</dt>
        <dd>
          {mediaProperty?.name ?? <span className="text-muted-foreground">{i18n.t("None")}</span>}
        </dd>
        {book.releaseYear != null
          ? (
            <>
              <dt className="text-muted-foreground">{i18n.t("Release year")}</dt>
              <dd>{book.releaseYear}</dd>
            </>
          )
          : null}
        <dt className="text-muted-foreground">{i18n.t("Kavita series")}</dt>
        <dd>
          <KavitaSeriesValue book={book} />
        </dd>
        <dt className="text-muted-foreground">{i18n.t("Sort order")}</dt>
        <dd>{book.sortOrder}</dd>
        {book.bookmarkCount != null
          ? (
            <>
              <dt className="text-muted-foreground">{i18n.t("Bookmarks")}</dt>
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
  notFound: i18n.t("Book not found."),
  navAriaLabel: i18n.t("Book sections"),
  listingPath: "/taxonomies/books",
  getSlug: book => book.slug,
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      view: {
        title: i18n.t("General"),
        description: i18n.t("Media property, Kavita link, release year, and metadata."),
        render: BookGeneralView,
      },
      edit: {
        title: i18n.t("General"),
        description: i18n.t("Name, media property, Kavita link, and release year."),
        render: ({
          entity,
        }) => <BookGeneralForm book={entity} />,
      },
    },
    {
      key: "image",
      label: i18n.t("Image"),
      view: {
        title: i18n.t("Image"),
        description: i18n.t("The book's cover image."),
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
        title: i18n.t("Image"),
        description: i18n.t("Upload a cover, or pull it from Kavita or the book's ISBN."),
        render: ({
          entity,
        }) => <BookImageTab book={entity} />,
      },
    },
  ],
};
