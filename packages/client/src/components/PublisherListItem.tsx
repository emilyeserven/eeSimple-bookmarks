import type { Publisher } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { BookOpen, Info, Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "../lib/sidebarModifier";

interface PublisherListItemProps {
  publisher: Publisher;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}

/** A single row in the publisher listing: name, website info, bookmark count, and hover Edit / Info. */
export function PublisherListItem({
  publisher,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: PublisherListItemProps) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();

  const websiteLabel = publisher.website
    ? (publisher.website.siteName
      ? `${publisher.website.siteName} (${publisher.website.domain})`
      : publisher.website.domain)
    : undefined;

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
            rounded-full bg-muted text-muted-foreground
          "
        >
          <BookOpen className="size-4" />
        </span>
      )}
      title={publisher.name}
      subtitle={websiteLabel}
      count={publisher.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/publishers/$publisherSlug/general"
          params={{
            publisherSlug: publisher.slug,
          }}
          title={`View ${publisher.name}`}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/publishers/$publisherSlug/edit/general"
            params={{
              publisherSlug: publisher.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "publisher", publisher.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {publisher.name}</span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/publishers/$publisherSlug/general"
            params={{
              publisherSlug: publisher.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "publisher", publisher.id, publisher.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">View {publisher.name}</span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
