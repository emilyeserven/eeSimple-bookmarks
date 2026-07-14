import type { FavoriteEntityConfig, FavoritableKind } from "../lib/favoriteEntityConfig";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { FAVORITE_ENTITY_CONFIGS } from "../lib/favoriteEntityConfig";
import { notifyError, notifySuccess } from "../lib/notifications";

/** The favoritable entity/context the header star or a listing row toggles. */
export interface FavoriteContext {
  kind: FavoritableKind;
  entityId: string;
  label: string;
  isFavorite: boolean;
}

/** The minimal item a toggle call needs (already held by the calling row/node). */
interface FavoriteItem {
  id: string;
  name: string;
  isFavorite: boolean;
}

/**
 * Registry-driven star toggle for any favoritable entity kind. Backed by the dedicated
 * `FAVORITE_ENTITY_CONFIGS` (API-layer only, so listing rows importing this create no cycle back
 * through the entity descriptors). The caller already holds the row/node, so no list fetch is
 * needed — pass the item's current `isFavorite`/`name`. Fires the standard Starred/Unstarred toast.
 * Flat listing rows call it once per row; tree lists call it once and thread `toggle` into the node
 * callbacks.
 */
export function useFavoriteToggle(kind: FavoritableKind) {
  const {
    t,
  } = useTranslation();
  const queryClient = useQueryClient();
  const config: FavoriteEntityConfig = FAVORITE_ENTITY_CONFIGS[kind];

  const mutation = useMutation({
    mutationFn: ({
      id, next,
    }: { id: string;
      next: boolean;
      name: string; }) => config.update(id, {
      isFavorite: next,
    }),
    onSuccess: (_data, variables) => {
      notifySuccess(variables.next
        ? t("Starred {{name}}", {
          name: variables.name,
        })
        : t("Unstarred {{name}}", {
          name: variables.name,
        }));
      for (const key of config.invalidateKeys) {
        void queryClient.invalidateQueries({
          queryKey: [...key],
        });
      }
    },
    onError: (error: Error) => notifyError(error.message),
  });

  return {
    toggle: (item: FavoriteItem) => mutation.mutate({
      id: item.id,
      next: !item.isFavorite,
      name: item.name,
    }),
  };
}
