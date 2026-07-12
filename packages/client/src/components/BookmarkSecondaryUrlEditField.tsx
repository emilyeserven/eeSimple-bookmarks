import type { Bookmark, UpdateBookmarkInput } from "@eesimple/types";

import { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import { useUpdateBookmark } from "../hooks/useBookmarks";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { isFetchableUrl } from "../lib/url";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The bookmark edit-General "Download URL" (secondary URL) field. A **decoupled** plain scalar: it
 * does not thread through the shared `BookmarkGeneralFormContext`/URL-scan controller (unlike the
 * primary URL field), auto-saving on blur via the standard {@link useFieldAutoSave} engine. An empty
 * value clears the column; a non-empty value must be a valid http(s) URL or no save fires.
 */
export function BookmarkSecondaryUrlEditField({
  bookmark,
}: {
  bookmark: Bookmark;
}) {
  const {
    t,
  } = useTranslation();
  const update = useUpdateBookmark();
  const {
    saveField,
  } = useFieldAutoSave<UpdateBookmarkInput, Bookmark>({
    id: bookmark.id,
    update,
    labels: {
      secondaryUrl: t("Download URL"),
    },
    initial: {
      secondaryUrl: bookmark.secondaryUrl,
    },
  });
  const [value, setValue] = useState(bookmark.secondaryUrl ?? "");
  useEffect(() => {
    setValue(bookmark.secondaryUrl ?? "");
  }, [bookmark.id, bookmark.secondaryUrl]);

  const trimmed = value.trim();
  const valid = trimmed === "" || isFetchableUrl(trimmed);

  return (
    <div className="space-y-1">
      <Label htmlFor="bookmark-secondary-url">{t("Download URL")}</Label>
      <Input
        id="bookmark-secondary-url"
        type="url"
        value={value}
        placeholder={t("Optional second link (e.g. a download)")}
        onChange={event => setValue(event.target.value)}
        onBlur={() => saveField("secondaryUrl", trimmed === "" ? null : trimmed, {
          valid,
        })}
      />
      {valid
        ? null
        : (
          <p className="text-sm text-destructive">{t("Enter a valid http(s) URL.")}</p>
        )}
    </div>
  );
}
