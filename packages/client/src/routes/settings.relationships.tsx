import type { ComboboxOption } from "../components/Combobox";

import { createFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BookmarkRelationshipsEditor } from "../components/BookmarkRelationshipsEditor";
import { Combobox } from "../components/Combobox";
import { useBookmark, useBookmarks } from "../hooks/useBookmarks";
import { validateRelationshipsListSearch } from "../lib/relationshipsScope";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Settings → Relationships: the single home for editing bookmark relationships. With no `?bookmark` in
 * the URL it shows a bookmark picker; selecting one — or arriving via the old bookmark "Relationships"
 * edit tab, which redirects here with its id preselected — focuses the reused
 * `BookmarkRelationshipsEditor`. The focused bookmark lives in the URL so the view is a shareable,
 * reload-safe deeplink.
 */
export const Route = createFileRoute("/settings/relationships")({
  validateSearch: validateRelationshipsListSearch,
  component: RelationshipsSettingsPage,
});

function RelationshipsSettingsPage() {
  const {
    t,
  } = useTranslation();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    data: allBookmarks,
  } = useBookmarks();

  const select = (bookmarkId: string) => {
    void navigate({
      search: {
        bookmark: bookmarkId,
      },
      replace: true,
    });
  };
  const clear = () => {
    void navigate({
      search: {},
      replace: true,
    });
  };

  const bookmarkOptions: ComboboxOption[] = (allBookmarks ?? []).map(b => ({
    value: b.id,
    label: b.title,
    names: b.names,
  }));

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{t("Bookmark Relationships")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Link a bookmark to related bookmarks and classify how they relate. Pick a bookmark to edit its relationships.")}
        </p>
      </div>

      {search.bookmark
        ? (
          <RelationshipsEditorPanel
            bookmarkId={search.bookmark}
            onClear={clear}
          />
        )
        : (
          <Combobox
            options={bookmarkOptions}
            onValueChange={value => value && select(value)}
            placeholder={t("Select a bookmark…")}
            searchPlaceholder={t("Search bookmarks…")}
            emptyText={t("No bookmarks found.")}
            aria-label={t("Bookmark to edit relationships")}
          />
        )}
    </section>
  );
}

function RelationshipsEditorPanel({
  bookmarkId,
  onClear,
}: {
  bookmarkId: string;
  onClear: () => void;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: bookmark, isLoading, error,
  } = useBookmark(bookmarkId);

  if (isLoading) return <p className="text-muted-foreground">{t("Loading bookmark…")}</p>;
  if (error || !bookmark) {
    return <p className="text-destructive">{error?.message ?? t("Bookmark not found.")}</p>;
  }

  return (
    <div className="space-y-4">
      <Badge
        variant="secondary"
        className="gap-1 pr-1"
      >
        {bookmark.title}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-4"
          onClick={onClear}
          aria-label={t("Clear selected bookmark")}
        >
          <X className="size-3" />
        </Button>
      </Badge>

      <BookmarkRelationshipsEditor
        key={bookmarkId}
        bookmarkId={bookmarkId}
        initialRelationships={bookmark.relationships}
        onDone={onClear}
      />
    </div>
  );
}
