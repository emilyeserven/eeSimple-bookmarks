import type { Book } from "@eesimple/types";

import { BookImage, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { TaxonomyImageGallery } from "./TaxonomyImageGallery";
import { useConnectors } from "../hooks/useConnectors";
import { useTaxonomyImages } from "../hooks/useTaxonomyImages";
import { booksApi } from "../lib/api/taxonomies";

/**
 * Image tab body for the Books taxonomy: a multi-image gallery with two auto-fetch actions — "Use
 * Kavita cover" (gated on the Kavita connector + a linked series) and "Pull cover from ISBN" (gated
 * on the book having a stored ISBN). Mirrors `PlexTaxonomyImageTab`, the Plex-backed sibling.
 */
export function BookImageTab({
  book,
  readOnly = false,
}: {
  book: Book;
  readOnly?: boolean;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: connectors,
  } = useConnectors();
  const gallery = useTaxonomyImages(booksApi.images, book.id, ["book-images", book.id]);

  return (
    <TaxonomyImageGallery
      images={gallery.images}
      isLoading={gallery.isLoading}
      readOnly={readOnly}
      autoFetchActions={[
        {
          source: "kavita-cover",
          label: t("Use Kavita cover"),
          icon: BookOpen,
          enabled: Boolean(connectors?.kavita.enabled) && book.kavitaSeriesId !== null,
        },
        {
          source: "isbn-cover",
          label: t("Pull cover from ISBN"),
          icon: BookImage,
          enabled: Boolean(book.isbn?.trim()),
        },
      ]}
      pendingAutoFetchSource={gallery.autoFetch.isPending ? gallery.autoFetch.variables : null}
      onUpload={file => gallery.upload.mutate(file)}
      uploadPending={gallery.upload.isPending}
      onAutoFetch={source => gallery.autoFetch.mutate(source)}
      onSetMain={imageId => gallery.setMain.mutate(imageId)}
      setMainPending={gallery.setMain.isPending}
      onRemove={imageId => gallery.remove.mutate(imageId)}
      removePending={gallery.remove.isPending}
    />
  );
}
