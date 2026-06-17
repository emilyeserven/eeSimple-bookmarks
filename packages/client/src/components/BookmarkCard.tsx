import type { Bookmark, CustomProperty } from "@eesimple/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BookmarkCardProps {
  bookmark: Bookmark;
  /** Custom property definitions, used to label and unit-format the bookmark's values. */
  properties?: CustomProperty[];
  onDelete?: (id: string) => void;
}

/** Format a numeric value with its property's unit, pluralizing on a value of 1. */
function formatNumber(value: number, property: CustomProperty): string {
  if (!property.unitSingular && !property.unitPlural) return String(value);
  const unit = value === 1
    ? (property.unitSingular ?? property.unitPlural)
    : (property.unitPlural ?? property.unitSingular);
  return unit ? `${value} ${unit}` : String(value);
}

export function BookmarkCard({
  bookmark, properties = [], onDelete,
}: BookmarkCardProps) {
  const byId = new Map(properties.map(property => [property.id, property]));

  const numberBadges = bookmark.numberValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      return property
        ? {
          id: entry.propertyId,
          label: `${property.name}: ${formatNumber(entry.value, property)}`,
        }
        : null;
    })
    .filter((badge): badge is { id: string;
      label: string; } => badge !== null);

  const booleanBadges = bookmark.booleanValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      return property
        ? {
          id: entry.propertyId,
          label: `${property.name}: ${entry.value ? "Yes" : "No"}`,
        }
        : null;
    })
    .filter((badge): badge is { id: string;
      label: string; } => badge !== null);

  const valueBadges = [...numberBadges, ...booleanBadges];

  return (
    <Card className="gap-0 py-4">
      <CardContent className="px-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-semibold">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noreferrer"
                className="
                  truncate text-primary
                  hover:underline
                "
              >
                {bookmark.title}
              </a>
            </h3>
            <p className="truncate text-sm text-muted-foreground">{bookmark.url}</p>
          </div>
          {onDelete
            ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(bookmark.id)}
                className="
                  text-destructive
                  hover:text-destructive
                "
              >
                Delete
              </Button>
            )
            : null}
        </div>
        {bookmark.description ? <p className="mt-2 text-sm text-foreground">{bookmark.description}</p> : null}
        {bookmark.tags.length > 0
          ? (
            <ul className="mt-2 flex flex-wrap gap-1">
              {bookmark.tags.map(tag => (
                <li key={tag.id}>
                  <Badge variant="secondary">{tag.name}</Badge>
                </li>
              ))}
            </ul>
          )
          : null}
        {valueBadges.length > 0
          ? (
            <ul className="mt-2 flex flex-wrap gap-1">
              {valueBadges.map(badge => (
                <li key={badge.id}>
                  <Badge variant="outline">{badge.label}</Badge>
                </li>
              ))}
            </ul>
          )
          : null}
      </CardContent>
    </Card>
  );
}
