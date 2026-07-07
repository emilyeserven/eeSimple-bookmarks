/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { BookUser } from "lucide-react";

import { useGroups } from "../../../hooks/useGroups";
import i18n from "../../../i18n";
import { groupWorkbench } from "../../workbench/group";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function useGroupList() {
  const {
    data, isLoading, error,
  } = useGroups();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(group => ({
      id: group.id,
      label: group.name,
      sublabel: group.labeledWebsites[0]?.url,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only group view — the same tabbed bodies + shell the main-app group pages render. */
function GroupView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={groupWorkbench}
      id={id}
      mode="view"
      contentType="group"
    />
  );
}

/** Group editor — the same per-tab auto-save form the main-app edit tab renders. */
function GroupEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={groupWorkbench}
      id={id}
      mode="edit"
      contentType="group"
    />
  );
}

export const groupContentType: PanelContentTypeDef = {
  type: "group",
  label: i18n.t("Groups"),
  singular: i18n.t("Group"),
  icon: BookUser,
  useList: useGroupList,
  View: GroupView,
  Edit: GroupEdit,
};
