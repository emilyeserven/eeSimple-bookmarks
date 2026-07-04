import type { Book } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { BookOpen, Info, Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { useEntityImage } from "@/hooks/useEntityImage";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

/**
 * A single row in the books listing. The card body links to the book's detail page and the badge
 * counts linked bookmarks. The standard hover Edit + Info buttons still apply.
 */
export function BookListItem({
  book,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: {
  book: Book;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  const {
    showImage, onError,
  } = useEntityImage(book.imageUrl);

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
      icon={(
        <span
          className="
            flex size-8 shrink-0 items-center justify-center overflow-hidden
            rounded-sm bg-muted text-muted-foreground
          "
        >
          {showImage
            ? (
              <img
                src={book.imageUrl ?? undefined}
                alt=""
                className="size-full object-contain"
                onError={onError}
              />
            )
            : <BookOpen className="size-4" />}
        </span>
      )}
      title={book.name}
      subtitle={book.kavitaSeriesName ?? undefined}
      count={book.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/books/$bookSlug/general"
          params={{
            bookSlug: book.slug,
          }}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "book", book.id, book.slug)}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/books/$bookSlug/edit"
            params={{
              bookSlug: book.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "book", book.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {book.name}</span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/books/$bookSlug/general"
            params={{
              bookSlug: book.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "book", book.id, book.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">View {book.name}</span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
