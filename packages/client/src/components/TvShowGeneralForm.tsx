import type { TvShow } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { PlexTitleGeneralForm } from "./PlexTitleGeneralForm";

import { useUpdateTvShow } from "@/hooks/useTvShows";

/** Edit a TV show's name, sort order, media property, year, and Plex link. Auto-saves. */
export function TvShowGeneralForm({
  tvShow,
}: {
  tvShow: TvShow;
}) {
  const navigate = useNavigate();
  const update = useUpdateTvShow();
  return (
    <PlexTitleGeneralForm
      entity={tvShow}
      kind="show"
      update={update}
      onRenamed={slug => void navigate({
        to: "/taxonomies/tv-shows/$tvShowSlug/edit/general",
        params: {
          tvShowSlug: slug,
        },
      })}
    />
  );
}
