import type { Bookmark, CustomProperty, PropertyGroup } from "@eesimple/types";
import type { ReactNode } from "react";

import { PropertyQuickFilterLink } from "./PropertyQuickFilterLink";
import { StarRating } from "./StarRating";
import { useDefaultFieldZones } from "../lib/bookmarkCardFields";
import { buildBookmarkPropertyRows } from "../lib/bookmarkPropertyRows";

import { LabeledSection } from "@/components/LabeledSection";
import { Separator } from "@/components/ui/separator";

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
  // The per-card boolean display knobs (show-if-false / colon / value-order / clickable) come from the
  // Default card display rule on non-listing surfaces like this one.
  const defaultZones = useDefaultFieldZones();

  const {
    numberRows, ratingRows, booleanRows, dateTimeRows, fileRows, choicesRows,
  } = buildBookmarkPropertyRows(bookmark, properties, defaultZones);

  const hasProperties = numberRows.length > 0 || booleanRows.length > 0
    || dateTimeRows.length > 0 || ratingRows.length > 0 || fileRows.length > 0
    || choicesRows.length > 0;
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
    || fileRows.some(row => inGroup(row.groupId, section.target))
    || choicesRows.some(row => inGroup(row.groupId, section.target)));

  return (
    <>
      {propertySections.map((section, index) => (
        <div key={section.key}>
          {/* The leading divider is owned by the consumer; only separate subsequent groups here. */}
          {index > 0
            ? <Separator className="mb-6" />
            : null}
          <LabeledSection title={section.title}>
            <dl className="space-y-1">
              {numberRows.filter(row => inGroup(row.groupId, section.target)).map(row => (
                <div
                  key={row.id}
                  className="group flex items-baseline gap-2"
                >
                  <dt className="text-muted-foreground">
                    {row.name}
                    {row.isCalculated
                      ? <span className="text-xs"> (calculated)</span>
                      : null}
                    :
                  </dt>
                  <dd>{row.value}</dd>
                  <PropertyQuickFilterLink
                    search={row.search}
                    name={row.name}
                  />
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
                    className="group flex items-baseline gap-2"
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
                    <PropertyQuickFilterLink
                      search={row.search}
                      name={row.name}
                    />
                  </div>
                );
              })}
              {dateTimeRows.filter(row => inGroup(row.groupId, section.target)).map(row => (
                <div
                  key={row.id}
                  className="group flex items-baseline gap-2"
                >
                  <dt className="text-muted-foreground">
                    {row.name}
                    :
                  </dt>
                  <dd>{row.value}</dd>
                  <PropertyQuickFilterLink
                    search={row.search}
                    name={row.name}
                  />
                </div>
              ))}
              {ratingRows.filter(row => inGroup(row.groupId, section.target)).map(row => (
                <div
                  key={row.id}
                  className="group flex items-center gap-2"
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
                  <PropertyQuickFilterLink
                    search={row.search}
                    name={row.name}
                  />
                </div>
              ))}
              {fileRows.filter(row => inGroup(row.groupId, section.target)).map(row => (
                <div
                  key={row.id}
                  className="group flex items-baseline gap-2"
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
                  <PropertyQuickFilterLink
                    search={row.search}
                    name={row.name}
                  />
                </div>
              ))}
              {choicesRows.filter(row => inGroup(row.groupId, section.target)).map((row) => {
                const selectedLabels = row.selectedValues
                  .map(val => row.items.find(item => item.value === val)?.label ?? val);
                return (
                  <div
                    key={row.id}
                    className="group flex items-baseline gap-2"
                  >
                    <dt className="text-muted-foreground">
                      {row.name}
                      :
                    </dt>
                    <dd className="flex flex-wrap gap-1">
                      {selectedLabels.map(label => (
                        <span
                          key={label}
                          className="
                            rounded-sm bg-secondary px-1.5 py-0.5 text-xs
                            text-secondary-foreground
                          "
                        >
                          {label}
                        </span>
                      ))}
                    </dd>
                    <PropertyQuickFilterLink
                      search={row.search}
                      name={row.name}
                    />
                  </div>
                );
              })}
            </dl>
          </LabeledSection>
        </div>
      ))}
    </>
  );
}
