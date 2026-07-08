import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, MediaType } from "@eesimple/types";

import i18n from "../../i18n";
import { AutofillRulesList } from "../AutofillRulesList";
import { CardDisplayRulesList } from "../CardDisplayRulesList";
import { MediaTypeGeneralForm } from "../MediaTypeGeneralForm";
import { MediaTypeGeneralView, MediaTypeHierarchyView } from "./mediaTypeViews";

import { useDeleteMediaType, useMediaTypeBySlug, useMediaTypes } from "@/hooks/useMediaTypes";

/**
 * The media-type workbench's field registry (#1106 layout editor). Each existing tab pane becomes
 * ONE placeable, mode-aware {@link WorkbenchField} keyed by the tab's own key (#1165 composite-editor
 * recipe): `general` bundles the existing view/edit composites unchanged, and `hierarchy` is
 * **view-only** (no `edit`), which is what makes the Hierarchy tab disappear in edit mode for free.
 * Authored as an exhaustive `Record<MediaTypeFieldKey, …>` so a key without a renderer fails `tsc`.
 */
type MediaTypeFieldKey
  = | "general"
    | "hierarchy"
    | "autofillRules"
    | "displayRules";

const mediaTypeFields = {
  general: {
    key: "general",
    label: i18n.t("General"),
    view: MediaTypeGeneralView,
    edit: ({
      entity,
    }) => <MediaTypeGeneralForm mediaType={entity} />,
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

/** The code-defined default layout — the current tab list, one untitled section per tab. */
const MEDIA_TYPE_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["general"] satisfies MediaTypeFieldKey[],
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
