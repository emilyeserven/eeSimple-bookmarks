/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Sparkles } from "lucide-react";

import { useGenreMoods } from "../../../hooks/useGenreMoods";
import { genreMoodWorkbench } from "../../workbench/genreMood";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function useGenreMoodList() {
  const {
    data, isLoading, error,
  } = useGenreMoods();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(genreMood => ({
      id: genreMood.id,
      label: genreMood.name,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only Genres & Moods view — the same tabbed bodies + shell the main-app pages render. */
function GenreMoodView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={genreMoodWorkbench}
      id={id}
      mode="view"
      contentType="genre-mood"
    />
  );
}

/** Genres & Moods editor — the same per-tab auto-save forms the main-app edit tabs render. */
function GenreMoodEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={genreMoodWorkbench}
      id={id}
      mode="edit"
      contentType="genre-mood"
    />
  );
}

export const genreMoodContentType: PanelContentTypeDef = {
  type: "genre-mood",
  label: "Genres & Moods",
  singular: "Genres & Moods entry",
  icon: Sparkles,
  useList: useGenreMoodList,
  View: GenreMoodView,
  Edit: GenreMoodEdit,
};
