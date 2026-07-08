import type { Bookmark } from "@eesimple/types";
import type { ReactNode } from "react";

import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BookmarkGeneralFormProvider } from "./BookmarkGeneralFormContext";
import { BookmarkImageEditFormProvider } from "./BookmarkImageEditFormContext";
import { BookmarkPropertiesFormProvider } from "./BookmarkPropertiesFormContext";
import { TabbedShell, navLinkClass } from "./TabbedShell";
import { bookmarkWorkbench } from "./workbench/bookmark";
import { LayoutDrivenTabBody } from "./workbench/LayoutDrivenTabBody";
import { useBookmark, useDeleteBookmark } from "../hooks/useBookmarks";
import { useBookmarkSectionVisibility } from "../hooks/useBookmarkSectionVisibility";
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

/**
 * The static bookmark field keys. Any field key on a resolved layout tab that is **not** here is a
 * dynamic custom-property field (keyed by property id, #1163+), which — like the static
 * `youtubeMetadata` field — reads the shared `useBookmarkPropertiesForm` controller and so needs the
 * `BookmarkPropertiesFormProvider` mounted around the edit body.
 */
const STATIC_FIELD_KEYS = new Set<string>(Object.keys(bookmarkWorkbench.fields ?? {}));

/** The Image-tab fields that read the shared `useBookmarkImageEditForm` controller from context. */
const IMAGE_FIELD_KEYS = new Set<string>([
  "imagePicker",
  "imageActions",
  "imageDisplay",
  "screenshot",
]);

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLayoutDrivenWorkbench, useResolvedWorkbenchLayout } from "@/hooks/useEntityLayout";
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

  // Route through the dynamic-field merge seam so per-property fields (#1163+) resolve + render.
  const workbench = useLayoutDrivenWorkbench(bookmarkWorkbench);
  const layout = useResolvedWorkbenchLayout(workbench);
  const sectionMatches = useBookmarkSectionVisibility(bookmark);
  const tabs = deriveWorkbenchTabs(workbench, layout, "edit", bookmark, sectionMatches);
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
    const tabFieldKeys = activeTab?.sections.flatMap(section => section.fields) ?? [];
    const hasSharedFormField = tabFieldKeys.some(field => SHARED_FORM_FIELD_KEYS.has(field));
    // A property field is the static `youtubeMetadata` or any dynamic (non-static) custom-property key;
    // both read the shared properties controller, so mount its provider around the body.
    const hasPropertyField = tabFieldKeys.some(field => field === "youtubeMetadata" || !STATIC_FIELD_KEYS.has(field));
    const hasImageField = tabFieldKeys.some(field => IMAGE_FIELD_KEYS.has(field));

    let body: ReactNode = (
      <LayoutDrivenTabBody
        workbench={workbench}
        layout={layout}
        tabKey={active}
        mode="edit"
        entity={bookmark}
        sectionMatches={sectionMatches}
      />
    );
    if (hasSharedFormField) {
      body = <BookmarkGeneralFormProvider bookmark={bookmark}>{body}</BookmarkGeneralFormProvider>;
    }
    if (hasPropertyField) {
      body = <BookmarkPropertiesFormProvider bookmark={bookmark}>{body}</BookmarkPropertiesFormProvider>;
    }
    if (hasImageField) {
      body = <BookmarkImageEditFormProvider bookmark={bookmark}>{body}</BookmarkImageEditFormProvider>;
    }
    return (
      <>
        {body}
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
