import type { Movie } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { PlexTitleGeneralForm } from "./PlexTitleGeneralForm";

import { useMoviePlexAutofetch, useUpdateMovie } from "@/hooks/useMovies";

/** Edit a movie's name, sort order, media property, year, and Plex link. Auto-saves. */
export function MovieGeneralForm({
  movie,
}: {
  movie: Movie;
}) {
  const navigate = useNavigate();
  const update = useUpdateMovie();
  const autofetch = useMoviePlexAutofetch();
  return (
    <PlexTitleGeneralForm
      entity={movie}
      kind="movie"
      update={update}
      onRenamed={slug => void navigate({
        to: "/taxonomies/movies/$movieSlug/edit/general",
        params: {
          movieSlug: slug,
        },
      })}
      autofetch={autofetch}
    />
  );
}
