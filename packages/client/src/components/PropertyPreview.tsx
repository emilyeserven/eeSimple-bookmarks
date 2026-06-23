import type { CustomProperty } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import { TYPE_LABELS } from "../lib/propertyFormat";

import { Badge } from "@/components/ui/badge";
import { RowCard } from "@/components/ui/card";
import { entityLinkTitle } from "@/lib/sidebarModifier";
import { cn } from "@/lib/utils";

interface PropertyPreviewProps {
  property: CustomProperty;
  /** All properties, used to resolve a calculate property's operand names. */
  allProperties: CustomProperty[];
}

/** A compact, clickable preview of one property; links to its full view page. */
export function PropertyPreview({
  property, allProperties,
}: PropertyPreviewProps) {
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  const operandNames = property.operandPropertyIds
    .map(id => allProperties.find(candidate => candidate.id === id)?.name)
    .filter((value): value is string => Boolean(value));

  let summary: string | null = null;
  if (property.type === "number") {
    summary = `${property.numberMin ?? "auto"} – ${property.numberMax ?? "auto"}`
      + (property.unitPlural ? ` ${property.unitPlural}` : "");
  }
  else if (property.type === "calculate" && operandNames.length > 0) {
    summary = `Σ ${operandNames.join(" + ")}`;
  }

  const categoryCount = property.categoryIds.length;
  const isUncategorized = categoryCount === 0 && property.enabled;

  return (
    <RowCard
      className={cn(`
        transition-colors
        hover:bg-accent
      `, isUncategorized && "opacity-60")}
    >
      <Link
        to="/custom-properties/$propertySlug"
        params={{
          propertySlug: property.slug,
        }}
        title={entityLinkTitle(modifier)}
        onClick={event => viewClick(event, "property", property.id, property.slug)}
        className="flex flex-col gap-1 p-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{property.name}</span>
          {isUncategorized && <TriangleAlert className="size-4 text-amber-500" />}
          {property.builtIn && <Badge variant="secondary">Built-in</Badge>}
          {!property.enabled && <Badge variant="outline">Disabled</Badge>}
          <Badge variant="secondary">{TYPE_LABELS[property.type]}</Badge>
          {summary ? <span className="text-xs text-muted-foreground">{summary}</span> : null}
        </div>
        {property.description
          ? <p className="truncate text-sm text-muted-foreground">{property.description}</p>
          : null}
        <p className="text-xs text-muted-foreground">
          {categoryCount === 0
            ? "No categories"
            : `${categoryCount} ${categoryCount === 1 ? "category" : "categories"}`}
        </p>
      </Link>
    </RowCard>
  );
}
