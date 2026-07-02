import { useState } from "react";

import { ArrowRight } from "lucide-react";

import { AddRelationshipTypeModal } from "./AddRelationshipTypeModal";
import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { ListingStatusMessages } from "./ListingStatusMessages";
import { RelationshipTypeCard } from "./RelationshipTypeCard";
import { RelationshipTypeTable } from "./RelationshipTypeTable";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useSetListingPage } from "../hooks/useListingPage";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import {
  useBulkDeleteRelationshipTypes,
  useRelationshipTypes,
} from "../hooks/useRelationshipTypes";
import { useViewMode } from "../lib/bookmarkColumns";
import { useListSelection } from "../lib/useListSelection";

/** Browsable relationship-type listing. Each card opens its detail page; hover to Edit / view Info. */
export function RelationshipTypesListing() {
  const {
    data: allRelationshipTypes, isLoading, error,
  } = useRelationshipTypes();
  const [modalOpen, setModalOpen] = useState(false);
  useRegisterHeaderSearch();
  const viewMode = useViewMode("relationship-types-listing");

  const relationshipTypes = allRelationshipTypes ?? [];
  const {
    rawQuery, hasQuery, filtered,
  } = useHeaderSearchFilter(
    relationshipTypes,
    (rt, query) => rt.name.toLowerCase().includes(query),
  );

  const deletableIds = filtered.filter(rt => !rt.builtIn).map(rt => rt.id);
  const selection = useListSelection("relationship-types-listing", deletableIds);
  useRegisterBulkSelect("relationship-types-listing");
  useSetListingPage("relationship-types-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: "New relationship type",
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

      <ListingStatusMessages
        isLoading={isLoading}
        error={error}
        totalCount={relationshipTypes.length}
        filteredCount={filtered.length}
        rawQuery={rawQuery}
        hasQuery={hasQuery}
        loadingLabel="Loading relationship types…"
        entityPlural="relationship types"
        emptyMessage={(
          <p className="text-muted-foreground">
            No relationship types yet.
          </p>
        )}
      />

      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={["relationship type", "relationship types"]}
      />

      {filtered.length > 0 && viewMode === "table"
        ? (
          <RelationshipTypeTable
            data={filtered}
            selection={selection}
          />
        )
        : null}

      {filtered.length > 0 && viewMode !== "table"
        ? (
          <div className="space-y-2">
            {filtered.map(rt => (
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
        )
        : null}

      <AddRelationshipTypeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
