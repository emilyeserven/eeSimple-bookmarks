import type { EntityWorkbench } from "./types";
import type { Website } from "@eesimple/types";

import { AutofillRulesList } from "../AutofillRulesList";
import { CardDisplayRulesList } from "../CardDisplayRulesList";
import { ParamRulesList } from "../ParamRulesList";
import { ShortenedLinksList } from "../ShortenedLinksList";
import { WebsiteAuthorsForm, WebsiteAuthorsView } from "../WebsiteAuthorsForm";
import { WebsiteGeneralForm } from "../WebsiteGeneralForm";
import { WebsiteParamRulesForm } from "../WebsiteParamRulesForm";
import { WebsiteShortenedLinksForm } from "../WebsiteShortenedLinksForm";
import { WebsiteGeneralView, WebsiteHierarchyView } from "./websiteViews";

import { useDeleteWebsite, useWebsiteBySlug, useWebsites } from "@/hooks/useWebsites";

/**
 * The single source of truth for a website's tabbed view/edit UI, shared by the main pane routes
 * (`taxonomies.websites.$websiteSlug.*`) and the right panel (`contentTypes/website.tsx`).
 */
export const websiteWorkbench: EntityWorkbench<Website> = {
  useBySlug: (slug) => {
    const {
      website, isLoading,
    } = useWebsiteBySlug(slug);
    return {
      entity: website,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useWebsites();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: website => website.siteName,
  isBuiltIn: website => website.builtIn,
  useDelete: () => {
    const mutation = useDeleteWebsite();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Website not found.",
  navAriaLabel: "Website sections",
  getSlug: website => website.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Domain, creation date, and metadata.",
        render: WebsiteGeneralView,
      },
      edit: {
        title: "General",
        description: "Site name and domain.",
        render: ({
          entity,
        }) => <WebsiteGeneralForm website={entity} />,
      },
    },
    {
      key: "authors",
      label: "Authors",
      view: {
        title: "Authors",
        description: "Authors associated with this website.",
        render: ({
          entity,
        }) => <WebsiteAuthorsView website={entity} />,
      },
      edit: {
        title: "Authors",
        description: "Connect authors to this website.",
        render: ({
          entity,
        }) => <WebsiteAuthorsForm website={entity} />,
      },
    },
    {
      key: "shortened-links",
      label: "Shortened Links",
      view: {
        title: "Shortened Links",
        description: "Short domains that resolve to this site and how they expand.",
        render: ({
          entity,
        }) => (
          <ShortenedLinksList
            links={entity.shortenedLinks}
            emptyText="None configured."
          />
        ),
      },
      edit: {
        title: "Shortened Links",
        description: "Short domains that resolve to this site and how they expand.",
        render: ({
          entity,
        }) => <WebsiteShortenedLinksForm website={entity} />,
      },
    },
    {
      key: "param-rules",
      label: "Param Rules",
      view: {
        title: "Param Rules",
        description: "For matching paths, only these query params are kept; the rest are stripped.",
        render: ({
          entity,
        }) => (
          <ParamRulesList
            rules={entity.paramRules}
            emptyText="None configured."
          />
        ),
      },
      edit: {
        title: "Param Rules",
        description: "Path-scoped query-param whitelist: only listed params are kept, the rest are stripped.",
        render: ({
          entity,
        }) => <WebsiteParamRulesForm website={entity} />,
      },
    },
    {
      key: "hierarchy",
      label: "Hierarchy",
      view: {
        title: "Hierarchy",
        description: "Parent domain and subdomain children.",
        render: WebsiteHierarchyView,
      },
    },
    {
      key: "autofill",
      label: "Autofill Rules",
      view: {
        title: "Autofill Rules",
        description: "Autofill rules whose conditions target this website.",
        render: ({
          entity,
        }) => (
          <AutofillRulesList
            websiteId={entity.id}
            query=""
          />
        ),
      },
      edit: {
        title: "Autofill Rules",
        description: "Autofill rules whose conditions target this website.",
        render: ({
          entity,
        }) => (
          <AutofillRulesList
            websiteId={entity.id}
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
        description: "Card display rules whose conditions reference this website.",
        render: ({
          entity,
        }) => <CardDisplayRulesList websiteId={entity.id} />,
      },
      edit: {
        title: "Display Rules",
        description: "Card display rules whose conditions reference this website.",
        render: ({
          entity,
        }) => <CardDisplayRulesList websiteId={entity.id} />,
      },
    },
  ],
};
