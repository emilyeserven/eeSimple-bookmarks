/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Link2 } from "lucide-react";

import { WithPanelItem } from "./status";
import {
  useDeleteRelationshipType,
  useRelationshipTypes,
} from "../../../hooks/useRelationshipTypes";
import { RelationshipTypeDetail } from "../../RelationshipTypeDetail";
import { RelationshipTypeGeneralForm } from "../../RelationshipTypeGeneralForm";
import { PanelEntityEditor } from "../PanelEntityEditor";
import { usePanelDismissAfterDelete } from "../usePanelDismissAfterDelete";

function useRelationshipTypeList() {
  const {
    data, isLoading, error,
  } = useRelationshipTypes();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(relationshipType => ({
      id: relationshipType.id,
      label: relationshipType.name,
      sublabel: relationshipType.directional ? "Directional" : "Symmetric",
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only relationship-type view, reusing the same `RelationshipTypeDetail` the view page renders. */
function RelationshipTypeView({
  id,
}: {
  id: string;
}) {
  const query = useRelationshipTypes();
  return (
    <WithPanelItem
      queryResult={query}
      id={id}
      notFoundMessage="Relationship type not found."
    >
      {relationshipType => (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{relationshipType.name}</h2>
          <RelationshipTypeDetail relationshipType={relationshipType} />
        </div>
      )}
    </WithPanelItem>
  );
}

/** Relationship-type editor, reusing the same auto-save `RelationshipTypeGeneralForm` the edit tab renders. */
function RelationshipTypeEdit({
  id,
}: {
  id: string;
}) {
  const query = useRelationshipTypes();
  const deleteRelationshipType = useDeleteRelationshipType();
  const dismiss = usePanelDismissAfterDelete();
  return (
    <WithPanelItem
      queryResult={query}
      id={id}
      notFoundMessage="Relationship type not found."
    >
      {relationshipType => (
        <PanelEntityEditor
          name={relationshipType.name}
          builtIn={relationshipType.builtIn}
          onDelete={relationshipType.builtIn
            ? undefined
            : () => deleteRelationshipType.mutate(relationshipType.id, {
              onSuccess: dismiss,
            })}
          deleteIsPending={deleteRelationshipType.isPending}
          deleteError={deleteRelationshipType.isError ? deleteRelationshipType.error.message : null}
        >
          <RelationshipTypeGeneralForm relationshipType={relationshipType} />
        </PanelEntityEditor>
      )}
    </WithPanelItem>
  );
}

export const relationshipTypeContentType: PanelContentTypeDef = {
  type: "relationship-type",
  label: "Relationship Types",
  singular: "Relationship Type",
  icon: Link2,
  useList: useRelationshipTypeList,
  View: RelationshipTypeView,
  Edit: RelationshipTypeEdit,
};
