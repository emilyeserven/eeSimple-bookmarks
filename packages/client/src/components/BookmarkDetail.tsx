import type { Bookmark, Category, CustomProperty } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { formatDateTime, formatNumber } from "../lib/bookmarkFormat";

import { DetailField } from "@/components/DetailField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/lib/icons";

interface BookmarkDetailProps {
  bookmark: Bookmark;
  /** All categories, used to resolve the bookmark's category name/icon/slug. */
  categories?: Category[];
  /** Custom property definitions, used to label and unit-format the bookmark's values. */
  properties?: CustomProperty[];
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * The full view of a single bookmark, showing every field including each custom-property value.
 * Shared by the bookmark detail page and the right panel's bookmark view so the two stay identical.
 * Presentational: pass `categories`/`properties` for labels and `onEdit`/`onDelete` for actions.
 */
export function BookmarkDetail({
  bookmark, categories = [], properties = [], onEdit, onDelete,
}: BookmarkDetailProps) {
  const category = categories.find(item => item.id === bookmark.categoryId);
  const byId = new Map(properties.map(property => [property.id, property]));

  const numberRows = bookmark.numberValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      return property
        ? {
          id: entry.propertyId,
          name: property.name,
          isCalculated: property.type === "calculate",
          value: formatNumber(entry.value, property),
        }
        : null;
    })
    .filter((row): row is { id: string;
      name: string;
      isCalculated: boolean;
      value: string; } => row !== null);

  const booleanRows = bookmark.booleanValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      return property
        ? {
          id: entry.propertyId,
          name: property.name,
          value: entry.value ? "Yes" : "No",
        }
        : null;
    })
    .filter((row): row is { id: string;
      name: string;
      value: string; } => row !== null);

  const dateTimeRows = bookmark.dateTimeValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      return property
        ? {
          id: entry.propertyId,
          name: property.name,
          value: formatDateTime(entry.value, property),
        }
        : null;
    })
    .filter((row): row is { id: string;
      name: string;
      value: string; } => row !== null);

  const hasProperties = numberRows.length > 0 || booleanRows.length > 0 || dateTimeRows.length > 0;

  return (
    <div className="@container space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-bold">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noreferrer"
              className="
                text-primary
                hover:underline
              "
            >
              {bookmark.title}
            </a>
          </h1>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noreferrer"
            className="
              block truncate text-sm text-muted-foreground
              hover:underline
            "
          >
            {bookmark.url}
          </a>
        </div>
        {onEdit || onDelete
          ? (
            <div className="flex shrink-0 items-center gap-1">
              {onEdit
                ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                  >
                    Edit
                  </Button>
                )
                : null}
              {onDelete
                ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
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
          )
          : null}
      </div>

      <div
        className="
          flex flex-col gap-6
          @2xl:flex-row @2xl:items-start
        "
      >
        {bookmark.image
          ? (
            <img
              src={bookmark.image.url}
              alt=""
              loading="lazy"
              className="
                max-h-72 w-full rounded-md border object-contain
                @2xl:w-72 @2xl:shrink-0
              "
            />
          )
          : null}

        <dl className="min-w-0 flex-1 space-y-3">
          <DetailField label="Description">
            {bookmark.description
              ? <p className="whitespace-pre-wrap">{bookmark.description}</p>
              : null}
          </DetailField>

          <DetailField label="Category">
            {category
              ? (
                <Link
                  to="/categories/$categorySlug"
                  params={{
                    categorySlug: category.slug,
                  }}
                  className="
                    inline-flex items-center gap-1.5 text-primary
                    hover:underline
                  "
                >
                  <CategoryIcon
                    name={category.icon}
                    className="size-4 shrink-0"
                  />
                  {category.name}
                </Link>
              )
              : null}
          </DetailField>

          <DetailField label="Website">
            {bookmark.website
              ? `${bookmark.website.siteName} (${bookmark.website.domain})`
              : null}
          </DetailField>

          <DetailField label="Media type">
            {bookmark.mediaType ? bookmark.mediaType.name : null}
          </DetailField>

          <DetailField label="Channel">
            {bookmark.youtubeChannel ? bookmark.youtubeChannel.name : null}
          </DetailField>

          <DetailField label="Tags">
            {bookmark.tags.length > 0
              ? (
                <ul className="flex flex-wrap gap-1">
                  {bookmark.tags.map(tag => (
                    <li key={tag.id}>
                      <Badge variant="secondary">{tag.name}</Badge>
                    </li>
                  ))}
                </ul>
              )
              : null}
          </DetailField>

          <DetailField label="Properties">
            {hasProperties
              ? (
                <dl className="space-y-1">
                  {numberRows.map(row => (
                    <div
                      key={row.id}
                      className="flex items-baseline gap-2"
                    >
                      <dt className="text-muted-foreground">
                        {row.name}
                        {row.isCalculated
                          ? <span className="text-xs"> (calculated)</span>
                          : null}
                        :
                      </dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                  {booleanRows.map(row => (
                    <div
                      key={row.id}
                      className="flex items-baseline gap-2"
                    >
                      <dt className="text-muted-foreground">
                        {row.name}
                        :
                      </dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                  {dateTimeRows.map(row => (
                    <div
                      key={row.id}
                      className="flex items-baseline gap-2"
                    >
                      <dt className="text-muted-foreground">
                        {row.name}
                        :
                      </dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )
              : null}
          </DetailField>

          <DetailField label="Priority">
            <span>{bookmark.priority}</span>
          </DetailField>

          <DetailField label="Created">
            <span>{new Date(bookmark.createdAt).toLocaleString()}</span>
          </DetailField>
        </dl>
      </div>
    </div>
  );
}
