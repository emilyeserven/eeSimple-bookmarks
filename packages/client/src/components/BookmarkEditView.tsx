import type { Bookmark } from "@eesimple/types";
import type { ReactNode } from "react";

import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BookmarkGeneralFormProvider } from "./BookmarkGeneralFormContext";
import { TabbedShell, navLinkClass } from "./TabbedShell";
import { bookmarkWorkbench } from "./workbench/bookmark";
import { LayoutDrivenTabBody } from "./workbench/LayoutDrivenTabBody";
import { useBookmark, useDeleteBookmark } from "../hooks/useBookmarks";
import { useCategories } from "../hooks/useCategories";

/**
 * The General-tab edit fields that read the shared `useBookmarkGeneralForm` controller from
 * {@link BookmarkGeneralFormProvider}. When the active tab hosts any of these, the edit body is wrapped
 * in the provider so the one controller (+ its "Sync from source" registration) mounts exactly where the
 * old `BookmarkGeneralForm` did — and follows the fields if an operator relocates them via Page Layouts.
 */
const SHARED_FORM_FIELD_KEYS = new Set<string>([
  "name",
  "primaryLanguage",
  "url",
  "description",
  "category",
  "mediaType",
  "tags",
  "tagBlacklist",
  "locationBlacklist",
]);

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useResolvedWorkbenchLayout } from "@/hooks/useEntityLayout";
import { cn } from "@/lib/utils";
import { deriveWorkbenchTabs } from "@/lib/workbenchLayout";

/**
 * The bottom "Danger zone" Delete row on the bookmark edit General tab — the bookmark analogue of the
 * `WorkbenchRouteTab` danger-zone fixture (bookmarks are id-routed and off `ENTITY_DESCRIPTORS`, so the
 * generic fixture doesn't apply). On success it navigates to the bookmark's category page, or the
 * bookmarks list when the category is unknown — identical to the old `edit.general` route.
 */
function BookmarkDeleteDangerZone({
  bookmark,
}: {
  bookmark: Bookmark;
}) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const {
    data: categories,
  } = useCategories();
  const deleteBookmark = useDeleteBookmark();

  function handleDelete() {
    deleteBookmark.mutate(bookmark.id, {
      onSuccess: () => {
        const slug = (categories ?? []).find(c => c.id === bookmark.categoryId)?.slug;
        void (slug
          ? navigate({
            to: "/categories/$categorySlug",
            params: {
              categorySlug: slug,
            },
          })
          : navigate({
            to: "/bookmarks",
          }));
      },
    });
  }

  return (
    <>
      <Separator />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{t("Delete bookmark")}</p>
          <p className="text-sm text-muted-foreground">{t("This action cannot be undone.")}</p>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleteBookmark.isPending}
        >
          {t("Delete")}
        </Button>
      </div>
    </>
  );
}

interface Props {
  bookmarkId: string;
  /** The active tab key from the `?tab=` search param, or undefined to fall back to the first tab. */
  activeTab: string | undefined;
  /** The page heading (back-link + `<h1>`). */
  header: ReactNode;
}

/**
 * The bookmark **Edit** page — the id-routed mirror of {@link import("./workbench/EntityEditView").EntityEditView}.
 * A horizontal `TabbedShell` strip derives from the resolved `"bookmark"` layout's **edit** tabs and the
 * active tab is the `?tab=` search param, so there is a single `…/$bookmarkId/edit` route instead of one
 * file per tab. Each tab body is `LayoutDrivenTabBody` (`mode="edit"`), so every edit form — and its save
 * semantics (General per-field auto-save, Properties/Languages debounce, the Image staged Save button) —
 * is unchanged; the General tab keeps its bespoke Delete danger zone.
 */
export function BookmarkEditView({
  bookmarkId, activeTab, header,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    data: bookmark, isLoading,
  } = useBookmark(bookmarkId);

  const layout = useResolvedWorkbenchLayout(bookmarkWorkbench);
  const tabs = deriveWorkbenchTabs(bookmarkWorkbench, layout, "edit", bookmark);
  const active = tabs.find(tab => tab.key === activeTab)?.key ?? tabs[0]?.key;

  const nav = tabs.length <= 1
    ? null
    : tabs.map(tab => (
      <Link
        key={tab.key}
        to="/bookmarks/$bookmarkId/edit"
        params={{
          bookmarkId,
        }}
        search={{
          tab: tab.key,
        }}
        className={cn(navLinkClass, tab.key === active && `
          bg-accent text-accent-foreground
        `)}
      >
        {tab.label}
      </Link>
    ));

  function body(): ReactNode {
    if (isLoading) return <p className="text-muted-foreground">{t("Loading bookmark…")}</p>;
    if (!bookmark) return <p className="text-destructive">{t("Bookmark not found.")}</p>;
    if (!layout || !active) return null;
    const activeTab = layout.tabs.find(tab => tab.key === active);
    const hasSharedFormField = activeTab?.sections.some(
      section => section.fields.some(field => SHARED_FORM_FIELD_KEYS.has(field)),
    ) ?? false;
    const tabBody = (
      <LayoutDrivenTabBody
        workbench={bookmarkWorkbench}
        layout={layout}
        tabKey={active}
        mode="edit"
        entity={bookmark}
      />
    );
    return (
      <>
        {hasSharedFormField
          ? <BookmarkGeneralFormProvider bookmark={bookmark}>{tabBody}</BookmarkGeneralFormProvider>
          : tabBody}
        {active === "general" ? <BookmarkDeleteDangerZone bookmark={bookmark} /> : null}
      </>
    );
  }

  return (
    <TabbedShell
      header={header}
      nav={nav}
      navAriaLabel={bookmarkWorkbench.navAriaLabel}
    >
      {body()}
    </TabbedShell>
  );
}
