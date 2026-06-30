import type { LocationLookupCandidate } from "@eesimple/types";

import { useState } from "react";

import { ChevronDown, Globe, Search } from "lucide-react";

import { RomanizedLabel } from "./RomanizedLabel";
import { useLocationLookup } from "../hooks/useLocations";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LocationLookupBoxProps {
  /** Called with a chosen candidate so the caller can prefill its fields. */
  onSelect: (candidate: LocationLookupCandidate) => void;
}

/**
 * A search box that resolves a free-text place query to candidate locations via the keyless geocoder
 * (`/api/locations/lookup`). Selecting a result hands it to `onSelect` to prefill the create form's
 * name / coordinates / map URL / country / place type.
 */
export function LocationLookupBox({
  onSelect,
}: LocationLookupBoxProps) {
  const [query, setQuery] = useState("");
  const lookup = useLocationLookup();
  const results = lookup.data?.results ?? [];
  const searchDisabled = lookup.isPending || query.trim().length === 0;

  function runLookup(source?: "wikidata") {
    const trimmed = query.trim();
    if (trimmed.length === 0) return;
    lookup.mutate({
      query: trimmed,
      source,
    });
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="location-lookup">Look up location</Label>
      <div className="flex items-center gap-2">
        <Input
          id="location-lookup"
          placeholder="Search for a place…"
          value={query}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              runLookup();
            }
          }}
          className="flex-1"
        />
        <div className="flex">
          <Button
            type="button"
            variant="outline"
            className="rounded-r-none"
            disabled={searchDisabled}
            onClick={() => runLookup()}
          >
            <Search className="mr-2 size-4" />
            {lookup.isPending ? "Searching…" : "Search"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="-ml-px rounded-l-none"
                disabled={lookup.isPending}
                aria-label="More search options"
              >
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={query.trim().length === 0}
                onClick={() => runLookup("wikidata")}
              >
                <Globe className="size-4" />
                Search Wikidata instead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {lookup.isError
        ? <p className="text-xs text-destructive">{lookup.error.message}</p>
        : null}
      {!lookup.isPending && lookup.isSuccess && results.length === 0
        ? <p className="text-xs text-muted-foreground">No matches found.</p>
        : null}
      {results.length > 0
        ? (
          <ul className="space-y-1 rounded-md border p-1">
            {results.map((candidate, index) => (
              <li key={`${candidate.name}-${index}`}>
                <button
                  type="button"
                  className="
                    w-full rounded-sm px-2 py-1 text-left text-sm
                    hover:bg-accent hover:text-accent-foreground
                  "
                  title={`${candidate.name}${candidate.romanizedName ? ` (${candidate.romanizedName})` : ""} — ${candidate.displayName}`}
                  onClick={() => onSelect(candidate)}
                >
                  <span className="flex flex-col font-medium">
                    <RomanizedLabel
                      name={candidate.name}
                      romanized={candidate.romanizedName}
                      stacked
                    />
                    <span className="text-xs font-normal text-muted-foreground">
                      {candidate.displayName}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )
        : null}
    </div>
  );
}
