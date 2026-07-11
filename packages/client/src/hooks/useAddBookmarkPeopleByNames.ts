import type { Bookmark } from "@eesimple/types";

import { useCallback } from "react";

import { useUpdateBookmark } from "./useBookmarks";
import { useCreatePerson, usePeople } from "./usePeople";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { resolvePeopleIds } from "../lib/peopleMatchOrCreate";

/**
 * Returns an "add these author names to the bookmark's People" action for the **edit** Sections
 * editor: match-or-creates each name (via {@link resolvePeopleIds}), then appends the resolved ids to
 * the bookmark's existing People with the same `personIds` PATCH the General tab uses, firing one
 * "People" toast. On create the Sections editor shares the form and appends into `personIds` directly.
 */
export function useAddBookmarkPeopleByNames(bookmark: Bookmark) {
  const {
    data: people,
  } = usePeople();
  const createPerson = useCreatePerson();
  const updateBookmark = useUpdateBookmark();

  return useCallback(
    async (names: string[]) => {
      const ids = await resolvePeopleIds(names, people ?? [], createPerson);
      if (ids.length === 0) return;
      const existing = bookmark.people.map(person => person.id);
      const merged = [...new Set([...existing, ...ids])];
      updateBookmark.mutate(
        {
          id: bookmark.id,
          input: {
            personIds: merged,
          },
        },
        {
          onSuccess: () => notifyFieldSaved("People"),
          onError: error => notifyFieldSaveError("People", describeError(error)),
        },
      );
    },
    [people, createPerson, updateBookmark, bookmark],
  );
}
