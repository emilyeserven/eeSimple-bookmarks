import { useState } from "react";

import { ArrowRight } from "lucide-react";

import { AddRelationshipTypeModal } from "./AddRelationshipTypeModal";
import { ListingScaffold } from "./ListingScaffold";

import { relationshipTypeListingConfig } from "@/entities/relationshipType";
import { useSetListingPage } from "@/hooks/useListingPage";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable relationship-type listing. Each card opens its detail page; hover to Edit / view Info. */
export function RelationshipTypesListing() {
  const [modalOpen, setModalOpen] = useState(false);
  useSetListingPage("relationship-types-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: "New relationship type",
  });
  const state = useListingScaffold(relationshipTypeListingConfig);

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-1 text-sm text-muted-foreground">
        Directional types
        {" ("}
        <ArrowRight className="inline size-3" />
        ) read as parent → child and power the Hierarchy view; symmetric types read the same
        {" from either bookmark."}
      </p>

      <ListingScaffold
        config={relationshipTypeListingConfig}
        state={state}
      />

      <AddRelationshipTypeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
