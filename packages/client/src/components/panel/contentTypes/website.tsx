/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Globe } from "lucide-react";

import { useWebsites } from "../../../hooks/useWebsites";
import i18n from "../../../i18n";
import { websiteWorkbench } from "../../workbench/website";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function useWebsiteList() {
  const {
    data, isLoading, error,
  } = useWebsites();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(website => ({
      id: website.id,
      label: website.siteName,
      sublabel: website.domain,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only website view — the same tabbed bodies + shell the main-app website pages render. */
function WebsiteView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={websiteWorkbench}
      id={id}
      mode="view"
      contentType="website"
    />
  );
}

/** Website editor — the same per-tab auto-save forms the main-app edit tabs render. */
function WebsiteEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={websiteWorkbench}
      id={id}
      mode="edit"
      contentType="website"
    />
  );
}

export const websiteContentType: PanelContentTypeDef = {
  type: "website",
  label: i18n.t("Websites"),
  singular: i18n.t("Website"),
  icon: Globe,
  useList: useWebsiteList,
  View: WebsiteView,
  Edit: WebsiteEdit,
};
