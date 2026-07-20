import type { AiUpdateApplyPlan, AiUpdateCreationKind } from "../lib/bookmarkAiUpdateReview";
import type { Bookmark } from "@eesimple/types";

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useUpdateBookmark } from "./useBookmarks";
import { useCreateCategory } from "./useCategories";
import { useCreateEntityNames } from "./useEntityNames";
import { useCreateGroup } from "./useGroups";
import { useCreateMediaType } from "./useMediaTypes";
import { useCreatePerson } from "./usePeople";
import { useCreateTag } from "./useTags";
import { dedupeBulkCreations, describeAiBulkEditResult } from "../lib/aiBulkEdit";
import { describeError } from "../lib/apiError";
import { notifyError, notifySuccess } from "../lib/notifications";

/** One bookmark's apply plan, paired with its bookmark for the sequential loop. */
export interface AiBulkBookmarkPlan {
  bookmark: Bookmark;
  plan: AiUpdateApplyPlan;
}

/**
 * The AI Bulk Edit apply runner — the multi-bookmark generalization of `useBookmarkAiUpdateApply`:
 * dedupe entity creations across every bookmark's plan (a tag proposed for three bookmarks is
 * created ONCE, its id fanned out to each contributing row key), then loop the bookmarks
 * sequentially through the single PATCH + entity-names PUT, continuing past per-bookmark failures.
 * A creation-phase failure aborts before anything is PATCHed. Ends with one bookmarks invalidation
 * (`useCreateEntityNames` doesn't invalidate on its own) and an aggregate toast.
 */
export function useAiBulkEditApply(): {
  isApplying: boolean;
  runApply: (plans: AiBulkBookmarkPlan[], onSuccess: () => void) => Promise<void>;
} {
  const {
    t,
  } = useTranslation();
  const queryClient = useQueryClient();
  const updateBookmark = useUpdateBookmark();
  const createNames = useCreateEntityNames();
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

  async function runApply(plans: AiBulkBookmarkPlan[], onSuccess: () => void): Promise<void> {
    const active = plans.filter(({
      plan,
    }) => plan.hasChanges);
    if (active.length === 0) return;
    setIsApplying(true);
    try {
      const creationGroups = dedupeBulkCreations(active.flatMap(({
        plan,
      }) => plan.creations));
      const createdIds = new Map<string, string>();
      try {
        for (const group of creationGroups) {
          const created = await createEntity(group.kind, group.name);
          for (const rowKey of group.rowKeys) createdIds.set(rowKey, created.id);
        }
      }
      catch (error) {
        // Abort before any PATCH — some entities may exist now, but no bookmark was touched.
        notifyError(describeError(error));
        return;
      }
      const failures: string[] = [];
      let appliedFields = 0;
      for (const {
        bookmark, plan,
      } of active) {
        try {
          const input = plan.buildBookmarkInput(createdIds);
          if (input) {
            await updateBookmark.mutateAsync({
              id: bookmark.id,
              input,
            });
          }
          if (plan.namesEntries) {
            await createNames.mutateAsync({
              ownerType: "bookmark",
              ownerId: bookmark.id,
              entries: plan.namesEntries,
            });
          }
          appliedFields += plan.fieldCount;
        }
        catch {
          failures.push(bookmark.title);
        }
      }
      await queryClient.invalidateQueries({
        queryKey: ["bookmarks"],
      });
      notifySuccess(describeAiBulkEditResult(
        appliedFields,
        active.length - failures.length,
        creationGroups.length,
      ));
      if (failures.length > 0) {
        notifyError(`${t("Failed to update:")} ${failures.join(", ")}`);
      }
      onSuccess();
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
