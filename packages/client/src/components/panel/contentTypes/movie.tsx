/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Film } from "lucide-react";

import { useMovies } from "../../../hooks/useMovies";
import { movieWorkbench } from "../../workbench/movie";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function useMovieList() {
  const {
    data, isLoading, error,
  } = useMovies();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(movie => ({
      id: movie.id,
      label: movie.name,
      sublabel: movie.year ? String(movie.year) : undefined,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only movie view — the same body + shell the main-app movie pages render. */
function MovieView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={movieWorkbench}
      id={id}
      mode="view"
      contentType="movie"
    />
  );
}

/** Movie editor — the same auto-save form the main-app edit tab renders. */
function MovieEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={movieWorkbench}
      id={id}
      mode="edit"
      contentType="movie"
    />
  );
}

export const movieContentType: PanelContentTypeDef = {
  type: "movie",
  label: "Movies",
  singular: "Movie",
  icon: Film,
  useList: useMovieList,
  View: MovieView,
  Edit: MovieEdit,
};
