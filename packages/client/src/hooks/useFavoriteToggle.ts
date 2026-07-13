import { useTranslation } from "react-i18next";

import { useCategories, useUpdateCategory } from "./useCategories";
import { useTags, useUpdateTag } from "./useTags";
import { notifyError, notifySuccess } from "../lib/notifications";

/** The favoritable taxonomies (their starred members surface in the sidebar flyouts). */
export type FavoriteEntityType = "category" | "tag";

/** The favoritable entity for the page/row the star toggle is attached to. */
export interface FavoriteContext {
  entityType: FavoriteEntityType;
  entityId: string;
  label?: string;
}

/**
 * Starred state + toggle for a category or tag. Shared by `HeaderFavoriteButton` (the header star)
 * and the listing-card star toggle, so both stay in sync. Starring flips the entity's `isFavorite`
 * flag (which drives the sidebar Categories / Tags flyouts). Mirrors {@link usePinToggle}.
 */
export function useFavoriteToggle(context: FavoriteContext) {
  const {
    t,
  } = useTranslation();
  const {
    data: categories = [],
  } = useCategories();
  const {
    data: tags = [],
  } = useTags();
  const updateCategory = useUpdateCategory();
  const updateTag = useUpdateTag();

  const entity = context.entityType === "category"
    ? categories.find(c => c.id === context.entityId)
    : tags.find(tag => tag.id === context.entityId);
  const isFavorite = Boolean(entity?.isFavorite);
  const name = context.label ?? entity?.name ?? t("this item");

  function toggle() {
    const next = !isFavorite;
    const handlers = {
      onSuccess: () =>
        notifySuccess(next
          ? t("Starred {{name}}", {
            name,
          })
          : t("Unstarred {{name}}", {
            name,
          })),
      onError: (error: Error) => notifyError(error.message),
    };
    if (context.entityType === "category") {
      updateCategory.mutate({
        id: context.entityId,
        input: {
          isFavorite: next,
        },
      }, handlers);
    }
    else {
      updateTag.mutate({
        id: context.entityId,
        input: {
          isFavorite: next,
        },
      }, handlers);
    }
  }

  return {
    isFavorite,
    name,
    toggle,
  };
}
