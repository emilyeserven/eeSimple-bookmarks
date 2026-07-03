/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { UserRound } from "lucide-react";

import { usePeople } from "../../../hooks/usePeople";
import { personWorkbench } from "../../workbench/person";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function usePersonList() {
  const {
    data, isLoading, error,
  } = usePeople();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(person => ({
      id: person.id,
      label: person.name,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only person view — the same tabbed bodies + shell the main-app person pages render. */
function PersonView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={personWorkbench}
      id={id}
      mode="view"
      contentType="person"
    />
  );
}

/** Person editor — the same per-tab auto-save form the main-app edit tab renders. */
function PersonEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={personWorkbench}
      id={id}
      mode="edit"
      contentType="person"
    />
  );
}

export const personContentType: PanelContentTypeDef = {
  type: "person",
  label: "People",
  singular: "Person",
  icon: UserRound,
  useList: usePersonList,
  View: PersonView,
  Edit: PersonEdit,
};
