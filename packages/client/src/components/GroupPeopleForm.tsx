import type { Group } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityRelationForm, EntityRelationView } from "./EntityRelationSection";
import { usePeople, useUpdatePerson } from "../hooks/usePeople";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { diffIds } from "../lib/tag-utils";

interface Props {
  group: Group;
}

/**
 * Association tab: pick which people are connected to this group. The relation is stored on each
 * person (`person.groupIds`), so a selection change is applied as a per-person patch for every
 * person that was added or removed. Auto-saves on change.
 */
export function GroupPeopleForm({
  group,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    data: people = [],
  } = usePeople();
  const update = useUpdatePerson();
  const selectedIds = people.filter(person => person.groupIds.includes(group.id)).map(person => person.id);

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
      const groupIds = added.includes(id)
        ? [...person.groupIds, group.id]
        : person.groupIds.filter(gId => gId !== group.id);
      update.mutate({
        id,
        input: {
          groupIds,
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
export function GroupPeopleView({
  group,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    data: people = [],
  } = usePeople();
  const selectedIds = people.filter(person => person.groupIds.includes(group.id)).map(person => person.id);

  return (
    <EntityRelationView
      items={people}
      selectedIds={selectedIds}
      emptyText={t("No people connected.")}
      renderItem={person => (
        <Link
          to="/taxonomies/people/$personSlug"
          params={{
            personSlug: person.slug,
          }}
          className="hover:underline"
        >
          {person.name}
        </Link>
      )}
    />
  );
}
