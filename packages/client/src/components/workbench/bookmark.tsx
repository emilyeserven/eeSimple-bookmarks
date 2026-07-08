import type { EntityWorkbench, WorkbenchField } from "./types";
import type { Bookmark, EntityLayout } from "@eesimple/types";

import {
  BookmarkCategoryDetailView,
  BookmarkChannelDetailView,
  BookmarkCreatedView,
  BookmarkDescriptionDetailView,
  BookmarkHierarchyView,
  BookmarkKavitaDetailView,
  BookmarkLocationsDetailView,
  BookmarkLocationsMapView,
  BookmarkMediaSourceView,
  BookmarkMediaTypeDetailView,
  BookmarkPeopleDetailView,
  BookmarkPlexDetailView,
  BookmarkPriorityView,
  BookmarkRelatedBookmarksView,
  BookmarkTagsDetailView,
  BookmarkWebsiteDetailView,
} from "./bookmarkViewFields";
import { useBookmark } from "../../hooks/useBookmarks";
import i18n from "../../i18n";
import { BookmarkDetailDebug } from "../BookmarkDetailDebug";
import { BookmarkGallery } from "../BookmarkGallery";
import {
  BookmarkCategoryEditField,
  BookmarkDescriptionEditField,
  BookmarkLocationBlacklistEditField,
  BookmarkMediaTypeEditField,
  BookmarkNameEditField,
  BookmarkNamesEditField,
  BookmarkPrimaryLanguageEditField,
  BookmarkTagBlacklistEditField,
  BookmarkTagsEditField,
  BookmarkUrlEditField,
} from "../BookmarkGeneralForm";
import {
  BookmarkImageActionsField,
  BookmarkImageDisplayField,
  BookmarkImagePickerEditField,
  BookmarkScreenshotField,
} from "../BookmarkImageEditForm";
import { bookmarkYouTubeMetadataField, useBookmarkDynamicFields } from "../BookmarkPropertyLayoutFields";
import { BookmarkReelArchivePlayer } from "../BookmarkReelArchive";
import { BookmarkRelatedForm } from "../BookmarkRelatedForm";
import { BookmarkReelCaptureField } from "../BookmarkVideoEditForm";
import { LanguageUsagesTabEditor, LanguageUsagesTabView } from "../languageUsages/LanguageUsagesTab";

/**
 * The bookmark field registry (#1163) — the layout-editor (#1106) replacement for the two hand-kept
 * bookmark surfaces: the opaque `buildBookmarkDetailSections` view and the per-tab edit route quartet.
 * Every view section and every edit tab body becomes a placeable, mode-aware {@link WorkbenchField};
 * the resolved {@link EntityLayout} (see {@link BOOKMARK_DEFAULT_LAYOUT}) arranges them into tabs, and
 * the mode picks the `view`/`edit` renderer, so view/edit parity is by construction. The asymmetric
 * bookmark reconciliation (design §5) falls out of the field split:
 * - `general`/`customProperties`/`languageUsages`/`gallery`/`reel` carry **both** renderers;
 * - `relatedEdit` is **edit-only** and `relatedBookmarks`/`hierarchy`/`mediaSource`/`locationsMap`/
 *   `metadata`/`debugInfo` are **view-only** — so the Related tab shows the four view blocks in view
 *   and the one edit form in edit, and Metadata/Debug vanish in edit (no `edit` renderer).
 *
 * Bookmarks stay **off** `ENTITY_DESCRIPTORS` (they're id-routed, not slug-routed), so this descriptor
 * feeds only `useResolvedWorkbenchLayout` + `LayoutDrivenTabBody`; the id-routed edit view is
 * `BookmarkEditView` and the detail bodies are `BookmarkDetailBody`/`BookmarkDetailTabbed`.
 *
 * Save semantics are untouched — each `edit` renderer wraps the existing form, so General per-field
 * auto-save, the Properties/Languages debounce-persist, and the Image staged Save button are unchanged.
 */
export type BookmarkFieldKey
  = | "name"
    | "primaryLanguage"
    | "names"
    | "url"
    | "description"
    | "category"
    | "mediaType"
    | "tags"
    | "locationsBox"
    | "channel"
    | "people"
    | "kavitaLink"
    | "plexLink"
    | "tagBlacklist"
    | "locationBlacklist"
    | "youtubeMetadata"
    | "languageUsages"
    | "imagePicker"
    | "imageActions"
    | "imageDisplay"
    | "screenshot"
    | "reelCapture"
    | "reelPlayer"
    | "relatedEdit"
    | "relatedBookmarks"
    | "hierarchy"
    | "mediaSource"
    | "locationsMap"
    | "priority"
    | "createdAt"
    | "debugInfo";

const bookmarkFields = {
  name: {
    key: "name",
    label: i18n.t("Name"),
    edit: () => <BookmarkNameEditField />,
  },
  primaryLanguage: {
    key: "primaryLanguage",
    label: i18n.t("Primary language"),
    edit: () => <BookmarkPrimaryLanguageEditField />,
  },
  names: {
    key: "names",
    label: i18n.t("Names"),
    edit: ({
      entity,
    }) => <BookmarkNamesEditField bookmark={entity} />,
  },
  url: {
    key: "url",
    label: i18n.t("URL"),
    view: ({
      entity,
    }) => <BookmarkWebsiteDetailView bookmark={entity} />,
    edit: ({
      entity,
    }) => <BookmarkUrlEditField bookmark={entity} />,
  },
  description: {
    key: "description",
    label: i18n.t("Description"),
    view: ({
      entity,
    }) => <BookmarkDescriptionDetailView bookmark={entity} />,
    edit: () => <BookmarkDescriptionEditField />,
  },
  category: {
    key: "category",
    label: i18n.t("Category"),
    view: ({
      entity,
    }) => <BookmarkCategoryDetailView bookmark={entity} />,
    edit: () => <BookmarkCategoryEditField />,
  },
  mediaType: {
    key: "mediaType",
    label: i18n.t("Media type"),
    view: ({
      entity,
    }) => <BookmarkMediaTypeDetailView bookmark={entity} />,
    edit: () => <BookmarkMediaTypeEditField />,
  },
  tags: {
    key: "tags",
    label: i18n.t("Tags"),
    view: ({
      entity,
    }) => <BookmarkTagsDetailView bookmark={entity} />,
    edit: () => <BookmarkTagsEditField />,
  },
  locationsBox: {
    key: "locationsBox",
    label: i18n.t("Locations"),
    view: ({
      entity,
    }) => <BookmarkLocationsDetailView bookmark={entity} />,
  },
  channel: {
    key: "channel",
    label: i18n.t("Channel"),
    view: ({
      entity,
    }) => <BookmarkChannelDetailView bookmark={entity} />,
  },
  people: {
    key: "people",
    label: i18n.t("People"),
    view: ({
      entity,
    }) => <BookmarkPeopleDetailView bookmark={entity} />,
  },
  kavitaLink: {
    key: "kavitaLink",
    label: i18n.t("Kavita"),
    view: ({
      entity,
    }) => <BookmarkKavitaDetailView bookmark={entity} />,
  },
  plexLink: {
    key: "plexLink",
    label: i18n.t("Plex"),
    view: ({
      entity,
    }) => <BookmarkPlexDetailView bookmark={entity} />,
  },
  tagBlacklist: {
    key: "tagBlacklist",
    label: i18n.t("Tag blacklist"),
    edit: () => <BookmarkTagBlacklistEditField />,
  },
  locationBlacklist: {
    key: "locationBlacklist",
    label: i18n.t("Location blacklist"),
    edit: () => <BookmarkLocationBlacklistEditField />,
  },
  youtubeMetadata: bookmarkYouTubeMetadataField,
  languageUsages: {
    key: "languageUsages",
    label: i18n.t("Languages"),
    view: ({
      entity,
    }) => (
      <LanguageUsagesTabView
        ownerType="bookmark"
        ownerId={entity.id}
      />
    ),
    edit: ({
      entity,
    }) => (
      <LanguageUsagesTabEditor
        ownerType="bookmark"
        ownerId={entity.id}
        kind="availability"
      />
    ),
  },
  imagePicker: {
    key: "imagePicker",
    label: i18n.t("Image"),
    view: ({
      entity,
    }) => <BookmarkGallery bookmark={entity} />,
    edit: ({
      entity,
    }) => <BookmarkImagePickerEditField bookmark={entity} />,
  },
  imageActions: {
    key: "imageActions",
    label: i18n.t("Image actions"),
    edit: ({
      entity,
    }) => <BookmarkImageActionsField bookmark={entity} />,
  },
  imageDisplay: {
    key: "imageDisplay",
    label: i18n.t("Cover image display"),
    edit: ({
      entity,
    }) => <BookmarkImageDisplayField bookmark={entity} />,
  },
  screenshot: {
    key: "screenshot",
    label: i18n.t("Page screenshot"),
    edit: ({
      entity,
    }) => <BookmarkScreenshotField bookmark={entity} />,
  },
  reelCapture: {
    key: "reelCapture",
    label: i18n.t("Archive reel"),
    edit: ({
      entity,
    }) => <BookmarkReelCaptureField bookmark={entity} />,
  },
  reelPlayer: {
    key: "reelPlayer",
    label: i18n.t("Video"),
    view: ({
      entity,
    }) => <BookmarkReelArchivePlayer bookmark={entity} />,
    edit: ({
      entity,
    }) => <BookmarkReelArchivePlayer bookmark={entity} />,
  },
  relatedEdit: {
    key: "relatedEdit",
    label: i18n.t("Related"),
    edit: ({
      entity,
    }) => <BookmarkRelatedForm bookmark={entity} />,
  },
  relatedBookmarks: {
    key: "relatedBookmarks",
    label: i18n.t("Related bookmarks"),
    view: ({
      entity,
    }) => <BookmarkRelatedBookmarksView bookmark={entity} />,
  },
  hierarchy: {
    key: "hierarchy",
    label: i18n.t("Hierarchy"),
    view: ({
      entity,
    }) => <BookmarkHierarchyView bookmark={entity} />,
  },
  mediaSource: {
    key: "mediaSource",
    label: i18n.t("Shared media source"),
    view: ({
      entity,
    }) => <BookmarkMediaSourceView bookmark={entity} />,
  },
  locationsMap: {
    key: "locationsMap",
    label: i18n.t("Locations"),
    view: ({
      entity,
    }) => <BookmarkLocationsMapView bookmark={entity} />,
  },
  priority: {
    key: "priority",
    label: i18n.t("Priority"),
    view: ({
      entity,
    }) => <BookmarkPriorityView bookmark={entity} />,
  },
  createdAt: {
    key: "createdAt",
    label: i18n.t("Created"),
    view: ({
      entity,
    }) => <BookmarkCreatedView bookmark={entity} />,
  },
  debugInfo: {
    key: "debugInfo",
    label: i18n.t("Debug"),
    view: ({
      entity,
    }) => (
      <BookmarkDetailDebug
        bookmark={entity}
        showHeading={false}
      />
    ),
  },
} satisfies Record<BookmarkFieldKey, WorkbenchField<Bookmark>>;

/**
 * The code-defined default layout. Order is chosen so the **default single-column detail page** (the
 * default `bookmarkDetailLayout` pref) stays closest to today: General, then the two blocks that used
 * to live inline in the General view (Properties, Languages), then Image/Video/Related/Metadata/Debug
 * with the old Locations map folded into Related. Byte-identical is waived for bookmarks (design §7-A)
 * since one unified layout can't match the two asymmetric surfaces; the edit strip reorders but each
 * tab's content is unchanged. One untitled section per tab; each tab's content provides its own heading.
 */
const BOOKMARK_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [
        {
          key: "general",
          fields: ["name", "primaryLanguage", "names", "url", "description", "category", "mediaType", "tags", "locationsBox", "channel", "people", "kavitaLink", "plexLink"] satisfies BookmarkFieldKey[],
        },
        {
          key: "advanced",
          title: i18n.t("Advanced"),
          fields: ["tagBlacklist", "locationBlacklist"] satisfies BookmarkFieldKey[],
        },
      ],
    },
    {
      key: "properties",
      label: i18n.t("Properties"),
      sections: [{
        key: "properties",
        // The static YouTube-metadata field; each enabled custom property is a **dynamic** field
        // (`useBookmarkDynamicFields`) whose default home is this section (appended by the engine).
        fields: ["youtubeMetadata"] satisfies BookmarkFieldKey[],
      }],
    },
    {
      key: "languages",
      label: i18n.t("Languages"),
      sections: [{
        key: "languages",
        fields: ["languageUsages"] satisfies BookmarkFieldKey[],
      }],
    },
    {
      key: "image",
      label: i18n.t("Image"),
      sections: [{
        key: "image",
        fields: ["imagePicker", "imageActions", "imageDisplay", "screenshot"] satisfies BookmarkFieldKey[],
      }],
    },
    {
      key: "video",
      label: i18n.t("Video"),
      sections: [{
        key: "video",
        fields: ["reelCapture", "reelPlayer"] satisfies BookmarkFieldKey[],
      }],
    },
    {
      key: "related",
      label: i18n.t("Related"),
      sections: [{
        key: "related",
        fields: ["relatedEdit", "relatedBookmarks", "hierarchy", "mediaSource", "locationsMap"] satisfies BookmarkFieldKey[],
      }],
    },
    {
      key: "metadata",
      label: i18n.t("Metadata"),
      sections: [{
        key: "metadata",
        title: i18n.t("Metadata"),
        fields: ["priority", "createdAt"] satisfies BookmarkFieldKey[],
      }],
    },
    {
      key: "debug",
      label: i18n.t("Debug"),
      sections: [{
        key: "debug",
        fields: ["debugInfo"] satisfies BookmarkFieldKey[],
      }],
    },
  ],
};

/**
 * The single source of truth for a bookmark's layout-driven view/edit UI. Unlike the slug-routed
 * workbench entities, bookmarks are **id-routed** and stay off `ENTITY_DESCRIPTORS`, so `useBySlug`/
 * `useById` both resolve by id (via {@link useBookmark}) and `useDelete` is `null` — the bookmark edit
 * Delete lives in a bespoke danger-zone fixture in `BookmarkEditView`, not the workbench control. Only
 * `layoutKind`/`fields`/`defaultLayout` are consumed (by `useResolvedWorkbenchLayout` + the render
 * seam); the thin `tabs` array satisfies the descriptor type (no `group` — bookmarks have no dropdown).
 */
export const bookmarkWorkbench: EntityWorkbench<Bookmark> = {
  useBySlug: (id) => {
    const {
      data, isLoading,
    } = useBookmark(id);
    return {
      entity: data,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useBookmark(id);
    return {
      entity: data,
      isLoading,
      error,
    };
  },
  name: bookmark => bookmark.title,
  useDelete: () => null,
  notFound: i18n.t("Bookmark not found."),
  navAriaLabel: i18n.t("Bookmark sections"),
  getSlug: bookmark => bookmark.id,
  layoutKind: "bookmark",
  fields: bookmarkFields,
  // Each enabled custom property is a placeable field keyed by its id (#1163+), merged in by
  // `useLayoutDrivenWorkbench` and given a home in the Properties tab via `augmentDefaultLayout`.
  useDynamicFields: useBookmarkDynamicFields,
  defaultLayout: BOOKMARK_DEFAULT_LAYOUT,
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
    },
    {
      key: "properties",
      label: i18n.t("Properties"),
    },
    {
      key: "languages",
      label: i18n.t("Languages"),
    },
    {
      key: "image",
      label: i18n.t("Image"),
    },
    {
      key: "video",
      label: i18n.t("Video"),
    },
    {
      key: "related",
      label: i18n.t("Related"),
    },
    {
      key: "metadata",
      label: i18n.t("Metadata"),
    },
    {
      key: "debug",
      label: i18n.t("Debug"),
    },
  ],
};
