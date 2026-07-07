import type { BookmarkPerson } from "@eesimple/types";

import { Fragment } from "react";

import { Link } from "@tanstack/react-router";
import { User } from "lucide-react";

import { Badge } from "@/components/ui/badge";

interface PeopleBoxProps {
  people: BookmarkPerson[];
}

/**
 * A bookmark's people badges — each renders standalone so it flows alongside the card's other pills
 * (category, media type, website, …) in the `card-labels` zone's flex row. Mirrors
 * {@link BookmarkLocationBadges}.
 */
export function BookmarkPeopleBadges({
  people,
}: PeopleBoxProps) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {people.map(person => (
        <Link
          key={person.id}
          to="/taxonomies/people/$personSlug"
          params={{
            personSlug: person.slug,
          }}
          title={person.name}
        >
          <Badge
            variant="secondary"
            className="inline-flex items-center gap-1"
          >
            <User className="size-3 shrink-0" />
            {person.name}
          </Badge>
        </Link>
      ))}
    </div>
  );
}

/**
 * Inline, comma-separated people links — the `card-table` zone's value form of a bookmark's people.
 * Each name links to the person's page like the {@link BookmarkPeopleBadges} badges, but laid out as
 * plain inline text to fit the table value column. Mirrors {@link BookmarkTagLinks}.
 */
export function BookmarkPeopleLinks({
  people,
}: PeopleBoxProps) {
  return (
    <span className="text-sm">
      {people.map((person, index) => (
        <Fragment key={person.id}>
          {index > 0 ? ", " : null}
          <Link
            to="/taxonomies/people/$personSlug"
            params={{
              personSlug: person.slug,
            }}
            title={person.name}
            className="
              text-primary
              hover:underline
            "
          >
            {person.name}
          </Link>
        </Fragment>
      ))}
    </span>
  );
}
