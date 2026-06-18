import type { CustomProperty } from "@eesimple/types";

import { useMemo, useState } from "react";

import { Link } from "@tanstack/react-router";
import { Plus, TriangleAlert } from "lucide-react";

import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { TYPE_LABELS } from "../lib/propertyFormat";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";

interface PropertyPreviewProps {
  property: CustomProperty;
  /** All properties, used to resolve a calculate property's operand names. */
  allProperties: CustomProperty[];
}

/** A compact, clickable preview of one property; links to its full view page. */
function PropertyPreview({
  property, allProperties,
}: PropertyPreviewProps) {
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
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
    <RowCard className={cn(isUncategorized && "opacity-60")}>
      <Link
        to="/custom-properties/$propertySlug"
        params={{
          propertySlug: property.slug,
        }}
        title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
        onClick={event => viewClick(event, "property", property.id)}
        className="
          flex flex-col gap-1 rounded-lg p-4 transition-colors
          hover:bg-accent
        "
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

/** Searchable listing of custom properties, with previews that link out to the view/create pages. */
export function CustomPropertyManager() {
  const {
    data: properties, isLoading, error,
  } = useCustomProperties();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const all = properties ?? [];
    if (!needle) return all;
    return all.filter(property =>
      property.name.toLowerCase().includes(needle)
      || TYPE_LABELS[property.type].toLowerCase().includes(needle));
  }, [properties, query]);

  return (
    <section className="space-y-4">
      <div
        className="
          flex flex-col gap-2
          sm:flex-row sm:items-center
        "
      >
        <Input
          type="search"
          placeholder="Search custom properties…"
          value={query}
          onChange={event => setQuery(event.target.value)}
          className="sm:flex-1"
        />
        <Button asChild>
          <Link to="/custom-properties/new">
            <Plus className="size-4" />
            New property
          </Link>
        </Button>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading custom properties…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && !error && filtered.length === 0
        ? (
          <p className="text-muted-foreground">
            {query
              ? "No custom properties match your search."
              : "No custom properties yet. Create one to get started."}
          </p>
        )
        : null}

      <div className="space-y-3">
        {filtered.map(property => (
          <PropertyPreview
            key={property.id}
            property={property}
            allProperties={properties ?? []}
          />
        ))}
      </div>
    </section>
  );
}
