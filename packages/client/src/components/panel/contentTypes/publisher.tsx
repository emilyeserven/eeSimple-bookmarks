/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { BookUser } from "lucide-react";

import { usePublishers } from "../../../hooks/usePublishers";
import { publisherWorkbench } from "../../workbench/publisher";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function usePublisherList() {
  const {
    data, isLoading, error,
  } = usePublishers();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(publisher => ({
      id: publisher.id,
      label: publisher.name,
      sublabel: publisher.website?.domain,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only publisher view — the same tabbed bodies + shell the main-app publisher pages render. */
function PublisherView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={publisherWorkbench}
      id={id}
      mode="view"
    />
  );
}

/** Publisher editor — the same per-tab auto-save form the main-app edit tab renders. */
function PublisherEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={publisherWorkbench}
      id={id}
      mode="edit"
    />
  );
}

export const publisherContentType: PanelContentTypeDef = {
  type: "publisher",
  label: "Publishers",
  singular: "Publisher",
  icon: BookUser,
  useList: usePublisherList,
  View: PublisherView,
  Edit: PublisherEdit,
};
