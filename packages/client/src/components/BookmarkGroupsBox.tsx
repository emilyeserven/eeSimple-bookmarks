import type { BookmarkGroup } from "@eesimple/types";

import { Fragment } from "react";

import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";

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
  return (
    <div className="flex flex-wrap items-center gap-1">
      {groups.map(group => (
        <Link
          key={group.id}
          to="/taxonomies/groups/$groupSlug"
          params={{
            groupSlug: group.slug,
          }}
          title={group.name}
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
            title={group.name}
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
