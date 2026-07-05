/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";
import type { FC } from "react";

import { useMemo } from "react";

import { Tags } from "lucide-react";

import { useTagTree } from "../../../hooks/useTags";
import i18n from "../../../i18n";
import { flattenTree } from "../../../lib/tagTree";
import { tagWorkbench } from "../../workbench/tag";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";
import { TagCreateForm } from "../TagPanel";

import { NEW_SENTINEL } from "@/lib/drawerSearch";

function useTagList() {
  const {
    data, isLoading, error,
  } = useTagTree();
  const items = useMemo<PanelListItem[]>(
    () => flattenTree(data ?? []).map(({
      node, depth,
    }) => ({
      id: node.id,
      label: `${"— ".repeat(depth)}${node.name}`,
      // Romanized form renders beside the name via the shared toggle-aware RomanizedLabel; the
      // children count is the de-emphasized sublabel.
      romanized: node.romanizedName,
      sublabel: node.children.length > 0
        ? i18n.t("{{count}} children", {
          count: node.children.length,
        })
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

const TagView: FC<{ id: string }> = ({
  id,
}) => (
  <EntityWorkbenchPanel
    workbench={tagWorkbench}
    id={id}
    mode="view"
    contentType="tag"
  />
);

// Creating a tag keeps its submit form; editing an existing one reuses the workbench.
const TagEdit: FC<{ id: string }> = ({
  id,
}) => (id === NEW_SENTINEL
  ? <TagCreateForm />
  : (
    <EntityWorkbenchPanel
      workbench={tagWorkbench}
      id={id}
      mode="edit"
      contentType="tag"
    />
  ));

export const tagContentType: PanelContentTypeDef = {
  type: "tag",
  label: i18n.t("Tags"),
  singular: i18n.t("Tag"),
  icon: Tags,
  useList: useTagList,
  View: TagView,
  Edit: TagEdit,
};
