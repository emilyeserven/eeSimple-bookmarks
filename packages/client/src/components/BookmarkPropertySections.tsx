import type { Bookmark, CustomProperty, PropertyGroup } from "@eesimple/types";
import type { ReactNode } from "react";

import { StarRating } from "./StarRating";

import { LabeledSection } from "@/components/LabeledSection";
import { Separator } from "@/components/ui/separator";
import { formatBoolean, formatDateTime, formatNumber } from "@/lib/bookmarkFormat";

interface BookmarkPropertySectionsProps {
  bookmark: Bookmark;
  /** Custom property definitions, used to label and unit-format the bookmark's values. */
  properties: CustomProperty[];
  /** Property groups, used to group property values under their group headings. */
  propertyGroups: PropertyGroup[];
  /** When provided, boolean properties with `clickableInView` enabled render as toggles. */
  onSaveBoolean?: (propertyId: string, value: boolean) => void;
}

/**
 * The custom-property value rows of a bookmark, partitioned by property group. Groups with rows
 * render first (ordered by priority then name) under their own heading; everything ungrouped (or
 * whose group is unknown) falls into a trailing "Properties" section. Renders nothing when the
 * bookmark has no resolvable property values.
 */
export function BookmarkPropertySections({
  bookmark, properties, propertyGroups, onSaveBoolean,
}: BookmarkPropertySectionsProps) {
  const byId = new Map(properties.map(property => [property.id, property]));

  const numberRows = bookmark.numberValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      // Rating scales live in numberValues but render as stars below, not a formatted number.
      return property && property.type !== "ratingScale"
        ? {
          id: entry.propertyId,
          name: property.name,
          groupId: property.propertyGroupId,
          isCalculated: property.type === "calculate",
          value: formatNumber(entry.value, property),
        }
        : null;
    })
    .filter((row): row is { id: string;
      name: string;
      groupId: string | null;
      isCalculated: boolean;
      value: string; } => row !== null);

  const ratingRows = bookmark.numberValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      return property && property.type === "ratingScale"
        ? {
          id: entry.propertyId,
          name: property.name,
          groupId: property.propertyGroupId,
          value: entry.value,
          max: (property.ratingMax ?? 5) as number,
          allowHalf: property.ratingAllowHalf,
          label: property.ratingShowLabel ? (property.ratingLabel ?? undefined) : undefined,
        }
        : null;
    })
    .filter((row): row is { id: string;
      name: string;
      groupId: string | null;
      value: number;
      max: number;
      allowHalf: boolean;
      label: string | undefined; } => row !== null);

  const booleanRows = bookmark.booleanValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      if (!property) return null;
      if (!entry.value && !property.showIfFalse) return null;
      const isIconPreset = property.booleanLabelPreset === "icons" || property.booleanLabelPreset === "stars";
      return {
        id: entry.propertyId,
        name: property.name,
        groupId: property.propertyGroupId,
        rawValue: entry.value,
        value: formatBoolean(entry.value, property),
        showLabelColon: isIconPreset ? property.showLabelColon : true,
        showValueBeforeLabel: isIconPreset ? property.showValueBeforeLabel : false,
        clickableInView: property.clickableInView,
      };
    })
    .filter((row): row is { id: string;
      name: string;
      groupId: string | null;
      rawValue: boolean;
      value: string;
      showLabelColon: boolean;
      showValueBeforeLabel: boolean;
      clickableInView: boolean; } => row !== null);

  const dateTimeRows = bookmark.dateTimeValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      return property
        ? {
          id: entry.propertyId,
          name: property.name,
          groupId: property.propertyGroupId,
          value: formatDateTime(entry.value, property),
        }
        : null;
    })
    .filter((row): row is { id: string;
      name: string;
      groupId: string | null;
      value: string; } => row !== null);

  const fileRows = bookmark.fileValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      // Only image/file properties opted into the detail view via `showInDetails` render here.
      return property && property.showInDetails
        ? {
          id: entry.propertyId,
          name: property.name,
          groupId: property.propertyGroupId,
          isImage: property.type === "image",
          url: entry.url,
          filename: entry.originalFilename,
        }
        : null;
    })
    .filter((row): row is { id: string;
      name: string;
      groupId: string | null;
      isImage: boolean;
      url: string;
      filename: string | null; } => row !== null);

  const hasProperties = numberRows.length > 0 || booleanRows.length > 0
    || dateTimeRows.length > 0 || ratingRows.length > 0 || fileRows.length > 0;
  if (!hasProperties) return null;

  // Partition the property rows by group. A row belongs to the ungrouped bucket when its `groupId`
  // is null or doesn't resolve to a known group.
  const knownGroupIds = new Set(propertyGroups.map(group => group.id));
  const inGroup = (groupId: string | null, target: string | null): boolean =>
    target === null
      ? groupId === null || !knownGroupIds.has(groupId)
      : groupId === target;
  const sortedGroups = [...propertyGroups]
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
  const propertySections = [
    ...sortedGroups.map(group => ({
      key: group.id,
      title: group.name,
      target: group.id as string | null,
    })),
    {
      key: "__ungrouped__",
      title: "Properties",
      target: null as string | null,
    },
  ].filter(section =>
    numberRows.some(row => inGroup(row.groupId, section.target))
    || booleanRows.some(row => inGroup(row.groupId, section.target))
    || dateTimeRows.some(row => inGroup(row.groupId, section.target))
    || ratingRows.some(row => inGroup(row.groupId, section.target))
    || fileRows.some(row => inGroup(row.groupId, section.target)));

  return (
    <>
      {propertySections.map(section => (
        <div key={section.key}>
          <Separator className="mb-6" />
          <LabeledSection title={section.title}>
            <dl className="space-y-1">
              {numberRows.filter(row => inGroup(row.groupId, section.target)).map(row => (
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
              {booleanRows.filter(row => inGroup(row.groupId, section.target)).map((row) => {
                const isClickable = onSaveBoolean !== undefined && row.clickableInView;
                // When clickable, both the label and the value toggle the boolean.
                const toggle = isClickable
                  ? () => onSaveBoolean(row.id, !row.rawValue)
                  : undefined;
                const wrap = (content: ReactNode): ReactNode =>
                  toggle
                    ? (
                      <button
                        className="
                          cursor-pointer
                          hover:underline
                        "
                        title="Click to toggle"
                        type="button"
                        onClick={toggle}
                      >
                        {content}
                      </button>
                    )
                    : content;
                return (
                  <div
                    key={row.id}
                    className="flex items-baseline gap-2"
                  >
                    {row.showValueBeforeLabel
                      ? (
                        <>
                          <dd>{wrap(row.value)}</dd>
                          <dt className="text-muted-foreground">
                            {wrap(row.showLabelColon ? `: ${row.name}` : row.name)}
                          </dt>
                        </>
                      )
                      : (
                        <>
                          <dt className="text-muted-foreground">
                            {wrap(
                              <>
                                {row.name}
                                {row.showLabelColon ? ":" : ""}
                              </>,
                            )}
                          </dt>
                          <dd>{wrap(row.value)}</dd>
                        </>
                      )}
                  </div>
                );
              })}
              {dateTimeRows.filter(row => inGroup(row.groupId, section.target)).map(row => (
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
              {ratingRows.filter(row => inGroup(row.groupId, section.target)).map(row => (
                <div
                  key={row.id}
                  className="flex items-center gap-2"
                >
                  <dt className="text-muted-foreground">
                    {row.name}
                    :
                  </dt>
                  <dd>
                    <StarRating
                      value={row.value}
                      max={row.max}
                      allowHalf={row.allowHalf}
                      readOnly
                      label={row.label}
                      size={16}
                    />
                  </dd>
                </div>
              ))}
              {fileRows.filter(row => inGroup(row.groupId, section.target)).map(row => (
                <div
                  key={row.id}
                  className="flex items-baseline gap-2"
                >
                  <dt className="text-muted-foreground">
                    {row.name}
                    :
                  </dt>
                  <dd>
                    {row.isImage
                      ? (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={row.url}
                            alt={row.name}
                            className="max-h-40 rounded-md border"
                          />
                        </a>
                      )
                      : (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline underline-offset-2"
                        >
                          {row.filename ?? "Download"}
                        </a>
                      )}
                  </dd>
                </div>
              ))}
            </dl>
          </LabeledSection>
        </div>
      ))}
    </>
  );
}
