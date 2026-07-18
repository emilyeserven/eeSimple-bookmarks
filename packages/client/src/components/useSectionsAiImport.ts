import type { SectionEntry, SectionEntryType } from "@eesimple/types";

import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import { useCreateTag, useTags, useTagTree } from "../hooks/useTags";
import { describeError } from "../lib/apiError";
import { copyText } from "../lib/clipboard";
import { notifyError, notifySuccess } from "../lib/notifications";
import {
  buildSectionsImportPrompt,
  classifySuggestedTags,
  normalizeTagKey,
  parseSectionsImportText,
  renderTagSubtree,
  resolveNewTagPlan,
  wireSectionsToEntries,
} from "../lib/sectionsAiImport";
import { flattenTree } from "../lib/tagTree";
import { randomId } from "../lib/utils";

/**
 * Controller for the Sections "AI import" dialog: generates the prompt (embedding the selected
 * parent tag's subtree), parses the pasted AI JSON, tracks the tag review decisions
 * (reject / rename), and on apply creates the accepted new tags then replaces the Sections editor
 * value via `onApply` — the Kavita-import pattern, so nothing persists until the Properties tab's
 * debounce auto-save runs. All decision logic lives in the pure `lib/sectionsAiImport.ts` helpers;
 * this hook is state + wiring.
 */
export function useSectionsAiImport({
  bookmarkTitle, allowedTypes, onApply,
}: {
  bookmarkTitle: string | null;
  allowedTypes: SectionEntryType[];
  onApply: (value: { exhaustive: boolean;
    sections: SectionEntry[]; }) => void;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: tree,
  } = useTagTree();
  const {
    data: tags,
  } = useTags();
  const createTag = useCreateTag();

  const [open, setOpen] = useState(false);
  const [parentTagId, setParentTagId] = useState<string | undefined>(undefined);
  const [pasteText, setPasteText] = useState("");
  const [rejected, setRejected] = useState<Set<string>>(new Set());
  const [renames, setRenames] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const parentNode = useMemo(
    () => (tree && parentTagId
      ? flattenTree(tree).find(flat => flat.node.id === parentTagId)?.node ?? null
      : null),
    [tree, parentTagId],
  );
  const prompt = useMemo(
    () => buildSectionsImportPrompt({
      bookmarkTitle,
      parentTagName: parentNode?.name ?? null,
      subtreeText: parentNode ? renderTagSubtree(parentNode) : null,
    }),
    [bookmarkTitle, parentNode],
  );
  const parseState = useMemo(() => parseSectionsImportText(pasteText), [pasteText]);
  const tagReview = useMemo(
    () => (parseState.kind === "ok" ? classifySuggestedTags(parseState.payload, tags ?? []) : []),
    [parseState, tags],
  );

  function handleOpenChange(next: boolean): void {
    setOpen(next);
    // Reset the paste/review state on close; the parent-tag selection is worth keeping for a re-run.
    if (!next) {
      setPasteText("");
      setRejected(new Set());
      setRenames({});
    }
  }

  function handleCopy(): void {
    copyText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => notifyError(t("Could not copy to clipboard")));
  }

  function toggleReject(name: string): void {
    setRejected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function renameTag(name: string, next: string): void {
    setRenames(prev => ({
      ...prev,
      [name]: next,
    }));
  }

  async function handleApply(): Promise<void> {
    if (parseState.kind !== "ok" || parseState.payload.sections.length === 0) return;
    const plan = resolveNewTagPlan(tagReview, {
      rejected,
      renames,
    }, tags ?? [], parentTagId ?? null);
    setIsApplying(true);
    // Create accepted new tags parents-first; a created parent's id feeds its children below.
    const createdByKey = new Map<string, string>();
    try {
      for (const creation of plan.creations) {
        const parentId = creation.parent.kind === "existing"
          ? creation.parent.id
          : createdByKey.get(normalizeTagKey(creation.parent.name)) ?? null;
        const tag = await createTag.mutateAsync({
          name: creation.finalName,
          ...(parentId !== null && {
            parentId,
          }),
        });
        createdByKey.set(normalizeTagKey(creation.finalName), tag.id);
      }
    }
    catch (err) {
      // Already-created tags persist; a retry re-classifies them as existing, so just stop here.
      notifyError(describeError(err));
      setIsApplying(false);
      return;
    }
    const resolveTagId = (name: string): string | undefined => {
      const resolved = plan.resolution[normalizeTagKey(name)];
      if (!resolved) return undefined;
      return resolved.kind === "existing"
        ? resolved.id
        : createdByKey.get(normalizeTagKey(resolved.finalName));
    };
    const sections = wireSectionsToEntries(parseState.payload.sections, resolveTagId, allowedTypes, randomId);
    // A transcribed ToC covers the whole book — exhaustive, matching the Kavita import default.
    onApply({
      exhaustive: true,
      sections,
    });
    notifySuccess(plan.creations.length > 0
      ? t("Imported {{count}} sections and created {{tags}} tags — review and save", {
        count: sections.length,
        tags: plan.creations.length,
      })
      : t("Imported {{count}} sections — review and save", {
        count: sections.length,
      }));
    setIsApplying(false);
    handleOpenChange(false);
  }

  return {
    open,
    handleOpenChange,
    tree,
    parentTagId,
    setParentTagId,
    parentName: parentNode?.name ?? null,
    prompt,
    copied,
    handleCopy,
    pasteText,
    setPasteText,
    parseState,
    tagReview,
    rejected,
    toggleReject,
    renames,
    renameTag,
    isApplying,
    handleApply,
  };
}
