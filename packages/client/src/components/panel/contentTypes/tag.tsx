/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";
import type { FC } from "react";

import { useMemo } from "react";

import { Tags } from "lucide-react";

import { useTagTree } from "../../../hooks/useTags";
import { flattenTree } from "../../../lib/tagTree";
import { TagPanel } from "../TagPanel";

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
      sublabel: node.children.length > 0 ? `${node.children.length} children` : undefined,
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
  <TagPanel
    tagId={id}
    initialMode="view"
  />
);
const TagEdit: FC<{ id: string }> = ({
  id,
}) => (
  <TagPanel
    tagId={id}
    initialMode="edit"
  />
);

export const tagContentType: PanelContentTypeDef = {
  type: "tag",
  label: "Tags",
  singular: "Tag",
  icon: Tags,
  useList: useTagList,
  View: TagView,
  Edit: TagEdit,
};
