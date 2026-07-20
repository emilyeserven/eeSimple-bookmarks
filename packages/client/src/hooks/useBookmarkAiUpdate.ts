import type {
  AiUpdatableField,
  AiUpdatableFieldKey,
  BookmarkAiUpdateParseState,
} from "../lib/bookmarkAiUpdate";
import type {
  AiUpdateApplyPlan,
  AiUpdateCreationKind,
  AiUpdateReviewContext,
  AiUpdateReviewRow,
} from "../lib/bookmarkAiUpdateReview";
import type { Bookmark, CustomProperty } from "@eesimple/types";

import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import { useBookmarkAiUpdateForm } from "./useBookmarkAiUpdateForm";
import { useUpdateBookmark } from "./useBookmarks";
import { useCategories, useCreateCategory } from "./useCategories";
import { useCustomProperties } from "./useCustomProperties";
import { useSetEntityNames } from "./useEntityNames";
import { useCreateGroup, useGroups } from "./useGroups";
import { useLanguages } from "./useLanguages";
import { useCreateMediaType, useMediaTypes } from "./useMediaTypes";
import { useCreatePerson, usePeople } from "./usePeople";
import { useCreateTag, useTags } from "./useTags";
import { describeError } from "../lib/apiError";
import {
  buildBookmarkAiUpdatePrompt,
  listAiUpdatableFields,
  parseBookmarkAiUpdateText,
} from "../lib/bookmarkAiUpdate";
import {
  buildAiUpdateApplyPlan,
  buildAiUpdateReview,
  describeAiUpdateResult,
} from "../lib/bookmarkAiUpdateReview";
import { copyText } from "../lib/clipboard";
import { notifyError, notifySuccess } from "../lib/notifications";
import { randomId } from "../lib/utils";

/** The loaded taxonomy/vocabulary lists the review + prompt need, bundled to keep hooks spread. */
function useBookmarkAiUpdateData(bookmark: Bookmark): {
  ctx: AiUpdateReviewContext;
  properties: CustomProperty[];
} {
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: tags,
  } = useTags();
  const {
    data: categories,
  } = useCategories();
  const {
    data: mediaTypes,
  } = useMediaTypes();
  const {
    data: people,
  } = usePeople();
  const {
    data: groups,
  } = useGroups();
  const {
    data: languages,
  } = useLanguages();
  return {
    properties: properties ?? [],
    ctx: {
      bookmark,
      tags: tags ?? [],
      categories: categories ?? [],
      mediaTypes: mediaTypes ?? [],
      people: people ?? [],
      groups: groups ?? [],
      languages: languages ?? [],
    },
  };
}

/** The sequential apply runner: create missing entities, PATCH the bookmark, PUT the names set. */
function useBookmarkAiUpdateApply(bookmark: Bookmark): {
  isApplying: boolean;
  runApply: (plan: AiUpdateApplyPlan, onSuccess: () => void) => Promise<void>;
} {
  const updateBookmark = useUpdateBookmark();
  const setNames = useSetEntityNames("bookmark", bookmark.id);
  const createTag = useCreateTag();
  const createPerson = useCreatePerson();
  const createGroup = useCreateGroup();
  const createCategory = useCreateCategory();
  const createMediaType = useCreateMediaType();
  const [isApplying, setIsApplying] = useState(false);

  async function createEntity(kind: AiUpdateCreationKind, name: string): Promise<{ id: string }> {
    switch (kind) {
      case "tag": return createTag.mutateAsync({
        name,
      });
      case "person": return createPerson.mutateAsync({
        name,
      });
      case "group": return createGroup.mutateAsync({
        name,
      });
      case "category": return createCategory.mutateAsync({
        name,
      });
      default: return createMediaType.mutateAsync({
        name,
      });
    }
  }

  async function runApply(plan: AiUpdateApplyPlan, onSuccess: () => void): Promise<void> {
    setIsApplying(true);
    try {
      const createdIds = new Map<string, string>();
      for (const creation of plan.creations) {
        const created = await createEntity(creation.kind, creation.name);
        createdIds.set(creation.rowKey, created.id);
      }
      const input = plan.buildBookmarkInput(createdIds);
      if (input) {
        await updateBookmark.mutateAsync({
          id: bookmark.id,
          input,
        });
      }
      if (plan.namesEntries) await setNames.mutateAsync(plan.namesEntries);
      notifySuccess(describeAiUpdateResult(plan.fieldCount, plan.creations.length));
      onSuccess();
    }
    catch (error) {
      notifyError(describeError(error));
    }
    finally {
      setIsApplying(false);
    }
  }

  return {
    isApplying,
    runApply,
  };
}

export interface BookmarkAiUpdateController {
  fields: AiUpdatableField[];
  checkedFields: ReadonlySet<AiUpdatableFieldKey>;
  toggleField: (key: AiUpdatableFieldKey) => void;
  setAllFields: (checked: boolean) => void;
  generatedPrompt: string;
  copied: boolean;
  handleCopy: () => void;
  applyText: string;
  setApplyText: (text: string) => void;
  parseState: BookmarkAiUpdateParseState;
  reviewRows: AiUpdateReviewRow[];
  excluded: ReadonlySet<string>;
  toggleRow: (key: string) => void;
  isApplying: boolean;
  handleApply: () => void;
  templatePrompt: string;
  setTemplatePrompt: (text: string) => void;
}

/**
 * Controller for the bookmark edit "AI" tab (the TagReparentTab shape): field checkboxes → generated
 * prompt → pasted-JSON parse → review rows → sequential apply. State and handlers live here; the tab
 * component is presentational. Hook density is spread across the data/apply sub-hooks above per the
 * fallow decomposition guidance.
 */
export function useBookmarkAiUpdate(bookmark: Bookmark): BookmarkAiUpdateController {
  const {
    t,
  } = useTranslation();
  const {
    ctx, properties,
  } = useBookmarkAiUpdateData(bookmark);
  const {
    form, patchForm,
  } = useBookmarkAiUpdateForm();
  const {
    isApplying, runApply,
  } = useBookmarkAiUpdateApply(bookmark);

  const [checkedFields, setCheckedFields] = useState<Set<AiUpdatableFieldKey>>(new Set());
  const [applyText, setApplyText] = useState("");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const fields = useMemo(
    () => listAiUpdatableFields(bookmark, properties),
    [bookmark, properties],
  );
  const checked = useMemo(() => [...checkedFields], [checkedFields]);
  const generatedPrompt = useMemo(() => buildBookmarkAiUpdatePrompt({
    template: form.bookmarkAiUpdatePrompt,
    bookmark,
    checked,
    properties,
    categoryName: ctx.categories.find(category => category.id === bookmark.categoryId)?.name ?? null,
    categoryNames: ctx.categories.map(category => category.name),
    mediaTypeNames: ctx.mediaTypes.map(mediaType => mediaType.name),
    tagNames: ctx.tags.map(tag => tag.name),
  }), [form.bookmarkAiUpdatePrompt, bookmark, checked, properties, ctx]);
  const parseState = useMemo(
    () => parseBookmarkAiUpdateText(applyText, checked, properties),
    [applyText, checked, properties],
  );
  const reviewRows = useMemo(
    () => parseState.kind === "ok" ? buildAiUpdateReview(parseState.proposals, properties, ctx) : [],
    [parseState, properties, ctx],
  );

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
    const plan = buildAiUpdateApplyPlan(reviewRows, excluded, ctx, randomId);
    if (!plan.hasChanges) {
      notifyError(t("No changes selected to apply."));
      return;
    }
    void runApply(plan, () => {
      setApplyText("");
      setExcluded(new Set());
    });
  }

  return {
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
    reviewRows,
    excluded,
    toggleRow,
    isApplying,
    handleApply,
    templatePrompt: form.bookmarkAiUpdatePrompt,
    setTemplatePrompt: text => patchForm({
      bookmarkAiUpdatePrompt: text,
    }),
  };
}
