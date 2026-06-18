import { useMemo, useState } from "react";

import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { PropertyPreview } from "./PropertyPreview";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { TYPE_LABELS } from "../lib/propertyFormat";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
