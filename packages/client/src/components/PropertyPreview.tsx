import type { CustomProperty, CustomPropertyType } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useDisplayPreferenceSettings, useSidebarOpenModifier } from "../hooks/useAppSettings";
import { TYPE_LABELS, resolvePropertyTypeIcon } from "../lib/propertyFormat";
import { propertyPreviewSummary } from "../lib/propertyPreview";

import { Badge } from "@/components/ui/badge";
import { RowCard } from "@/components/ui/card";
import { CategoryIcon } from "@/lib/icons";
import { entityLinkTitle } from "@/lib/sidebarModifier";
import { cn } from "@/lib/utils";

interface PropertyPreviewProps {
  property: CustomProperty;
  /** All properties, used to resolve a calculate property's operand names. */
  allProperties: CustomProperty[];
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  /** When true, clicking the card toggles selection instead of navigating. Gate on the listing's selection mode. */
  inSelectionMode?: boolean;
}

/** The shared inner content of a property preview card, rendered inside either the link or select button. */
function PropertyPreviewBody({
  property,
  summary,
  typeIcons,
}: {
  property: CustomProperty;
  summary: string | null;
  typeIcons: Partial<Record<CustomPropertyType, string>> | null;
}) {
  const categoryCount = property.categoryIds.length;
  const isAllCategories = property.allCategories || categoryCount === 0;

  return (
    <div className="flex items-start gap-3">
      <CategoryIcon
        name={resolvePropertyTypeIcon(property.type, typeIcons)}
        className="mt-0.5 size-5 shrink-0 text-muted-foreground"
      />
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{property.name}</span>
          {property.builtIn && <Badge variant="secondary">Built-in</Badge>}
          {!property.enabled && <Badge variant="outline">Disabled</Badge>}
          <Badge variant="secondary">{TYPE_LABELS[property.type]}</Badge>
          {summary ? <span className="text-xs text-muted-foreground">{summary}</span> : null}
        </div>
        {property.description
          ? <p className="truncate text-sm text-muted-foreground">{property.description}</p>
          : null}
        <p className="text-xs text-muted-foreground">
          {isAllCategories
            ? "All categories"
            : `${categoryCount} ${categoryCount === 1 ? "category" : "categories"}`}
        </p>
      </div>
    </div>
  );
}

/** A compact, clickable preview of one property; links to its full view page. */
export function PropertyPreview({
  property, allProperties, selectable = false, selected = false, onSelectToggle,
  inSelectionMode = false,
}: PropertyPreviewProps) {
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  const {
    data: displayPrefs,
  } = useDisplayPreferenceSettings();
  const typeIcons = displayPrefs?.customPropertyTypeIcons ?? null;
  const summary = propertyPreviewSummary(property, allProperties);

  return (
    <RowCard
      className={cn(`
        group relative transition-colors
        hover:bg-accent
      `, selected && "ring-2 ring-primary")}
    >
      {(inSelectionMode && selectable)
        ? (
          <button
            type="button"
            aria-label={selected ? `Deselect ${property.name}` : `Select ${property.name}`}
            onClick={() => onSelectToggle?.()}
            className="flex flex-col gap-1 p-4 text-left"
          >
            <PropertyPreviewBody
              property={property}
              summary={summary}
              typeIcons={typeIcons}
            />
          </button>
        )
        : (
          <Link
            to="/custom-properties/$propertySlug"
            params={{
              propertySlug: property.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "property", property.id, property.slug)}
            className="flex flex-col gap-1 p-4"
          >
            <PropertyPreviewBody
              property={property}
              summary={summary}
              typeIcons={typeIcons}
            />
          </Link>
        )}
    </RowCard>
  );
}
