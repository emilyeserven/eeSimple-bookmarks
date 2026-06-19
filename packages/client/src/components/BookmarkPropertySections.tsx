import type { Bookmark, CustomProperty, PropertyGroup } from "@eesimple/types";

import { LabeledSection } from "@/components/LabeledSection";
import { Separator } from "@/components/ui/separator";
import { formatBoolean, formatDateTime, formatNumber } from "@/lib/bookmarkFormat";

interface BookmarkPropertySectionsProps {
  bookmark: Bookmark;
  /** Custom property definitions, used to label and unit-format the bookmark's values. */
  properties: CustomProperty[];
  /** Property groups, used to group property values under their group headings. */
  propertyGroups: PropertyGroup[];
}

/**
 * The custom-property value rows of a bookmark, partitioned by property group. Groups with rows
 * render first (ordered by priority then name) under their own heading; everything ungrouped (or
 * whose group is unknown) falls into a trailing "Properties" section. Renders nothing when the
 * bookmark has no resolvable property values.
 */
export function BookmarkPropertySections({
  bookmark, properties, propertyGroups,
}: BookmarkPropertySectionsProps) {
  const byId = new Map(properties.map(property => [property.id, property]));

  const numberRows = bookmark.numberValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      return property
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

  const booleanRows = bookmark.booleanValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      if (!property) return null;
      if (!entry.value && !property.showIfFalse) return null;
      return {
        id: entry.propertyId,
        name: property.name,
        groupId: property.propertyGroupId,
        value: formatBoolean(entry.value, property),
      };
    })
    .filter((row): row is { id: string;
      name: string;
      groupId: string | null;
      value: string; } => row !== null);

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

  const hasProperties = numberRows.length > 0 || booleanRows.length > 0 || dateTimeRows.length > 0;
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
    || dateTimeRows.some(row => inGroup(row.groupId, section.target)));

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
              {booleanRows.filter(row => inGroup(row.groupId, section.target)).map(row => (
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
            </dl>
          </LabeledSection>
        </div>
      ))}
    </>
  );
}
