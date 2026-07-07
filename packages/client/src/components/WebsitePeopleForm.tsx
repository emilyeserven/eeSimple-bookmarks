import type { Website } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { EntityRelationForm, EntityRelationView } from "./EntityRelationSection";
import { usePeople, useUpdatePerson } from "../hooks/usePeople";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { diffIds } from "../lib/tag-utils";

interface Props {
  website: Website;
}

/**
 * Association tab: pick which people are connected to this website. The relation is stored on each
 * person (`person.websiteIds`), so a selection change is applied as a per-person patch for every
 * person that was added or removed. Auto-saves on change.
 */
export function WebsitePeopleForm({
  website,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    data: people = [],
  } = usePeople();
  const update = useUpdatePerson();
  const selectedIds = people.filter(person => person.websiteIds.includes(website.id)).map(person => person.id);

  const onChange = (nextIds: string[]) => {
    const {
      added, removed,
    } = diffIds(selectedIds, nextIds);
    const notify = {
      onSuccess: () => notifyFieldSaved("People"),
      onError: (error: Error) => notifyFieldSaveError("People", describeError(error)),
    };
    for (const id of [...added, ...removed]) {
      const person = people.find(p => p.id === id);
      if (!person) continue;
      const websiteIds = added.includes(id)
        ? [...person.websiteIds, website.id]
        : person.websiteIds.filter(wId => wId !== website.id);
      update.mutate({
        id,
        input: {
          websiteIds,
        },
      }, notify);
    }
  };

  return (
    <EntityRelationForm
      items={people}
      selectedIds={selectedIds}
      onChange={onChange}
      createEntity="person"
      placeholder={t("No people selected")}
      searchPlaceholder={t("Search people…")}
      emptyText={t("No people found.")}
    />
  );
}

/** Read-only view of connected people. */
export function WebsitePeopleView({
  website,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    data: people = [],
  } = usePeople();
  const selectedIds = people.filter(person => person.websiteIds.includes(website.id)).map(person => person.id);

  return (
    <EntityRelationView
      items={people}
      selectedIds={selectedIds}
      emptyText={t("No people connected.")}
    />
  );
}
