import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Taxonomy } from "@eesimple/types";

import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FacetPresenceToggle } from "./FilterFacetControls";
import { TaxonomyFilterBody } from "./TaxonomyFilterBody";
import { useUserTaxonomies } from "../hooks/useUserTaxonomies";
import { withTaxonomyTermPresence } from "../lib/bookmarkSearch";
import { Separator } from "./ui/separator";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

/** One user-created taxonomy's collapsible filter section: presence toggle in the header, picker below. */
function SingleTaxonomyFilterSection({
  taxonomy, search, onSearchChange,
}: {
  taxonomy: Taxonomy;
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();

  return (
    <Collapsible
      defaultOpen
      className="group/taxonomy space-y-3"
    >
      <div className="flex items-center justify-between">
        <CollapsibleTrigger
          className="
            flex items-center gap-1.5 text-sm font-semibold
            hover:text-foreground
          "
        >
          <ChevronDown
            className="
              size-3.5 shrink-0 transition-transform
              group-data-[state=open]/taxonomy:rotate-180
            "
          />
          {taxonomy.name}
        </CollapsibleTrigger>
        <FacetPresenceToggle
          value={search.taxonomyTermPresence?.[taxonomy.id]}
          onChange={mode => onSearchChange(withTaxonomyTermPresence(search, taxonomy.id, mode))}
          hasLabel={t("Has any")}
          missingLabel={t("Has none")}
        />
      </div>
      <CollapsibleContent className="space-y-3">
        <TaxonomyFilterBody
          taxonomy={taxonomy}
          search={search}
          onSearchChange={onSearchChange}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * One collapsible filter section per user-created taxonomy. Like `LanguageUsageFilterSection`, this
 * is a **self-managed** facet family rather than a `FILTER_FACETS` registry entry: the taxonomy set
 * is user-defined and dynamic, so it can't be a literal `FilterFacetKey` — it follows the custom
 * property model instead, keyed by taxonomy id (see `taxonomyHasActiveSelection`).
 *
 * Self-fetching and self-separating: it owns the leading `<Separator />` and returns `null` when it
 * has nothing to show, so `FilterSections` can render it unconditionally without gating on data it
 * would otherwise have to fetch itself. `nameFilter` applies the sidebar's section search box to
 * taxonomy names, mirroring how the Properties section filters by property name.
 */
export function TaxonomyFilterSections({
  search, onSearchChange, nameFilter,
}: {
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
  nameFilter?: string;
}) {
  const taxonomies = useUserTaxonomies();
  const needle = (nameFilter ?? "").toLowerCase().trim();
  const shown = needle
    ? taxonomies.filter(taxonomy => taxonomy.name.toLowerCase().includes(needle))
    : taxonomies;

  if (shown.length === 0) return null;

  return (
    <>
      <Separator />
      <div className="space-y-6">
        {shown.map(taxonomy => (
          <SingleTaxonomyFilterSection
            key={taxonomy.id}
            taxonomy={taxonomy}
            search={search}
            onSearchChange={onSearchChange}
          />
        ))}
      </div>
    </>
  );
}
