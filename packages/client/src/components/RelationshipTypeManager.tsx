import { ArrowRight } from "lucide-react";

import { AddRelationshipTypeRow } from "./AddRelationshipTypeRow";
import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { RelationshipTypeCard } from "./RelationshipTypeCard";
import { useSetListingPage } from "../hooks/useListingPage";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import {
  useBulkDeleteRelationshipTypes,
  useRelationshipTypes,
} from "../hooks/useRelationshipTypes";
import { useListSelection } from "../lib/useListSelection";

/** Browsable relationship-type listing. Each card opens its detail page; hover to Edit / view Info. */
export function RelationshipTypesListing() {
  const {
    data: relationshipTypes, isLoading, error,
  } = useRelationshipTypes();
  const deletableIds = (relationshipTypes ?? []).filter(rt => !rt.builtIn).map(rt => rt.id);
  const selection = useListSelection("relationship-types-listing", deletableIds);
  useRegisterBulkSelect("relationship-types-listing");
  useSetListingPage("relationship-types-listing", false, false, false, undefined, false, {
    addBookmark: {},
  });
  const bulkDelete = useBulkDeleteRelationshipTypes();

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-1 text-sm text-muted-foreground">
        Directional types
        {" ("}
        <ArrowRight className="inline size-3" />
        ) read as parent → child and power the Hierarchy view; symmetric types read the same
        {" from either bookmark."}
      </p>

      {isLoading ? <p className="text-muted-foreground">Loading relationship types…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}

      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={["relationship type", "relationship types"]}
      />

      <div className="space-y-2">
        {(relationshipTypes ?? []).map(rt => (
          <RelationshipTypeCard
            key={rt.id}
            relationshipType={rt}
            selectable={!rt.builtIn}
            selected={selection.isSelected(rt.id)}
            onSelectToggle={() => selection.toggle(rt.id)}
            inSelectionMode={selection.mode}
          />
        ))}
      </div>

      <AddRelationshipTypeRow />
    </div>
  );
}
