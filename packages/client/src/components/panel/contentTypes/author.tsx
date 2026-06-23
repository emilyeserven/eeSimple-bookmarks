/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { UserRound } from "lucide-react";

import { useAuthors } from "../../../hooks/useAuthors";
import { authorWorkbench } from "../../workbench/author";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function useAuthorList() {
  const {
    data, isLoading, error,
  } = useAuthors();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(author => ({
      id: author.id,
      label: author.name,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only author view — the same tabbed bodies + shell the main-app author pages render. */
function AuthorView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={authorWorkbench}
      id={id}
      mode="view"
    />
  );
}

/** Author editor — the same per-tab auto-save form the main-app edit tab renders. */
function AuthorEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={authorWorkbench}
      id={id}
      mode="edit"
    />
  );
}

export const authorContentType: PanelContentTypeDef = {
  type: "author",
  label: "Authors",
  singular: "Author",
  icon: UserRound,
  useList: useAuthorList,
  View: AuthorView,
  Edit: AuthorEdit,
};
