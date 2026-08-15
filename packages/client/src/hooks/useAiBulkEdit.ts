import type { AiBookmarkData } from "./useAiBookmarkData";
import type { AiBulkBookmarkPlan } from "./useAiBulkEditApply";
import type { AiBookmarkTargetMatchMode, AiBookmarkTargetSelection } from "../lib/aiBookmarkTargets";
import type { AiBulkEditParseState } from "../lib/aiBulkEdit";
import type { AiUpdatableField, AiUpdatableFieldKey } from "../lib/bookmarkAiUpdate";
import type { AiUpdateReviewContext, AiUpdateReviewRow } from "../lib/bookmarkAiUpdateReview";
import type { Bookmark } from "@eesimple/types";

import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import { useAiBookmarkData } from "./useAiBookmarkData";
import { useAiBulkEditApply } from "./useAiBulkEditApply";
import { useAiBulkEditForm } from "./useAiBulkEditForm";
import {
  DEFAULT_AI_TARGET_MATCH_MODE,
  EMPTY_AI_BOOKMARK_TARGET_SELECTION,
  resolveBookmarkTargets,
} from "../lib/aiBookmarkTargets";
import {
  buildAiBulkEditPrompt,
  parseAiBulkEditText,
  prefixReviewRows,
  resolveAiBulkEditTagVocabulary,
} from "../lib/aiBulkEdit";
import { listAiBulkUpdatableFields } from "../lib/bookmarkAiUpdate";
import { buildAiUpdateApplyPlan, buildAiUpdateReview } from "../lib/bookmarkAiUpdateReview";
import { copyText } from "../lib/clipboard";
import { notifyError } from "../lib/notifications";
import { randomId } from "../lib/utils";

/** One bookmark's slice of the bulk review: its prefixed rows plus the reply keys it ignored. */
export interface AiBulkEditReviewSection {
  bookmark: Bookmark;
  rows: AiUpdateReviewRow[];
  ignoredKeys: string[];
}

export interface AiBulkEditController {
  data: AiBookmarkData;
  selection: AiBookmarkTargetSelection;
  setSelectionField: <K extends keyof AiBookmarkTargetSelection>(key: K, values: string[]) => void;
  /** Whether a bookmark needs to match ANY selected item or ALL of them. */
  matchMode: AiBookmarkTargetMatchMode;
  setMatchMode: (mode: AiBookmarkTargetMatchMode) => void;
  targets: Bookmark[];
  fields: AiUpdatableField[];
  checkedFields: ReadonlySet<AiUpdatableFieldKey>;
  toggleField: (key: AiUpdatableFieldKey) => void;
  setAllFields: (checked: boolean) => void;
  generatedPrompt: string;
  copied: boolean;
  handleCopy: () => void;
  applyText: string;
  setApplyText: (text: string) => void;
  parseState: AiBulkEditParseState;
  reviewSections: AiBulkEditReviewSection[];
  unknownIds: string[];
  excluded: ReadonlySet<string>;
  toggleRow: (key: string) => void;
  isApplying: boolean;
  handleApply: () => void;
  templatePrompt: string;
  setTemplatePrompt: (text: string) => void;
  /** Tag ids the AI must not use (persisted). */
  excludedTagIds: string[];
  setExcludedTagIds: (ids: string[]) => void;
  /** Whether parent tags are dropped from the vocabulary in favor of leaf tags (persisted). */
  preferLeafTags: boolean;
  setPreferLeafTags: (value: boolean) => void;
}

/** Targets sub-hook: the selection state plus its resolved bookmark list. */
function useAiBulkEditTargets(data: AiBookmarkData): {
  selection: AiBookmarkTargetSelection;
  setSelectionField: AiBulkEditController["setSelectionField"];
  matchMode: AiBookmarkTargetMatchMode;
  setMatchMode: (mode: AiBookmarkTargetMatchMode) => void;
  targets: Bookmark[];
} {
  const [selection, setSelection] = useState<AiBookmarkTargetSelection>(EMPTY_AI_BOOKMARK_TARGET_SELECTION);
  const [matchMode, setMatchMode] = useState<AiBookmarkTargetMatchMode>(DEFAULT_AI_TARGET_MATCH_MODE);
  const targets = useMemo(
    () => resolveBookmarkTargets(data.bookmarks, selection, data.trees, data.savedFilters, matchMode),
    [data.bookmarks, selection, data.trees, data.savedFilters, matchMode],
  );
  return {
    selection,
    setSelectionField: (key, values) => setSelection(prev => ({
      ...prev,
      [key]: values,
    })),
    matchMode,
    setMatchMode,
    targets,
  };
}

/**
 * Controller for the AI Bulk Edit action page (the `useBookmarkAiUpdate` shape at bulk scale):
 * target pickers → field checkboxes → one generated multi-bookmark prompt → pasted-JSON parse →
 * per-bookmark review sections (one shared excluded-set over prefixed row keys) → the deduped
 * sequential apply. State and handlers live here; the page component is presentational.
 */
export function useAiBulkEdit(): AiBulkEditController {
  const {
    t,
  } = useTranslation();
  const data = useAiBookmarkData();
  const {
    selection, setSelectionField, matchMode, setMatchMode, targets,
  } = useAiBulkEditTargets(data);
  const {
    form, patchForm,
  } = useAiBulkEditForm();
  const {
    isApplying, runApply,
  } = useAiBulkEditApply();

  const [checkedFields, setCheckedFields] = useState<Set<AiUpdatableFieldKey>>(new Set());
  const [applyText, setApplyText] = useState("");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const fields = useMemo(() => listAiBulkUpdatableFields(data.properties), [data.properties]);
  const checked = useMemo(() => [...checkedFields], [checkedFields]);
  const excludedTagNames = useMemo(() => {
    const excluded = new Set(form.aiBulkEditExcludedTagIds);
    return data.tags.filter(tag => excluded.has(tag.id)).map(tag => tag.name);
  }, [form.aiBulkEditExcludedTagIds, data.tags]);
  const generatedPrompt = useMemo(() => buildAiBulkEditPrompt({
    template: form.aiBulkEditPrompt,
    bookmarks: targets,
    checked,
    properties: data.properties,
    categories: data.categories,
    tags: data.tags,
    categoryNames: data.categories.map(category => category.name),
    mediaTypeNames: data.mediaTypes.map(mediaType => mediaType.name),
    tagNames: resolveAiBulkEditTagVocabulary(data.tags, {
      excludedTagIds: form.aiBulkEditExcludedTagIds,
      preferLeafTags: form.aiBulkEditPreferLeafTags,
    }),
    preferLeafTags: form.aiBulkEditPreferLeafTags,
    excludedTagNames,
  }), [form, targets, checked, data, excludedTagNames]);
  const parseState = useMemo(
    () => parseAiBulkEditText(applyText, checked, data.properties, new Set(targets.map(bookmark => bookmark.id))),
    [applyText, checked, data.properties, targets],
  );
  const reviewSections = useMemo<AiBulkEditReviewSection[]>(() => {
    if (parseState.kind !== "ok") return [];
    const byId = new Map(targets.map(bookmark => [bookmark.id, bookmark]));
    return parseState.items.flatMap((item) => {
      const bookmark = byId.get(item.bookmarkId);
      if (!bookmark) return [];
      const ctx: AiUpdateReviewContext = {
        ...data,
        bookmark,
      };
      return [{
        bookmark,
        rows: prefixReviewRows(bookmark.id, buildAiUpdateReview(item.proposals, data.properties, ctx)),
        ignoredKeys: item.ignoredKeys,
      }];
    });
  }, [parseState, targets, data]);

  function toggleField(key: AiUpdatableFieldKey): void {
    setCheckedFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function setAllFields(nextChecked: boolean): void {
    setCheckedFields(nextChecked
      ? new Set(fields.filter(field => !field.disabledReason).map(field => field.key))
      : new Set());
  }

  function toggleRow(key: string): void {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleCopy(): void {
    copyText(generatedPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => notifyError(t("Could not copy to clipboard")));
  }

  function handleApply(): void {
    if (parseState.kind !== "ok") {
      notifyError(t("Could not parse JSON. Paste the AI's JSON response."));
      return;
    }
    const plans: AiBulkBookmarkPlan[] = reviewSections.map(section => ({
      bookmark: section.bookmark,
      plan: buildAiUpdateApplyPlan(section.rows, excluded, {
        ...data,
        bookmark: section.bookmark,
      }, randomId),
    }));
    if (!plans.some(({
      plan,
    }) => plan.hasChanges)) {
      notifyError(t("No changes selected to apply."));
      return;
    }
    void runApply(plans, () => {
      setApplyText("");
      setExcluded(new Set());
    });
  }

  return {
    data,
    selection,
    setSelectionField,
    matchMode,
    setMatchMode,
    targets,
    fields,
    checkedFields,
    toggleField,
    setAllFields,
    generatedPrompt,
    copied,
    handleCopy,
    applyText,
    setApplyText,
    parseState,
    reviewSections,
    unknownIds: parseState.kind === "ok" ? parseState.unknownIds : [],
    excluded,
    toggleRow,
    isApplying,
    handleApply,
    templatePrompt: form.aiBulkEditPrompt,
    setTemplatePrompt: text => patchForm({
      aiBulkEditPrompt: text,
    }),
    excludedTagIds: form.aiBulkEditExcludedTagIds,
    setExcludedTagIds: ids => patchForm({
      aiBulkEditExcludedTagIds: ids,
    }),
    preferLeafTags: form.aiBulkEditPreferLeafTags,
    setPreferLeafTags: value => patchForm({
      aiBulkEditPreferLeafTags: value,
    }),
  };
}
