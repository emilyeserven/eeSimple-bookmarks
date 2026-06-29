/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";
import type { FC } from "react";

import { useMemo } from "react";

import { Tags } from "lucide-react";

import { useTagTree } from "../../../hooks/useTags";
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
      // Surface the romanized form as the de-emphasized sublabel; fall back to the children count.
      sublabel: node.romanizedName?.trim()
        ? node.romanizedName.trim()
        : node.children.length > 0 ? `${node.children.length} children` : undefined,
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
  label: "Tags",
  singular: "Tag",
  icon: Tags,
  useList: useTagList,
  View: TagView,
  Edit: TagEdit,
};
