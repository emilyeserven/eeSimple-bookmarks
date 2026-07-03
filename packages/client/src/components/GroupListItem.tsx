import type { Group } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { BookOpen, Info, Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "../lib/sidebarModifier";

interface GroupListItemProps {
  group: Group;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}

/** A single row in the group listing: name, website info, bookmark count, and hover Edit / Info. */
export function GroupListItem({
  group,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: GroupListItemProps) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();

  const websiteLabel = group.website
    ? (group.website.siteName
      ? `${group.website.siteName} (${group.website.domain})`
      : group.website.domain)
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
      title={group.name}
      subtitle={websiteLabel}
      count={group.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/groups/$groupSlug/general"
          params={{
            groupSlug: group.slug,
          }}
          title={`View ${group.name}`}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/groups/$groupSlug/edit/general"
            params={{
              groupSlug: group.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "group", group.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {group.name}</span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/groups/$groupSlug/general"
            params={{
              groupSlug: group.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "group", group.id, group.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">View {group.name}</span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
