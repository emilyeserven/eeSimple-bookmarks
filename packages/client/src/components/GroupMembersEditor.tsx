import type { Person } from "@eesimple/types";

import { useState } from "react";

import { AddPersonModal } from "./AddPersonModal";
import { MultiCombobox } from "./MultiCombobox";
import { usePeople, useUpdatePerson } from "../hooks/usePeople";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

import { Label } from "@/components/ui/label";

interface Props {
  groupId: string;
  groupName: string;
}

/**
 * Inline editor for a single group's People membership, shown under a selected group in the podcast
 * author pickers. Adding/removing a person rewrites that person's `groupIds` (the `person_groups`
 * relation) — the same write `GroupPeopleForm` does — so it works even mid-create, since the group
 * already exists once selected/created. Offers inline person-create. Uses the manual `AddPersonModal`
 * pattern (no registry import) so it's safe inside the modal-wrapped create form.
 */
export function GroupMembersEditor({
  groupId,
  groupName,
}: Props) {
  const {
    data: people,
  } = usePeople();
  const update = useUpdatePerson();
  const [addPersonOpen, setAddPersonOpen] = useState(false);

  const memberIds = (people ?? []).filter(person => person.groupIds.includes(groupId)).map(person => person.id);

  /** Add or remove this group from a person's `groupIds`, toasting under the group's name. */
  function setPersonInGroup(person: Person, inGroup: boolean): void {
    const nextGroupIds = inGroup
      ? [...new Set([...person.groupIds, groupId])]
      : person.groupIds.filter(id => id !== groupId);
    update.mutate(
      {
        id: person.id,
        input: {
          groupIds: nextGroupIds,
        },
      },
      {
        onSuccess: () => notifyFieldSaved(`${groupName} members`),
        onError: error => notifyFieldSaveError(`${groupName} members`, describeError(error)),
      },
    );
  }

  /** Diff the selected member set against the current one and persist only the changes. */
  function handleValuesChange(next: string[]): void {
    for (const person of people ?? []) {
      const was = memberIds.includes(person.id);
      const now = next.includes(person.id);
      if (was !== now) setPersonInGroup(person, now);
    }
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">
        Add people to
        {" "}
        {groupName}
      </Label>
      <MultiCombobox
        options={(people ?? []).map(person => ({
          value: person.id,
          label: person.name,
        }))}
        values={memberIds}
        onValuesChange={handleValuesChange}
        placeholder="Add people…"
        searchPlaceholder="Search people…"
        emptyText="No people found."
        createOption={{
          label: "Create person",
          onSelect: () => setAddPersonOpen(true),
        }}
      />
      <AddPersonModal
        open={addPersonOpen}
        onOpenChange={setAddPersonOpen}
        onCreated={person => setPersonInGroup(person, true)}
      />
    </div>
  );
}
