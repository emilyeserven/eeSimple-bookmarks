import type { DraftEntityName } from "./draftEntityName";
import type { EntityName, EntityNameOwnerType, UpdateEntityNameEntry } from "@eesimple/types";

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

/** The non-primary names — the primary row is edited via `PrimaryLanguageField`, not this list. */
function otherNames(names: EntityName[]): EntityName[] {
  return names.filter(name => !name.isPrimary);
}

/** The current primary row, if any, reshaped for a replace-all PUT entry. */
function primaryEntry(names: EntityName[]): UpdateEntityNameEntry[] {
  const primary = names.find(name => name.isPrimary);
  return primary
    ? [{
      languageId: primary.language.id,
      value: primary.value,
      isPrimary: true,
    }]
    : [];
}

/** View pane: read-only chips for an owner's additional (non-primary) multilingual names. */
export function EntityNamesTabView({
  ownerType, ownerId,
}: TabProps) {
  const {
    data: names = [],
  } = useEntityNames(ownerType, ownerId);
  return <EntityNamesView names={otherNames(names)} />;
}

/**
 * Edit pane: a repeatable editor for an owner's *additional* names that debounce-auto-saves the
 * whole set (edit-tab standard — no Save button), firing a single "Names" toast per persisted
 * change. The current primary row (set via `PrimaryLanguageField`, next to the main Name field) is
 * preserved on every save — this editor never shows or clears it, since `setEntityNames` is a
 * replace-all write.
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
  // The latest full (including-primary) list, read at save time so the primary row is never dropped.
  const dataRef = useRef(data);
  dataRef.current = data;

  // Seed the editor once the owner's names load.
  useEffect(() => {
    if (data && drafts === null) {
      const initialOthers = otherNames(data);
      setDrafts(draftsFromNames(initialOthers));
      savedRef.current = JSON.stringify(entriesFromDrafts(draftsFromNames(initialOthers)));
    }
  }, [data, drafts]);

  // Debounced persist whenever the complete entries change from the last saved snapshot.
  useEffect(() => {
    if (drafts === null || savedRef.current === null) return;
    const otherEntries = entriesFromDrafts(drafts);
    const serialized = JSON.stringify(otherEntries);
    if (serialized === savedRef.current) return;
    const timer = setTimeout(() => {
      const entries = [...otherEntries, ...primaryEntry(dataRef.current ?? [])];
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
