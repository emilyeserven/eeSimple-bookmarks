import type { EntityWorkbench } from "./types";
import type { MediaType } from "@eesimple/types";

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
  notFound: "Media type not found.",
  navAriaLabel: "Media type sections",
  getSlug: mediaType => mediaType.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Name, sort order, and metadata.",
        render: MediaTypeGeneralView,
      },
      edit: {
        title: "General",
        description: "Name and sort order.",
        render: ({
          entity,
        }) => <MediaTypeGeneralForm mediaType={entity} />,
      },
    },
    {
      key: "hierarchy",
      label: "Hierarchy",
      view: {
        title: "Hierarchy",
        description: "Parent and child media types.",
        render: MediaTypeHierarchyView,
      },
    },
    {
      key: "autofill",
      label: "Autofill Rules",
      view: {
        title: "Autofill Rules",
        description: "Autofill rules that set this media type.",
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
        title: "Autofill Rules",
        description: "Autofill rules that set this media type.",
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
      label: "Display Rules",
      view: {
        title: "Display Rules",
        description: "Card display rules whose conditions reference this media type.",
        render: ({
          entity,
        }) => <CardDisplayRulesList mediaTypeId={entity.id} />,
      },
      edit: {
        title: "Display Rules",
        description: "Card display rules whose conditions reference this media type.",
        render: ({
          entity,
        }) => <CardDisplayRulesList mediaTypeId={entity.id} />,
      },
    },
  ],
};
