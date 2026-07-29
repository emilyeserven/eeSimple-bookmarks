import type { DraftLanguageUsage } from "./draftLanguageUsage";
import type { LanguageUsageKind, LanguageUsageOwnerType, UpdateLanguageUsageEntry } from "@eesimple/types";

import { useEffect, useState } from "react";

import { draftsFromUsages, entriesFromDrafts } from "./draftLanguageUsage";
import { LanguageUsagesEditor } from "./LanguageUsagesEditor";
import { LanguageUsagesView } from "./LanguageUsagesView";
import { useCollectionAutoSave } from "../../hooks/useCollectionAutoSave";
import { useLanguageUsages, useSetLanguageUsages } from "../../hooks/useLanguageUsages";

interface TabProps {
  ownerType: LanguageUsageOwnerType;
  ownerId: string;
  /** Which usage-level group applies — `availability` for content, `proficiency` for People. */
  kind: LanguageUsageKind;
}

/** View pane: read-only chips for an owner's language usages. */
export function LanguageUsagesTabView({
  ownerType, ownerId,
}: Omit<TabProps, "kind">) {
  const {
    data: usages = [],
  } = useLanguageUsages(ownerType, ownerId);
  return <LanguageUsagesView usages={usages} />;
}

/**
 * Edit pane: a repeatable editor that debounce-auto-saves the whole set (edit-tab standard — no Save
 * button), firing a single "Languages" toast per persisted change.
 */
export function LanguageUsagesTabEditor({
  ownerType, ownerId, kind,
}: TabProps) {
  const {
    data,
  } = useLanguageUsages(ownerType, ownerId);
  const setUsages = useSetLanguageUsages(ownerType, ownerId);
  const [drafts, setDrafts] = useState<DraftLanguageUsage[] | null>(null);

  // The shared collection engine skips no-op saves (including the initial load, which seeds it).
  const {
    queueSave,
  } = useCollectionAutoSave<UpdateLanguageUsageEntry[]>({
    id: `${ownerType}:${ownerId}`,
    label: "Languages",
    persist: (entries, callbacks) => setUsages.mutate(entries, callbacks),
  });

  // Seed the editor once the owner's usages load.
  useEffect(() => {
    if (data && drafts === null) {
      setDrafts(draftsFromUsages(data));
    }
  }, [data, drafts]);

  // Debounced persist whenever the complete entries change from the last saved snapshot (the first
  // run after the load seeds the snapshot without saving).
  useEffect(() => {
    if (drafts === null) return;
    queueSave(entriesFromDrafts(drafts));
  }, [drafts, queueSave]);

  return (
    <LanguageUsagesEditor
      value={drafts ?? []}
      onChange={setDrafts}
      kind={kind}
    />
  );
}
