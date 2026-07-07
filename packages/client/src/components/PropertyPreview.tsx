import type { CustomProperty, CustomPropertyType } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useDisplayPreferenceSettings } from "../hooks/useAppSettings";
import { TYPE_LABELS, resolvePropertyTypeIcon } from "../lib/propertyFormat";
import { propertyPreviewSummary } from "../lib/propertyPreview";

import { Badge } from "@/components/ui/badge";
import { RowCard } from "@/components/ui/card";
import { CategoryIcon } from "@/lib/icons";
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
  const {
    t,
  } = useTranslation();
  const categoryCount = property.categoryIds.length;
  const isAllCategories = property.allCategories || categoryCount === 0;
  const mediaTypeCount = property.mediaTypeIds.length;
  const isAllMediaTypes = property.allMediaTypes || mediaTypeCount === 0;

  return (
    <div className="flex items-start gap-3">
      <CategoryIcon
        name={resolvePropertyTypeIcon(property.type, typeIcons)}
        className="mt-0.5 size-5 shrink-0 text-muted-foreground"
      />
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{property.name}</span>
          {property.builtIn && <Badge variant="secondary">{t("Built-in")}</Badge>}
          {!property.enabled && <Badge variant="outline">{t("Disabled")}</Badge>}
          <Badge variant="secondary">{TYPE_LABELS[property.type]}</Badge>
          {summary ? <span className="text-xs text-muted-foreground">{summary}</span> : null}
        </div>
        {property.description
          ? <p className="truncate text-sm text-muted-foreground">{property.description}</p>
          : null}
        <div
          className="
            flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground
          "
        >
          <span>
            {isAllCategories
              ? t("All categories")
              : (categoryCount === 1
                ? t("{{count}} category", {
                  count: categoryCount,
                })
                : t("{{count}} categories", {
                  count: categoryCount,
                }))}
          </span>
          <span>
            {isAllMediaTypes
              ? t("All media types")
              : (mediaTypeCount === 1
                ? t("{{count}} media type", {
                  count: mediaTypeCount,
                })
                : t("{{count}} media types", {
                  count: mediaTypeCount,
                }))}
          </span>
        </div>
      </div>
    </div>
  );
}

/** A compact, clickable preview of one property; links to its full view page. */
export function PropertyPreview({
  property, allProperties, selectable = false, selected = false, onSelectToggle,
  inSelectionMode = false,
}: PropertyPreviewProps) {
  const {
    t,
  } = useTranslation();
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
            aria-label={selected
              ? t("Deselect {{name}}", {
                name: property.name,
              })
              : t("Select {{name}}", {
                name: property.name,
              })}
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
            title={t("View {{name}}", {
              name: property.name,
            })}
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
