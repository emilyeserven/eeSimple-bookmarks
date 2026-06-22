/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Mail } from "lucide-react";

import { useNewsletters } from "../../../hooks/useNewsletters";
import { newsletterWorkbench } from "../../workbench/newsletter";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function useNewsletterList() {
  const {
    data, isLoading, error,
  } = useNewsletters();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(newsletter => ({
      id: newsletter.id,
      label: newsletter.name,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only newsletter view — the same tabbed bodies + shell the main-app newsletter pages render. */
function NewsletterView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={newsletterWorkbench}
      id={id}
      mode="view"
    />
  );
}

/** Newsletter editor — the same per-tab auto-save form the main-app edit tab renders. */
function NewsletterEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={newsletterWorkbench}
      id={id}
      mode="edit"
    />
  );
}

export const newsletterContentType: PanelContentTypeDef = {
  type: "newsletter",
  label: "Newsletters",
  singular: "Newsletter",
  icon: Mail,
  useList: useNewsletterList,
  View: NewsletterView,
  Edit: NewsletterEdit,
};
