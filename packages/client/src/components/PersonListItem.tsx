import type { Person } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil, UserRound } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import { useEntityImage } from "../hooks/useEntityImage";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "../lib/sidebarModifier";

interface PersonListItemProps {
  person: Person;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}

/** A single row in the person listing: name, bookmark count, and hover Edit / Info. */
export function PersonListItem({
  person,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: PersonListItemProps) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  const {
    showImage,
    onError,
  } = useEntityImage(person.imageUrl);

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
          {showImage
            ? (
              <img
                src={person.imageUrl ?? undefined}
                alt=""
                className="size-full object-cover"
                onError={onError}
              />
            )
            : <UserRound className="size-4" />}
        </span>
      )}
      title={person.name}
      count={person.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/people/$personSlug/general"
          params={{
            personSlug: person.slug,
          }}
          title={`View ${person.name}`}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/people/$personSlug/edit/general"
            params={{
              personSlug: person.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "person", person.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {person.name}</span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/people/$personSlug/general"
            params={{
              personSlug: person.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "person", person.id, person.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">View {person.name}</span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
