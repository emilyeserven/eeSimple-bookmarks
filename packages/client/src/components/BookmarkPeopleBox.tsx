import type { TermDisplayProps } from "./bookmarkCardTermBadges";
import type { BookmarkPerson } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { User } from "lucide-react";

import { TaxonomyBadgeRow, TaxonomyLinkList } from "./bookmarkCardTermBadges";

import { Badge } from "@/components/ui/badge";
import i18n from "@/i18n";

interface PeopleBoxProps extends TermDisplayProps {
  people: BookmarkPerson[];
}

/** The count-form label for a bookmark's people, e.g. "5 people". */
function peopleCountLabel(count: number): string {
  return i18n.t("{{count}} people", {
    count,
  });
}

/**
 * A bookmark's people badges — each renders standalone so it flows alongside the card's other pills
 * (category, media type, website, …) in the `card-labels` zone's flex row. Mirrors
 * {@link BookmarkLocationBadges}. Honors the `maxTerms` / `collapseToCount` term-display knobs.
 */
export function BookmarkPeopleBadges({
  people, maxTerms = null, collapseToCount = false,
}: PeopleBoxProps) {
  return (
    <TaxonomyBadgeRow
      items={people}
      keyOf={person => person.id}
      icon={User}
      countLabel={peopleCountLabel}
      maxTerms={maxTerms}
      collapseToCount={collapseToCount}
      renderBadge={person => (
        <Link
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
      )}
    />
  );
}

/**
 * Inline, comma-separated people links — the `card-table` zone's value form of a bookmark's people.
 * Each name links to the person's page like the {@link BookmarkPeopleBadges} badges, but laid out as
 * plain inline text to fit the table value column. Mirrors {@link BookmarkTagLinks}.
 */
export function BookmarkPeopleLinks({
  people, maxTerms = null, collapseToCount = false,
}: PeopleBoxProps) {
  return (
    <TaxonomyLinkList
      items={people}
      keyOf={person => person.id}
      countLabel={peopleCountLabel}
      maxTerms={maxTerms}
      collapseToCount={collapseToCount}
      renderLink={person => (
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
      )}
    />
  );
}
