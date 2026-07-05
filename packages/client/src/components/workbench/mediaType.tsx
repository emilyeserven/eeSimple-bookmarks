import type { EntityWorkbench } from "./types";
import type { MediaType } from "@eesimple/types";

import i18n from "../../i18n";
import { AutofillRulesList } from "../AutofillRulesList";
import { CardDisplayRulesList } from "../CardDisplayRulesList";
import { MediaTypeGeneralForm } from "../MediaTypeGeneralForm";
import { MediaTypeGeneralView, MediaTypeHierarchyView } from "./mediaTypeViews";

import { useDeleteMediaType, useMediaTypeBySlug, useMediaTypes } from "@/hooks/useMediaTypes";

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
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      view: {
        title: i18n.t("General"),
        description: i18n.t("Name, sort order, and metadata."),
        render: MediaTypeGeneralView,
      },
      edit: {
        title: i18n.t("General"),
        description: i18n.t("Name and sort order."),
        render: ({
          entity,
        }) => <MediaTypeGeneralForm mediaType={entity} />,
      },
    },
    {
      key: "hierarchy",
      label: i18n.t("Hierarchy"),
      view: {
        title: i18n.t("Hierarchy"),
        description: i18n.t("Parent and child media types."),
        render: MediaTypeHierarchyView,
      },
    },
    {
      key: "autofill",
      label: i18n.t("Autofill Rules"),
      view: {
        title: i18n.t("Autofill Rules"),
        description: i18n.t("Autofill rules that set this media type."),
        render: ({
          entity,
        }) => (
          <AutofillRulesList
            mediaTypeId={entity.id}
            query=""
          />
        ),
      },
      edit: {
        title: i18n.t("Autofill Rules"),
        description: i18n.t("Autofill rules that set this media type."),
        render: ({
          entity,
        }) => (
          <AutofillRulesList
            mediaTypeId={entity.id}
            query=""
          />
        ),
      },
    },
    {
      key: "display-rules",
      label: i18n.t("Display Rules"),
      view: {
        title: i18n.t("Display Rules"),
        description: i18n.t("Card display rules whose conditions reference this media type."),
        render: ({
          entity,
        }) => <CardDisplayRulesList mediaTypeId={entity.id} />,
      },
      edit: {
        title: i18n.t("Display Rules"),
        description: i18n.t("Card display rules whose conditions reference this media type."),
        render: ({
          entity,
        }) => <CardDisplayRulesList mediaTypeId={entity.id} />,
      },
    },
  ],
};
