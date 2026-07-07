import type { Person } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { EntityRelationForm, EntityRelationView } from "./EntityRelationSection";
import { useUpdatePerson } from "../hooks/usePeople";
import { useWebsites } from "../hooks/useWebsites";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

interface Props {
  person: Person;
}

/** Association tab: pick which websites are connected to this person. Auto-saves on change. */
export function PersonWebsitesForm({
  person,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    data: websites = [],
  } = useWebsites();
  const update = useUpdatePerson();
  const items = websites.map(site => ({
    ...site,
    name: site.siteName,
  }));

  return (
    <EntityRelationForm
      items={items}
      selectedIds={person.websiteIds}
      onChange={ids => update.mutate(
        {
          id: person.id,
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
export function PersonWebsitesView({
  person,
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
      selectedIds={person.websiteIds}
      emptyText={t("No websites connected.")}
    />
  );
}
