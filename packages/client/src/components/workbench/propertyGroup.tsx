/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { PropertyGroup } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import i18n from "../../i18n";
import { CardDisplayRulesList } from "../CardDisplayRulesList";
import { PropertyGroupGeneralForm } from "../PropertyGroupGeneralForm";
import { PropertyGroupCategoriesEditForm, PropertyGroupMediaTypesEditForm } from "../PropertyGroupScopeEditForms";

import { Badge } from "@/components/ui/badge";
import { useCategories } from "@/hooks/useCategories";
import { useMediaTypes } from "@/hooks/useMediaTypes";
import { useDeletePropertyGroup, usePropertyGroupBySlug, usePropertyGroups } from "@/hooks/usePropertyGroups";
import { CategoryIcon } from "@/lib/icons";

/** Read-only "Categories" scope body: which categories show this group. Empty (or "all") = every category. */
function PropertyGroupCategoriesView({
  entity: group,
}: {
  entity: PropertyGroup;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: categories,
  } = useCategories();
  if (group.allCategories || group.categoryIds.length === 0) {
    return <Badge variant="secondary">{t("All categories")}</Badge>;
  }
  const assigned = (categories ?? []).filter(category => group.categoryIds.includes(category.id));
  return (
    <ul className="flex flex-wrap gap-1">
      {assigned.map(category => (
        <li key={category.id}>
          <Badge
            variant="secondary"
            className="gap-1.5"
          >
            <CategoryIcon
              name={category.icon}
              className="size-3.5"
            />
            {category.name}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

/** Read-only "Media Types" scope body: the media types this group is additionally shown on. */
function PropertyGroupMediaTypesView({
  entity: group,
}: {
  entity: PropertyGroup;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: mediaTypes,
  } = useMediaTypes();
  if (group.allMediaTypes) return <Badge variant="secondary">{t("All media types")}</Badge>;
  const assigned = (mediaTypes ?? []).filter(mt => group.mediaTypeIds.includes(mt.id));
  if (assigned.length === 0) {
    return <span className="text-sm text-muted-foreground">{t("None")}</span>;
  }
  return (
    <ul className="flex flex-wrap gap-1">
      {assigned.map(mt => (
        <li key={mt.id}>
          <Badge variant="secondary">{mt.name}</Badge>
        </li>
      ))}
    </ul>
  );
}

/** Editable "Categories" scope tab: loads the category list and delegates to the scope form. */
function PropertyGroupCategoriesEdit({
  entity: group,
}: {
  entity: PropertyGroup;
}) {
  const {
    data: categories,
  } = useCategories();
  return (
    <PropertyGroupCategoriesEditForm
      group={group}
      categories={categories ?? []}
    />
  );
}

/** Editable "Media Types" scope tab: loads the media-type list and delegates to the scope form. */
function PropertyGroupMediaTypesEdit({
  entity: group,
}: {
  entity: PropertyGroup;
}) {
  const {
    data: mediaTypes,
  } = useMediaTypes();
  return (
    <PropertyGroupMediaTypesEditForm
      group={group}
      mediaTypes={mediaTypes ?? []}
    />
  );
}

function PropertyGroupGeneralView({
  entity: group,
}: {
  entity: PropertyGroup;
}) {
  return (
    <div className="space-y-4">
      {group.description
        ? <p className="text-sm text-muted-foreground">{group.description}</p>
        : null}
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{i18n.t("Added")}</dt>
        <dd>{new Date(group.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">{i18n.t("Slug")}</dt>
        <dd className="font-mono">{group.slug}</dd>
        <dt className="text-muted-foreground">{i18n.t("Priority")}</dt>
        <dd>{group.priority}</dd>
        {group.propertyCount != null
          ? (
            <>
              <dt className="text-muted-foreground">{i18n.t("Properties")}</dt>
              <dd>{group.propertyCount}</dd>
            </>
          )
          : null}
      </dl>
    </div>
  );
}

/** Single source of truth for a property group's view/edit UI (main pane routes + right panel). */
export const propertyGroupWorkbench: EntityWorkbench<PropertyGroup> = {
  useBySlug: (slug) => {
    const {
      propertyGroup, isLoading,
    } = usePropertyGroupBySlug(slug);
    return {
      entity: propertyGroup,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = usePropertyGroups();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: group => group.name,
  useDelete: () => {
    const mutation = useDeletePropertyGroup();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("Property group not found."),
  navAriaLabel: i18n.t("Property group sections"),
  listingPath: "/taxonomies/property-groups",
  getSlug: group => group.slug,
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      view: {
        title: i18n.t("General"),
        description: i18n.t("Name, priority, description, and metadata."),
        render: PropertyGroupGeneralView,
      },
      edit: {
        title: i18n.t("General"),
        description: i18n.t("Name, priority, and description."),
        render: ({
          entity,
        }) => <PropertyGroupGeneralForm group={entity} />,
      },
    },
    {
      key: "categories",
      label: i18n.t("Categories"),
      view: {
        title: i18n.t("Categories"),
        description: i18n.t("The categories that show this group on the bookmark form."),
        render: PropertyGroupCategoriesView,
      },
      edit: {
        title: i18n.t("Categories"),
        description: i18n.t("Choose which categories show this group on the bookmark form. Leave empty to show it for every category."),
        render: PropertyGroupCategoriesEdit,
      },
    },
    {
      key: "media-types",
      label: i18n.t("Media Types"),
      view: {
        title: i18n.t("Media Types"),
        description: i18n.t("The media types this group is also shown on."),
        render: PropertyGroupMediaTypesView,
      },
      edit: {
        title: i18n.t("Media Types"),
        description: i18n.t("Also show this group on bookmarks of the chosen media types (in addition to its categories)."),
        render: PropertyGroupMediaTypesEdit,
      },
    },
    {
      key: "display-rules",
      label: i18n.t("Display Rules"),
      view: {
        title: i18n.t("Display Rules"),
        description: i18n.t("Card display rules whose conditions reference this group's properties."),
        render: ({
          entity,
        }) => <CardDisplayRulesList propertyGroupId={entity.id} />,
      },
      edit: {
        title: i18n.t("Display Rules"),
        description: i18n.t("Card display rules whose conditions reference this group's properties."),
        render: ({
          entity,
        }) => <CardDisplayRulesList propertyGroupId={entity.id} />,
      },
    },
  ],
};
