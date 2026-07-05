/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Library } from "lucide-react";

import { useGroupTypes } from "../../../hooks/useGroupTypes";
import i18n from "../../../i18n";
import { groupTypeWorkbench } from "../../workbench/groupType";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function useGroupTypeList() {
  const {
    data, isLoading, error,
  } = useGroupTypes();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(groupType => ({
      id: groupType.id,
      label: groupType.name,
      sublabel: groupType.groupCount != null
        ? (groupType.groupCount === 1
          ? i18n.t("{{count}} group", {
            count: groupType.groupCount,
          })
          : i18n.t("{{count}} groups", {
            count: groupType.groupCount,
          }))
        : undefined,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only group-type view — the same body + shell the main-app group-type pages render. */
function GroupTypeView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={groupTypeWorkbench}
      id={id}
      mode="view"
      contentType="group-type"
    />
  );
}

/** Group-type editor — the same auto-save form the main-app edit tab renders. */
function GroupTypeEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={groupTypeWorkbench}
      id={id}
      mode="edit"
      contentType="group-type"
    />
  );
}

export const groupTypeContentType: PanelContentTypeDef = {
  type: "group-type",
  label: i18n.t("Group Types"),
  singular: i18n.t("Group Type"),
  icon: Library,
  useList: useGroupTypeList,
  View: GroupTypeView,
  Edit: GroupTypeEdit,
};
