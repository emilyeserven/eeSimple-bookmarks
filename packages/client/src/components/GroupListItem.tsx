import type { Group } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { BookOpen, Info, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const {
    t,
  } = useTranslation();
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
          to="/taxonomies/groups/$groupSlug"
          params={{
            groupSlug: group.slug,
          }}
          title={t("View {{name}}", {
            name: group.name,
          })}
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
            title={t("Edit (hold {{modifier}} to open in the sidebar)", {
              modifier: SIDEBAR_MODIFIER_LABELS[modifier],
            })}
            onClick={event => editClick(event, "group", group.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">{t("Edit {{name}}", {
              name: group.name,
            })}
            </span>
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
            <span className="sr-only">{t("View {{name}}", {
              name: group.name,
            })}
            </span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
