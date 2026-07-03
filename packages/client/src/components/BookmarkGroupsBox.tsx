import type { BookmarkGroup } from "@eesimple/types";

import { Fragment } from "react";

import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";

import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { Badge } from "@/components/ui/badge";
import { entityLinkTitle } from "@/lib/sidebarModifier";

interface GroupsBoxProps {
  groups: BookmarkGroup[];
}

/**
 * A bookmark's group-credit badges — each renders standalone so it flows alongside the card's other
 * pills (category, media type, website, …) in the `card-labels` zone's flex row. Mirrors
 * {@link BookmarkLocationBadges}. This is the multi-valued `bookmark.groups` creator-credit relation,
 * not the singular `bookmark.group` publisher FK.
 */
export function BookmarkGroupBadges({
  groups,
}: GroupsBoxProps) {
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  return (
    <div className="flex flex-wrap items-center gap-1">
      {groups.map(group => (
        <Link
          key={group.id}
          to="/taxonomies/groups/$groupSlug"
          params={{
            groupSlug: group.slug,
          }}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "group", group.id, group.slug)}
        >
          <Badge
            variant="secondary"
            className="inline-flex items-center gap-1"
          >
            <Users className="size-3 shrink-0" />
            {group.name}
          </Badge>
        </Link>
      ))}
    </div>
  );
}

/**
 * Inline, comma-separated group links — the `card-table` zone's value form of a bookmark's groups.
 * Each name links to the group's page like the {@link BookmarkGroupBadges} badges, but laid out as
 * plain inline text to fit the table value column. Mirrors {@link BookmarkTagLinks}.
 */
export function BookmarkGroupLinks({
  groups,
}: GroupsBoxProps) {
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  return (
    <span className="text-sm">
      {groups.map((group, index) => (
        <Fragment key={group.id}>
          {index > 0 ? ", " : null}
          <Link
            to="/taxonomies/groups/$groupSlug"
            params={{
              groupSlug: group.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "group", group.id, group.slug)}
            className="
              text-primary
              hover:underline
            "
          >
            {group.name}
          </Link>
        </Fragment>
      ))}
    </span>
  );
}
