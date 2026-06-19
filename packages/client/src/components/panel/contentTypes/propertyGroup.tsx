/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Layers } from "lucide-react";

import { WithPanelItem } from "./status";
import { usePropertyGroups } from "../../../hooks/usePropertyGroups";
import { PropertyGroupCard } from "../../PropertyGroupCard";
import { PropertyGroupRow } from "../../PropertyGroupRow";

function usePropertyGroupList() {
  const {
    data, isLoading, error,
  } = usePropertyGroups();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(group => ({
      id: group.id,
      label: group.name,
      sublabel: group.propertyCount != null ? `${group.propertyCount} properties` : undefined,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only property-group view, reusing the same `PropertyGroupCard` the view page renders. */
function PropertyGroupView({
  id,
}: {
  id: string;
}) {
  const query = usePropertyGroups();
  return (
    <WithPanelItem
      queryResult={query}
      id={id}
      notFoundMessage="Property group not found."
    >
      {group => <PropertyGroupCard group={group} />}
    </WithPanelItem>
  );
}

/** Inline property-group editor, reusing the same `PropertyGroupRow` the settings and edit pages use. */
function PropertyGroupEdit({
  id,
}: {
  id: string;
}) {
  const query = usePropertyGroups();
  return (
    <WithPanelItem
      queryResult={query}
      id={id}
      notFoundMessage="Property group not found."
    >
      {group => <PropertyGroupRow group={group} />}
    </WithPanelItem>
  );
}

export const propertyGroupContentType: PanelContentTypeDef = {
  type: "property-group",
  label: "Property Groups",
  singular: "Property Group",
  icon: Layers,
  useList: usePropertyGroupList,
  View: PropertyGroupView,
  Edit: PropertyGroupEdit,
};
