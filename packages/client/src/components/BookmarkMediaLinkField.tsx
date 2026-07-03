import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { MediaSelection } from "./useBookmarkMediaField";

import { BookmarkMediaField } from "./BookmarkMediaField";

interface BookmarkMediaLinkFieldProps {
  form: BookmarkFormApi;
}

/**
 * Create-form wrapper around {@link BookmarkMediaField}: threads the six media-link FK form fields
 * (stored as strings, `""` = unset) through the selection-driven picker. Submit-driven — the chosen
 * FK lands in form state and is sent with the create payload; no persisted bookmark, so no legacy
 * Kavita/Plex links. Placed independently via the standard-field zone.
 */
export function BookmarkMediaLinkField({
  form,
}: BookmarkMediaLinkFieldProps) {
  return (
    <form.Subscribe
      selector={state => ({
        bookId: state.values.bookId || null,
        movieId: state.values.movieId || null,
        tvShowId: state.values.tvShowId || null,
        episodeId: state.values.episodeId || null,
        albumId: state.values.albumId || null,
        trackId: state.values.trackId || null,
        podcastId: state.values.podcastId || null,
      })}
    >
      {value => (
        <BookmarkMediaField
          value={value}
          onSelect={(selection: MediaSelection) => {
            form.setFieldValue("bookId", selection.bookId ?? "");
            form.setFieldValue("movieId", selection.movieId ?? "");
            form.setFieldValue("tvShowId", selection.tvShowId ?? "");
            form.setFieldValue("episodeId", selection.episodeId ?? "");
            form.setFieldValue("albumId", selection.albumId ?? "");
            form.setFieldValue("trackId", selection.trackId ?? "");
            form.setFieldValue("podcastId", selection.podcastId ?? "");
          }}
        />
      )}
    </form.Subscribe>
  );
}
