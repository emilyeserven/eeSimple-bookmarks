import type { Author } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil, UserRound } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import { useEntityImage } from "../hooks/useEntityImage";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "../lib/sidebarModifier";

/** A single row in the author listing: name, bookmark count, and hover Edit / Info. */
export function AuthorListItem({
  author,
}: { author: Author }) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  const {
    showImage,
    onError,
  } = useEntityImage(author.imageUrl);

  return (
    <StandardListingCard
      icon={(
        <span
          className="
            flex size-8 shrink-0 items-center justify-center overflow-hidden
            rounded-full bg-muted text-muted-foreground
          "
        >
          {showImage
            ? (
              <img
                src={author.imageUrl ?? undefined}
                alt=""
                className="size-full object-cover"
                onError={onError}
              />
            )
            : <UserRound className="size-4" />}
        </span>
      )}
      title={author.name}
      count={author.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/authors/$authorSlug/general"
          params={{
            authorSlug: author.slug,
          }}
          title={`View ${author.name}`}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/authors/$authorSlug/edit/general"
            params={{
              authorSlug: author.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "author", author.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {author.name}</span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/authors/$authorSlug/general"
            params={{
              authorSlug: author.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "author", author.id, author.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">View {author.name}</span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
