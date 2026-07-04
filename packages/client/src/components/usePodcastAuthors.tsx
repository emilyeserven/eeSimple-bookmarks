import type { ReactNode } from "react";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { AddGroupModal } from "./AddGroupModal";
import { AddPersonModal } from "./AddPersonModal";
import { useCreatePerson, usePeople } from "../hooks/usePeople";
import { resolvePersonNames, splitCreditNames } from "../lib/creditNames";

interface CreateOption {
  label: string;
  onSelect: () => void;
}

interface Params {
  /** Current People credits (from local state on create, or the podcast on edit). */
  personIds: string[];
  /** Current Group credits. */
  groupIds: string[];
  /** Commit a new People set — `setState` on create, a server mutation on edit. */
  onPersonIdsChange: (ids: string[]) => void;
  /** Commit a new Group set. */
  onGroupIdsChange: (ids: string[]) => void;
}

export interface PodcastAuthorsControls {
  personCreateOption: CreateOption;
  groupCreateOption: CreateOption;
  /** The inline-create modals to mount beside the pickers. */
  modals: ReactNode;
  /** Resolve an author string (from an Apple Podcasts pick) to People and add them. */
  applyAuthorName: (author: string | null) => Promise<void>;
}

/**
 * Shared authoring controls for a podcast's People/Group credits — the inline-create modals and the
 * Apple-Podcasts-author → Person match-or-create — used by **both** the create form and the edit tab.
 * The caller owns the id state (local `useState` on create, the podcast + a server mutation on edit) and
 * passes it in via `personIds`/`groupIds` + the `onChange` commit callbacks, so this hook stays
 * persistence-agnostic. It uses the manual `Add*Modal` pattern (no `useEntityCreateOption` registry) so
 * it's safe inside the modal-wrapped create form; the edit tab shares it for that reason too.
 */
export function usePodcastAuthors({
  personIds,
  groupIds,
  onPersonIdsChange,
  onGroupIdsChange,
}: Params): PodcastAuthorsControls {
  const {
    t,
  } = useTranslation();
  const {
    data: people,
  } = usePeople();
  const createPerson = useCreatePerson();
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [addGroupOpen, setAddGroupOpen] = useState(false);

  function addPerson(id: string): void {
    if (!personIds.includes(id)) onPersonIdsChange([...personIds, id]);
  }

  function addGroup(id: string): void {
    if (!groupIds.includes(id)) onGroupIdsChange([...groupIds, id]);
  }

  async function applyAuthorName(author: string | null): Promise<void> {
    const names = splitCreditNames(author ?? "");
    if (names.length === 0) return;
    const ids = await resolvePersonNames(names, people ?? [], createPerson);
    const merged = [...new Set([...personIds, ...ids])];
    if (merged.length !== personIds.length) onPersonIdsChange(merged);
  }

  return {
    personCreateOption: {
      label: t("Create person"),
      onSelect: () => setAddPersonOpen(true),
    },
    groupCreateOption: {
      label: t("Create group"),
      onSelect: () => setAddGroupOpen(true),
    },
    modals: (
      <>
        <AddPersonModal
          open={addPersonOpen}
          onOpenChange={setAddPersonOpen}
          onCreated={person => addPerson(person.id)}
        />
        <AddGroupModal
          open={addGroupOpen}
          onOpenChange={setAddGroupOpen}
          onCreated={group => addGroup(group.id)}
        />
      </>
    ),
    applyAuthorName,
  };
}
