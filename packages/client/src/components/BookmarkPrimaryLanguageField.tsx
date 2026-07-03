import type { Bookmark } from "@eesimple/types";

import { Combobox } from "./Combobox";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useUpdateBookmark } from "../hooks/useBookmarks";
import { useLanguages } from "../hooks/useLanguages";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { Label } from "./ui/label";

/**
 * The bookmark's primary (single) content language, on the Languages edit tab. Auto-saves on change
 * per the edit-tab standard — writing `bookmark.languageId` with a field-named toast — mirroring the
 * General tab's Language combobox but without its batched submit. The per-usage languages
 * (dub/subtitles/…) are edited by the {@link LanguageUsagesEditor} below it.
 */
export function BookmarkPrimaryLanguageField({
  bookmark,
}: {
  bookmark: Bookmark;
}) {
  const {
    data: languages = [],
  } = useLanguages();
  const update = useUpdateBookmark();

  function save(languageId: string | null) {
    update.mutate(
      {
        id: bookmark.id,
        input: {
          languageId,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Primary language"),
        onError: error => notifyFieldSaveError("Primary language", describeError(error)),
      },
    );
  }

  const languageCreate = useEntityCreateOption("language", language => save(language.id));

  return (
    <div className="space-y-1">
      <Label>Primary language</Label>
      <Combobox
        aria-label="Primary language"
        placeholder="No language"
        searchPlaceholder="Search languages…"
        emptyText="No languages found."
        options={languages.map(l => ({
          value: l.id,
          label: l.name,
        }))}
        value={bookmark.language?.id ?? undefined}
        onValueChange={v => save(v ?? null)}
        createOption={languageCreate.createOption}
      />
      <p className="text-xs text-muted-foreground">
        The bookmark&apos;s main content language (also editable on the General tab).
      </p>
      {languageCreate.modal}
    </div>
  );
}
