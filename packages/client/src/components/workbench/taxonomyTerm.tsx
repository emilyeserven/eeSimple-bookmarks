import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, Taxonomy, TaxonomyTermNode } from "@eesimple/types";
import type { LinkProps } from "@tanstack/react-router";

import { taxonomyTermLayoutKind } from "@eesimple/types";

import { buildTaxonomyTermHierarchyView, buildTaxonomyTermStatsView } from "./taxonomyTermViews";
import { useDeleteTaxonomyTerm, useTaxonomyTermBySlug, useTaxonomyTermTree } from "../../hooks/useTaxonomies";
import i18n from "../../i18n";
import { flattenTree } from "../../lib/tagTree";
import { EntityNamesTabView, PrimaryLanguageTabView } from "../entityNames/EntityNamesTab";
import { TaxonomyAssignmentSection } from "../TaxonomyAssignmentSection";
import {
  TaxonomyTermDescriptionField,
  TaxonomyTermNameField,
  TaxonomyTermNamesEdit,
  TaxonomyTermParentField,
  TaxonomyTermPrimaryLanguageEdit,
} from "../TaxonomyTermGeneralForm";

/**
 * The generic taxonomy-term workbench's field registry, parametrized by the owning {@link Taxonomy}
 * (there can be any number of user-created taxonomies, unlike the single hand-built Genres & Moods
 * workbench this mirrors — `components/workbench/genreMood.tsx`).
 */
type TaxonomyTermFieldKey
  = | "name"
    | "description"
    | "stats"
    | "primaryLanguage"
    | "names"
    | "parent"
    | "relatedTerms"
    | "hierarchy";

/** Builds the field registry + default layout + full workbench for one taxonomy's terms. */
export function buildTaxonomyTermWorkbench(taxonomy: Taxonomy): EntityWorkbench<TaxonomyTermNode> {
  const fields = {
    name: {
      key: "name",
      label: i18n.t("Name"),
      edit: ({
        entity,
      }) => (
        <TaxonomyTermNameField
          taxonomy={taxonomy}
          node={entity}
        />
      ),
    },
    description: {
      key: "description",
      label: i18n.t("Description"),
      edit: ({
        entity,
      }) => (
        <TaxonomyTermDescriptionField
          taxonomy={taxonomy}
          node={entity}
        />
      ),
    },
    stats: {
      key: "stats",
      label: i18n.t("General"),
      view: buildTaxonomyTermStatsView(taxonomy),
    },
    primaryLanguage: {
      key: "primaryLanguage",
      label: i18n.t("Primary language"),
      view: ({
        entity,
      }) => (
        <PrimaryLanguageTabView
          ownerType="taxonomyTerm"
          ownerId={entity.id}
        />
      ),
      edit: ({
        entity,
      }) => (
        <TaxonomyTermPrimaryLanguageEdit
          taxonomy={taxonomy}
          node={entity}
        />
      ),
    },
    names: {
      key: "names",
      label: i18n.t("Names"),
      view: ({
        entity,
      }) => (
        <EntityNamesTabView
          ownerType="taxonomyTerm"
          ownerId={entity.id}
        />
      ),
      edit: ({
        entity,
      }) => (
        <TaxonomyTermNamesEdit
          taxonomy={taxonomy}
          node={entity}
        />
      ),
    },
    parent: {
      key: "parent",
      label: i18n.t("Parent"),
      edit: ({
        entity,
      }) => (
        <TaxonomyTermParentField
          taxonomy={taxonomy}
          node={entity}
        />
      ),
      showIf: () => taxonomy.hierarchical,
    },
    relatedTerms: {
      key: "relatedTerms",
      label: i18n.t("Related {{name}}", {
        name: taxonomy.name,
      }),
      edit: ({
        entity,
      }) => (
        <TaxonomyAssignmentSection
          taxonomy={taxonomy}
          ownerType="taxonomy"
          ownerId={entity.id}
          excludeId={entity.id}
          title={i18n.t("Related {{name}}", {
            name: taxonomy.name,
          })}
          description={i18n.t("Other {{name}} terms associated with this one.", {
            name: taxonomy.name,
          })}
        />
      ),
    },
    hierarchy: {
      key: "hierarchy",
      label: i18n.t("Hierarchy"),
      view: buildTaxonomyTermHierarchyView(taxonomy),
      showIf: () => taxonomy.hierarchical,
    },
  } satisfies Record<TaxonomyTermFieldKey, WorkbenchField<TaxonomyTermNode>>;

  const generalFields: TaxonomyTermFieldKey[] = [
    "name",
    "description",
    "stats",
    "primaryLanguage",
    "names",
    ...(taxonomy.hierarchical ? (["parent"] as const) : []),
    "relatedTerms",
  ];

  const tabs: EntityLayout["tabs"] = [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: generalFields,
      }],
    },
    ...(taxonomy.hierarchical
      ? [{
        key: "hierarchy",
        label: i18n.t("Hierarchy"),
        sections: [{
          key: "hierarchy",
          fields: ["hierarchy"] satisfies TaxonomyTermFieldKey[],
        }],
      }]
      : []),
  ];

  const defaultLayout: EntityLayout = {
    tabs,
  };

  return {
    useBySlug: (slug) => {
      const {
        term, isLoading,
      } = useTaxonomyTermBySlug(taxonomy.id, slug);
      return {
        entity: term,
        isLoading,
      };
    },
    useById: (id) => {
      const {
        data, isLoading, error,
      } = useTaxonomyTermTree(taxonomy.id);
      return {
        entity: flattenTree(data ?? []).find(item => item.node.id === id)?.node,
        isLoading,
        error,
      };
    },
    name: node => node.name,
    useDelete: () => {
      const mutation = useDeleteTaxonomyTerm(taxonomy.id);
      return {
        isPending: mutation.isPending,
        error: mutation.isError ? mutation.error.message : null,
        run: (id, onDeleted) => mutation.mutate(id, {
          onSuccess: onDeleted,
        }),
      };
    },
    notFound: i18n.t("Term not found."),
    navAriaLabel: i18n.t("{{name}} sections", {
      name: taxonomy.name,
    }),
    listingPath: `/taxonomies/${taxonomy.slug}` as LinkProps["to"],
    getSlug: node => node.slug,
    layoutKind: taxonomyTermLayoutKind(taxonomy),
    fields,
    defaultLayout,
    // Layout-driven: the body comes from `fields` + `defaultLayout`. `tabs` is a thin placeholder
    // retained only for the descriptor's type requirement (no `group` nav metadata needed here).
    tabs: tabs.map(tab => ({
      key: tab.key,
      label: tab.label,
    })),
  };
}
