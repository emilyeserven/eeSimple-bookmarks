import type { CreateFavoriteSettingsPageInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { favoriteSettingsPagesApi } from "../lib/api/settings";

const FAVORITE_SETTINGS_KEY = ["favorite-settings-pages"] as const;

export function useFavoriteSettingsPages() {
  return useQuery({
    queryKey: FAVORITE_SETTINGS_KEY,
    queryFn: favoriteSettingsPagesApi.list,
  });
}

export function useAddFavoriteSettingsPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFavoriteSettingsPageInput) => favoriteSettingsPagesApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: FAVORITE_SETTINGS_KEY,
      });
    },
  });
}

export function useRemoveFavoriteSettingsPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => favoriteSettingsPagesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: FAVORITE_SETTINGS_KEY,
      });
    },
  });
}
