import type { CustomProperty } from "@eesimple/types";

/**
 * Decide whether the Properties filter section shows, and the property-name sub-filter to pass it.
 * When the sidebar search ("filter") doesn't match the "Properties" label, the section still shows if
 * any individual property name matches — and that text becomes the per-property name filter.
 */
export function resolvePropertiesVisibility(args: {
  filter: string;
  propertiesLabelMatch: boolean;
  hasProperties: boolean;
  enabledProperties: CustomProperty[];
}): { showProperties: boolean;
  propertyNameFilter: string | undefined; } {
  const {
    filter, propertiesLabelMatch, hasProperties, enabledProperties,
  } = args;
  const searchingByName = Boolean(filter) && !propertiesLabelMatch;
  const matchingProps = searchingByName
    ? enabledProperties.filter(p => p.name.toLowerCase().includes(filter))
    : enabledProperties;
  return {
    showProperties: hasProperties && (propertiesLabelMatch || matchingProps.length > 0),
    propertyNameFilter: searchingByName ? filter : undefined,
  };
}
