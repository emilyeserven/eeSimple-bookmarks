import type { Group } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { EntityRelationForm, EntityRelationView } from "./EntityRelationSection";
import { useUpdateGroup } from "../hooks/useGroups";
import { useWebsites } from "../hooks/useWebsites";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

interface Props {
  group: Group;
}

/** Association tab: pick which websites are connected to this group. Auto-saves on change. */
export function GroupWebsitesForm({
  group,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    data: websites = [],
  } = useWebsites();
  const update = useUpdateGroup();
  const items = websites.map(site => ({
    ...site,
    name: site.siteName,
  }));

  return (
    <EntityRelationForm
      items={items}
      selectedIds={group.websiteIds}
      onChange={ids => update.mutate(
        {
          id: group.id,
          input: {
            websiteIds: ids,
          },
        },
        {
          onSuccess: () => notifyFieldSaved("Websites"),
          onError: error => notifyFieldSaveError("Websites", describeError(error)),
        },
      )}
      createEntity="website"
      placeholder={t("No websites selected")}
      searchPlaceholder={t("Search websites…")}
      emptyText={t("No websites found.")}
    />
  );
}

/** Read-only view of connected websites. */
export function GroupWebsitesView({
  group,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    data: websites = [],
  } = useWebsites();
  const items = websites.map(site => ({
    ...site,
    name: site.siteName,
  }));

  return (
    <EntityRelationView
      items={items}
      selectedIds={group.websiteIds}
      emptyText={t("No websites connected.")}
    />
  );
}
