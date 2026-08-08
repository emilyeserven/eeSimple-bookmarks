import type { AiBookmarkData } from "./useAiBookmarkData";
import type { AiBookmarkTargetSelection } from "../lib/aiBookmarkTargets";
import type { AiUpdatableField, AiUpdatableFieldKey } from "../lib/bookmarkAiUpdate";
import type { Bookmark } from "@eesimple/types";

import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import { useAiBookmarkData } from "./useAiBookmarkData";
import { useAiPromptBuilderForm } from "./useAiPromptBuilderForm";
import { EMPTY_AI_BOOKMARK_TARGET_SELECTION, resolveBookmarkTargets } from "../lib/aiBookmarkTargets";
import { buildAiPromptBuilderPrompt, listAiContextFields } from "../lib/aiPromptBuilder";
import { copyText } from "../lib/clipboard";
import { notifyError } from "../lib/notifications";

export interface AiPromptBuilderController {
  data: AiBookmarkData;
  selection: AiBookmarkTargetSelection;
  setSelectionField: <K extends keyof AiBookmarkTargetSelection>(key: K, values: string[]) => void;
  targets: Bookmark[];
  /** The free-form question asked about the targeted bookmarks. */
  question: string;
  setQuestion: (text: string) => void;
  /** The optional per-bookmark context fields (URL/description always ride along). */
  fields: AiUpdatableField[];
  checkedFields: ReadonlySet<AiUpdatableFieldKey>;
  toggleField: (key: AiUpdatableFieldKey) => void;
  setAllFields: (checked: boolean) => void;
  generatedPrompt: string;
  copied: boolean;
  handleCopy: () => void;
  /** The persisted reusable preamble (empty falls back to the built-in instructions). */
  templatePrompt: string;
  setTemplatePrompt: (text: string) => void;
}

/** Targets sub-hook: the selection state plus its resolved bookmark list (the `useAiBulkEdit` shape). */
function useAiPromptBuilderTargets(data: AiBookmarkData): {
  selection: AiBookmarkTargetSelection;
  setSelectionField: AiPromptBuilderController["setSelectionField"];
  targets: Bookmark[];
} {
  const [selection, setSelection] = useState<AiBookmarkTargetSelection>(EMPTY_AI_BOOKMARK_TARGET_SELECTION);
  const targets = useMemo(
    () => resolveBookmarkTargets(data.bookmarks, selection, data.trees, data.savedFilters),
    [data.bookmarks, selection, data.trees, data.savedFilters],
  );
  return {
    selection,
    setSelectionField: (key, values) => setSelection(prev => ({
      ...prev,
      [key]: values,
    })),
    targets,
  };
}

/**
 * Controller for the AI Prompt Builder action page — the read-only half of `useAiBulkEdit`: target
 * pickers → a free-form question → context-field checkboxes → one generated prompt to copy. There is
 * no pasted reply, no review, and no apply; nothing is ever written back to a bookmark.
 */
export function useAiPromptBuilder(): AiPromptBuilderController {
  const {
    t,
  } = useTranslation();
  const data = useAiBookmarkData();
  const {
    selection, setSelectionField, targets,
  } = useAiPromptBuilderTargets(data);
  const {
    form, patchForm,
  } = useAiPromptBuilderForm();

  const [question, setQuestion] = useState("");
  const [checkedFields, setCheckedFields] = useState<Set<AiUpdatableFieldKey>>(new Set());
  const [copied, setCopied] = useState(false);

  const fields = useMemo(() => listAiContextFields(data.properties), [data.properties]);
  const generatedPrompt = useMemo(() => buildAiPromptBuilderPrompt({
    template: form.aiPromptBuilderPrompt,
    question,
    bookmarks: targets,
    contextFields: [...checkedFields],
    properties: data.properties,
    categories: data.categories,
  }), [form.aiPromptBuilderPrompt, question, targets, checkedFields, data.properties, data.categories]);

  function toggleField(key: AiUpdatableFieldKey): void {
    setCheckedFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function setAllFields(nextChecked: boolean): void {
    setCheckedFields(nextChecked ? new Set(fields.map(field => field.key)) : new Set());
  }

  function handleCopy(): void {
    copyText(generatedPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => notifyError(t("Could not copy to clipboard")));
  }

  return {
    data,
    selection,
    setSelectionField,
    targets,
    question,
    setQuestion,
    fields,
    checkedFields,
    toggleField,
    setAllFields,
    generatedPrompt,
    copied,
    handleCopy,
    templatePrompt: form.aiPromptBuilderPrompt,
    setTemplatePrompt: text => patchForm({
      aiPromptBuilderPrompt: text,
    }),
  };
}
