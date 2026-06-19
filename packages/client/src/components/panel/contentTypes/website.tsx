/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Globe } from "lucide-react";

import { Loading, Problem } from "./status";
import { useWebsites } from "../../../hooks/useWebsites";
import { WebsiteCard } from "../../WebsiteCard";
import { WebsiteRow } from "../../WebsiteRow";

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

/** Read-only website view, reusing the same `WebsiteCard` the view page renders. */
function WebsiteView({
  id,
}: {
  id: string;
}) {
  const {
    data, isLoading, error,
  } = useWebsites();
  if (isLoading) return <Loading />;
  if (error) return <Problem>{error.message}</Problem>;
  const website = (data ?? []).find(item => item.id === id);
  if (!website) return <Problem>Website not found.</Problem>;
  return <WebsiteCard website={website} />;
}

/** Inline website editor, reusing the same `WebsiteRow` the settings and edit pages use. */
function WebsiteEdit({
  id,
}: {
  id: string;
}) {
  const {
    data, isLoading, error,
  } = useWebsites();
  if (isLoading) return <Loading />;
  if (error) return <Problem>{error.message}</Problem>;
  const website = (data ?? []).find(item => item.id === id);
  if (!website) return <Problem>Website not found.</Problem>;
  return <WebsiteRow website={website} />;
}

export const websiteContentType: PanelContentTypeDef = {
  type: "website",
  label: "Websites",
  singular: "Website",
  icon: Globe,
  useList: useWebsiteList,
  View: WebsiteView,
  Edit: WebsiteEdit,
};
