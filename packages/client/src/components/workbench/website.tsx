import type { EntityWorkbench } from "./types";
import type { Website } from "@eesimple/types";

import i18n from "../../i18n";
import { AutofillRulesList } from "../AutofillRulesList";
import { CardDisplayRulesList } from "../CardDisplayRulesList";
import { LanguageUsagesTabEditor, LanguageUsagesTabView } from "../languageUsages/LanguageUsagesTab";
import { ParamRulesList } from "../ParamRulesList";
import { ShortenedLinksList } from "../ShortenedLinksList";
import { WebsiteGeneralForm } from "../WebsiteGeneralForm";
import { WebsiteParamRulesForm } from "../WebsiteParamRulesForm";
import { WebsitePeopleForm, WebsitePeopleView } from "../WebsitePeopleForm";
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
  notFound: i18n.t("Website not found."),
  navAriaLabel: i18n.t("Website sections"),
  listingPath: "/taxonomies/websites",
  getSlug: website => website.slug,
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      view: {
        title: i18n.t("General"),
        description: i18n.t("Domain, creation date, and metadata."),
        render: WebsiteGeneralView,
      },
      edit: {
        title: i18n.t("General"),
        description: i18n.t("Site name and domain."),
        render: ({
          entity,
        }) => <WebsiteGeneralForm website={entity} />,
      },
    },
    {
      key: "people",
      label: i18n.t("People"),
      view: {
        title: i18n.t("People"),
        description: i18n.t("People associated with this website."),
        render: ({
          entity,
        }) => <WebsitePeopleView website={entity} />,
      },
      edit: {
        title: i18n.t("People"),
        description: i18n.t("Connect people to this website."),
        render: ({
          entity,
        }) => <WebsitePeopleForm website={entity} />,
      },
    },
    {
      key: "shortened-links",
      label: i18n.t("Shortened Links"),
      view: {
        title: i18n.t("Shortened Links"),
        description: i18n.t("Short domains that resolve to this site and how they expand."),
        render: ({
          entity,
        }) => (
          <ShortenedLinksList
            links={entity.shortenedLinks}
            emptyText={i18n.t("None configured.")}
          />
        ),
      },
      edit: {
        title: i18n.t("Shortened Links"),
        description: i18n.t("Short domains that resolve to this site and how they expand."),
        render: ({
          entity,
        }) => <WebsiteShortenedLinksForm website={entity} />,
      },
    },
    {
      key: "param-rules",
      label: i18n.t("Param Rules"),
      view: {
        title: i18n.t("Param Rules"),
        description: i18n.t("For matching paths, only these query params are kept; the rest are stripped."),
        render: ({
          entity,
        }) => (
          <ParamRulesList
            rules={entity.paramRules}
            emptyText={i18n.t("None configured.")}
          />
        ),
      },
      edit: {
        title: i18n.t("Param Rules"),
        description: i18n.t("Path-scoped query-param whitelist: only listed params are kept, the rest are stripped."),
        render: ({
          entity,
        }) => <WebsiteParamRulesForm website={entity} />,
      },
    },
    {
      key: "hierarchy",
      label: i18n.t("Hierarchy"),
      view: {
        title: i18n.t("Hierarchy"),
        description: i18n.t("Parent domain and subdomain children."),
        render: WebsiteHierarchyView,
      },
    },
    {
      key: "autofill",
      label: i18n.t("Autofill Rules"),
      view: {
        title: i18n.t("Autofill Rules"),
        description: i18n.t("Autofill rules whose conditions target this website."),
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
        title: i18n.t("Autofill Rules"),
        description: i18n.t("Autofill rules whose conditions target this website."),
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
      label: i18n.t("Display Rules"),
      view: {
        title: i18n.t("Display Rules"),
        description: i18n.t("Card display rules whose conditions reference this website."),
        render: ({
          entity,
        }) => <CardDisplayRulesList websiteId={entity.id} />,
      },
      edit: {
        title: i18n.t("Display Rules"),
        description: i18n.t("Card display rules whose conditions reference this website."),
        render: ({
          entity,
        }) => <CardDisplayRulesList websiteId={entity.id} />,
      },
    },
    {
      key: "languages",
      label: i18n.t("Languages"),
      view: {
        title: i18n.t("Languages"),
        description: i18n.t("Languages this website's content is available in and how."),
        render: ({
          entity,
        }) => (
          <LanguageUsagesTabView
            ownerType="website"
            ownerId={entity.id}
          />
        ),
      },
      edit: {
        title: i18n.t("Languages"),
        description: i18n.t("Record which languages this website offers (dub, subtitles, …)."),
        render: ({
          entity,
        }) => (
          <LanguageUsagesTabEditor
            ownerType="website"
            ownerId={entity.id}
            kind="availability"
          />
        ),
      },
    },
  ],
};
