import type { DraftEntityName } from "./draftEntityName";
import type { EntityNameOwnerType } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { draftsFromNames, entriesFromDrafts } from "./draftEntityName";
import { EntityNamesEditor } from "./EntityNamesEditor";
import { EntityNamesView } from "./EntityNamesView";
import { useEntityNames, useSetEntityNames } from "../../hooks/useEntityNames";
import { describeError } from "../../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../../lib/autoSave";

interface TabProps {
  ownerType: EntityNameOwnerType;
  ownerId: string;
}

/** View pane: read-only chips for an owner's multilingual names. */
export function EntityNamesTabView({
  ownerType, ownerId,
}: TabProps) {
  const {
    data: names = [],
  } = useEntityNames(ownerType, ownerId);
  return <EntityNamesView names={names} />;
}

/**
 * Edit pane: a repeatable editor that debounce-auto-saves the whole set (edit-tab standard — no Save
 * button), firing a single "Names" toast per persisted change. A primary row's value is mirrored
 * into the owner's base name/title column by the server on save.
 */
export function EntityNamesTabEditor({
  ownerType, ownerId,
}: TabProps) {
  const {
    data,
  } = useEntityNames(ownerType, ownerId);
  const setNames = useSetEntityNames(ownerType, ownerId);
  const [drafts, setDrafts] = useState<DraftEntityName[] | null>(null);

  // The serialized entries last persisted, so the debounce skips no-op saves (including the initial load).
  const savedRef = useRef<string | null>(null);
  const mutateRef = useRef(setNames.mutate);
  mutateRef.current = setNames.mutate;

  // Seed the editor once the owner's names load.
  useEffect(() => {
    if (data && drafts === null) {
      setDrafts(draftsFromNames(data));
      savedRef.current = JSON.stringify(entriesFromDrafts(draftsFromNames(data)));
    }
  }, [data, drafts]);

  // Debounced persist whenever the complete entries change from the last saved snapshot.
  useEffect(() => {
    if (drafts === null || savedRef.current === null) return;
    const entries = entriesFromDrafts(drafts);
    const serialized = JSON.stringify(entries);
    if (serialized === savedRef.current) return;
    const timer = setTimeout(() => {
      mutateRef.current(entries, {
        onSuccess: () => {
          savedRef.current = serialized;
          notifyFieldSaved("Names");
        },
        onError: error => notifyFieldSaveError("Names", describeError(error)),
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [drafts]);

  return (
    <EntityNamesEditor
      value={drafts ?? []}
      onChange={setDrafts}
    />
  );
}
