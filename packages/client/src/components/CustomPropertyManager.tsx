import type { CustomProperty } from "@eesimple/types";

import { useMemo, useState } from "react";

import { Link } from "@tanstack/react-router";
import { Plus, TriangleAlert } from "lucide-react";

import { useCustomProperties } from "../hooks/useCustomProperties";
import { TYPE_LABELS } from "../lib/propertyFormat";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PropertyPreviewProps {
  property: CustomProperty;
  /** All properties, used to resolve a calculate property's operand names. */
  allProperties: CustomProperty[];
}

/** A compact, clickable preview of one property; links to its full view page. */
function PropertyPreview({
  property, allProperties,
}: PropertyPreviewProps) {
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
    <Card className={cn("p-0", isUncategorized && "opacity-60")}>
      <Link
        to="/settings/custom-properties/$propertySlug"
        params={{
          propertySlug: property.slug,
        }}
        className="
          flex flex-col gap-1 rounded-xl p-4 transition-colors
          hover:bg-accent
        "
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{property.name}</span>
          {isUncategorized && <TriangleAlert className="size-4 text-amber-500" />}
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
    </Card>
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
          <Link to="/settings/custom-properties/new">
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
