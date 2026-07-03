import type { DraftLanguageUsage } from "./draftLanguageUsage";
import type { LanguageUsageKind, LanguageUsageOwnerType } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { draftsFromUsages, entriesFromDrafts } from "./draftLanguageUsage";
import { LanguageUsagesEditor } from "./LanguageUsagesEditor";
import { LanguageUsagesView } from "./LanguageUsagesView";
import { useLanguageUsages, useSetLanguageUsages } from "../../hooks/useLanguageUsages";
import { describeError } from "../../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../../lib/autoSave";

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

  // The serialized entries last persisted, so the debounce skips no-op saves (including the initial load).
  const savedRef = useRef<string | null>(null);
  const mutateRef = useRef(setUsages.mutate);
  mutateRef.current = setUsages.mutate;

  // Seed the editor once the owner's usages load.
  useEffect(() => {
    if (data && drafts === null) {
      setDrafts(draftsFromUsages(data));
      savedRef.current = JSON.stringify(entriesFromDrafts(draftsFromUsages(data)));
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
          notifyFieldSaved("Languages");
        },
        onError: error => notifyFieldSaveError("Languages", describeError(error)),
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [drafts]);

  return (
    <LanguageUsagesEditor
      value={drafts ?? []}
      onChange={setDrafts}
      kind={kind}
    />
  );
}
