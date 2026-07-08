import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, MediaType } from "@eesimple/types";

import i18n from "../../i18n";
import { AutofillRulesList } from "../AutofillRulesList";
import { CardDisplayRulesList } from "../CardDisplayRulesList";
import { EntityAutofillSources } from "../EntityAutofillSources";
import { EntityNamesTabView, PrimaryLanguageTabView } from "../entityNames/EntityNamesTab";
import { GenreMoodAssignmentSection } from "../GenreMoodAssignmentSection";
import {
  MediaTypeDescriptionEdit,
  MediaTypeHiddenEdit,
  MediaTypeIconEdit,
  MediaTypeNameEdit,
  MediaTypeNamesEdit,
  MediaTypeParentEdit,
  MediaTypePrimaryLanguageEdit,
  MediaTypeSortOrderEdit,
} from "../MediaTypeGeneralForm";
import {
  MediaTypeAddedView,
  MediaTypeBookmarksView,
  MediaTypeBuiltInView,
  MediaTypeDescriptionView,
  MediaTypeHierarchyView,
  MediaTypeIconView,
  MediaTypeParentView,
  MediaTypeSlugView,
  MediaTypeSortOrderView,
} from "./mediaTypeViews";

import { useDeleteMediaType, useMediaTypeBySlug, useMediaTypes } from "@/hooks/useMediaTypes";

/**
 * The media-type workbench's field registry (#1106 layout editor). The old single `general` composite
 * is fully atomized (#1189, following the bookmark #1163 reference) into per-field, mode-aware
 * {@link WorkbenchField}s so an operator can place each independently in **Settings → Display → Page
 * Layouts**. No form-context provider is needed (unlike bookmark): each edit field owns its own
 * single-field `useAppForm` + `useFieldAutoSave`, and the sole coupling (name → primary-language sync)
 * coordinates through the react-query cache — the Category precedent. Parity is by construction: `name`
 * / `genreMoods` are **edit-only**; `slug` / `added` / `bookmarks` / `autofillSources` / `hierarchy` are
 * **view-only**; the rest carry both. Authored as an exhaustive `Record<MediaTypeFieldKey, …>` so a key
 * without a renderer fails `tsc`.
 */
type MediaTypeFieldKey
  = | "hidden"
    | "name"
    | "slug"
    | "sortOrder"
    | "description"
    | "primaryLanguage"
    | "names"
    | "parent"
    | "icon"
    | "genreMoods"
    | "autofillSources"
    | "added"
    | "bookmarks"
    | "hierarchy"
    | "autofillRules"
    | "displayRules";

const mediaTypeFields = {
  hidden: {
    key: "hidden",
    label: i18n.t("Built-in / hidden"),
    view: ({
      entity,
    }) => <MediaTypeBuiltInView mediaType={entity} />,
    edit: ({
      entity,
    }) => <MediaTypeHiddenEdit mediaType={entity} />,
  },
  name: {
    key: "name",
    label: i18n.t("Name"),
    edit: ({
      entity,
    }) => <MediaTypeNameEdit mediaType={entity} />,
  },
  slug: {
    key: "slug",
    label: i18n.t("Slug"),
    view: ({
      entity,
    }) => <MediaTypeSlugView mediaType={entity} />,
  },
  sortOrder: {
    key: "sortOrder",
    label: i18n.t("Sort order"),
    view: ({
      entity,
    }) => <MediaTypeSortOrderView mediaType={entity} />,
    edit: ({
      entity,
    }) => <MediaTypeSortOrderEdit mediaType={entity} />,
  },
  description: {
    key: "description",
    label: i18n.t("Description"),
    view: ({
      entity,
    }) => <MediaTypeDescriptionView mediaType={entity} />,
    edit: ({
      entity,
    }) => <MediaTypeDescriptionEdit mediaType={entity} />,
  },
  primaryLanguage: {
    key: "primaryLanguage",
    label: i18n.t("Primary language"),
    view: ({
      entity,
    }) => (
      <PrimaryLanguageTabView
        ownerType="mediaType"
        ownerId={entity.id}
      />
    ),
    edit: ({
      entity,
    }) => <MediaTypePrimaryLanguageEdit mediaType={entity} />,
  },
  names: {
    key: "names",
    label: i18n.t("Names"),
    view: ({
      entity,
    }) => (
      <EntityNamesTabView
        ownerType="mediaType"
        ownerId={entity.id}
      />
    ),
    edit: ({
      entity,
    }) => <MediaTypeNamesEdit mediaType={entity} />,
  },
  parent: {
    key: "parent",
    label: i18n.t("Parent"),
    view: ({
      entity,
    }) => <MediaTypeParentView mediaType={entity} />,
    edit: ({
      entity,
    }) => <MediaTypeParentEdit mediaType={entity} />,
  },
  icon: {
    key: "icon",
    label: i18n.t("Icon"),
    view: ({
      entity,
    }) => <MediaTypeIconView mediaType={entity} />,
    edit: ({
      entity,
    }) => <MediaTypeIconEdit mediaType={entity} />,
  },
  genreMoods: {
    key: "genreMoods",
    label: i18n.t("Genres & moods"),
    edit: ({
      entity,
    }) => (
      <GenreMoodAssignmentSection
        ownerType="mediaType"
        ownerId={entity.id}
      />
    ),
  },
  autofillSources: {
    key: "autofillSources",
    label: i18n.t("Autofill sources"),
    view: ({
      entity,
    }) => (
      <EntityAutofillSources
        match={{
          kind: "media-type",
          mediaTypeId: entity.id,
        }}
      />
    ),
  },
  added: {
    key: "added",
    label: i18n.t("Added"),
    view: ({
      entity,
    }) => <MediaTypeAddedView mediaType={entity} />,
  },
  bookmarks: {
    key: "bookmarks",
    label: i18n.t("Bookmarks"),
    view: ({
      entity,
    }) => <MediaTypeBookmarksView mediaType={entity} />,
  },
  hierarchy: {
    key: "hierarchy",
    label: i18n.t("Hierarchy"),
    view: MediaTypeHierarchyView,
  },
  autofillRules: {
    key: "autofillRules",
    label: i18n.t("Autofill Rules"),
    view: ({
      entity,
    }) => (
      <AutofillRulesList
        mediaTypeId={entity.id}
        query=""
      />
    ),
    edit: ({
      entity,
    }) => (
      <AutofillRulesList
        mediaTypeId={entity.id}
        query=""
      />
    ),
  },
  displayRules: {
    key: "displayRules",
    label: i18n.t("Display Rules"),
    view: ({
      entity,
    }) => <CardDisplayRulesList mediaTypeId={entity.id} />,
    edit: ({
      entity,
    }) => <CardDisplayRulesList mediaTypeId={entity.id} />,
  },
} satisfies Record<MediaTypeFieldKey, WorkbenchField<MediaType>>;

/**
 * The code-defined default layout. The General tab's single section lists every atomized field in one
 * order that resolves sensibly per mode (byte-identity is waived, as for bookmark, since the old view
 * and edit orders differed): the edit-visible subset reproduces the pre-#1189 edit order exactly
 * (Hidden → Name → Sort order → Description → Primary language → Names → Parent → Icon → Genres/moods),
 * and the view-visible subset reads Added → Slug → Built-in → Sort order → Description → Primary
 * language → Names → Parent → Icon → Autofill sources → Bookmarks. Tab keys match the `tabs` array so
 * the "Rules" edit-nav grouping is re-attached by key.
 */
const MEDIA_TYPE_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: [
          "added",
          "slug",
          "hidden",
          "name",
          "sortOrder",
          "description",
          "primaryLanguage",
          "names",
          "parent",
          "icon",
          "genreMoods",
          "autofillSources",
          "bookmarks",
        ] satisfies MediaTypeFieldKey[],
      }],
    },
    {
      key: "hierarchy",
      label: i18n.t("Hierarchy"),
      sections: [{
        key: "hierarchy",
        fields: ["hierarchy"] satisfies MediaTypeFieldKey[],
      }],
    },
    {
      key: "autofill",
      label: i18n.t("Autofill Rules"),
      sections: [{
        key: "autofill",
        fields: ["autofillRules"] satisfies MediaTypeFieldKey[],
      }],
    },
    {
      key: "display-rules",
      label: i18n.t("Display Rules"),
      sections: [{
        key: "display-rules",
        fields: ["displayRules"] satisfies MediaTypeFieldKey[],
      }],
    },
  ],
};

/** Single source of truth for a media type's tabbed view/edit UI (main pane routes + right panel). */
export const mediaTypeWorkbench: EntityWorkbench<MediaType> = {
  useBySlug: (slug) => {
    const {
      mediaType, isLoading,
    } = useMediaTypeBySlug(slug);
    return {
      entity: mediaType,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useMediaTypes();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: mediaType => mediaType.name,
  isBuiltIn: mediaType => mediaType.builtIn,
  canDelete: mediaType => !mediaType.builtIn,
  useDelete: () => {
    const mutation = useDeleteMediaType();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("Media type not found."),
  navAriaLabel: i18n.t("Media type sections"),
  listingPath: "/taxonomies/media-types",
  getSlug: mediaType => mediaType.slug,
  layoutKind: "media-type",
  fields: mediaTypeFields,
  defaultLayout: MEDIA_TYPE_DEFAULT_LAYOUT,
  // Layout-driven: the tab rail + section stacks come from `fields` + `defaultLayout`. `tabs` is
  // retained only to carry the code-only `group` nav metadata (the "Rules" More dropdown on the
  // edit strip), re-attached by tab key in `deriveWorkbenchTabs`.
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
    },
    {
      key: "hierarchy",
      label: i18n.t("Hierarchy"),
    },
    {
      key: "autofill",
      label: i18n.t("Autofill Rules"),
      group: i18n.t("Rules"),
    },
    {
      key: "display-rules",
      label: i18n.t("Display Rules"),
      group: i18n.t("Rules"),
    },
  ],
};
