import type { DraftEntityName } from "./draftEntityName";
import type { EntityName, EntityNameOwnerType, UpdateEntityNameEntry } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { useTranslation } from "react-i18next";

import { draftsFromNames, entriesFromDrafts } from "./draftEntityName";
import { EntityNamesEditor } from "./EntityNamesEditor";
import { EntityNamesView } from "./EntityNamesView";
import { useCollectionAutoSave } from "../../hooks/useCollectionAutoSave";
import { useEntityNames, useSetEntityNames } from "../../hooks/useEntityNames";

interface TabProps {
  ownerType: EntityNameOwnerType;
  ownerId: string;
}

/** The non-primary names — the primary row is edited via `PrimaryLanguageField`, not this list. */
function otherNames(names: EntityName[]): EntityName[] {
  return names.filter(name => !name.isPrimary);
}

function primaryName(names: EntityName[]): EntityName | undefined {
  return names.find(name => name.isPrimary);
}

/**
 * Read-only "Primary language" value for a `dt`/`dd` grid (the field-grid pattern used by
 * PlexTitleGeneralView, Group/Location/Person, Book, Podcast) — spread as a fragment inside the
 * caller's `<dl>`.
 */
export function PrimaryLanguageDlRow({
  ownerType, ownerId,
}: TabProps) {
  const {
    data: names = [],
  } = useEntityNames(ownerType, ownerId);
  const {
    t,
  } = useTranslation();
  const primary = primaryName(names);
  return (
    <>
      <dt className="text-muted-foreground">{t("Primary language")}</dt>
      <dd>{primary
        ? primary.language.name
        : (
          <span
            className="text-muted-foreground"
          >{t("None")}
          </span>
        )}
      </dd>
    </>
  );
}

/**
 * Read-only "Primary language" block for views that render `EntityNamesTabView` as a standalone
 * section rather than inside a `dt`/`dd` grid (Category, Tag, Genre & Mood, Media Type).
 */
export function PrimaryLanguageTabView({
  ownerType, ownerId,
}: TabProps) {
  const {
    data: names = [],
  } = useEntityNames(ownerType, ownerId);
  const {
    t,
  } = useTranslation();
  const primary = primaryName(names);
  return (
    <div className="space-y-1 text-sm">
      <p className="font-medium">{t("Primary language")}</p>
      <p className={primary ? undefined : "text-muted-foreground"}>
        {primary ? primary.language.name : t("None")}
      </p>
    </div>
  );
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

  // The latest full (including-primary) list, read at save time so the primary row is never dropped.
  const dataRef = useRef(data);
  dataRef.current = data;

  // The shared collection engine compares the *other* (non-primary) entries — the set this editor
  // owns — and skips no-op saves (including the initial load, which seeds it). The persisted payload
  // re-attaches the current primary row at fire time, since `setEntityNames` is a replace-all write.
  const {
    queueSave,
  } = useCollectionAutoSave<UpdateEntityNameEntry[]>({
    id: `${ownerType}:${ownerId}`,
    label: "Names",
    persist: (otherEntries, callbacks) =>
      setNames.mutate([...otherEntries, ...primaryEntry(dataRef.current ?? [])], callbacks),
  });

  // Seed the editor once the owner's names load.
  useEffect(() => {
    if (data && drafts === null) {
      setDrafts(draftsFromNames(otherNames(data)));
    }
  }, [data, drafts]);

  // Debounced persist whenever the complete entries change from the last saved snapshot (the first
  // run after the load seeds the snapshot without saving).
  useEffect(() => {
    if (drafts === null) return;
    queueSave(entriesFromDrafts(drafts));
  }, [drafts, queueSave]);

  return (
    <EntityNamesEditor
      value={drafts ?? []}
      onChange={setDrafts}
    />
  );
}
