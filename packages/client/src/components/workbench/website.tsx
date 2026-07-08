import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, Website } from "@eesimple/types";

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
 * The website workbench's field registry (#1106 layout editor). Each existing tab pane becomes ONE
 * placeable, mode-aware {@link WorkbenchField} keyed by the tab's own key (#1165 composite-editor
 * recipe) — `general` bundles the existing view/edit composites (favicon + metadata) unchanged, and
 * `hierarchy` is **view-only** (no `edit`), which is what makes the Hierarchy tab disappear in edit
 * mode for free. Authored as an exhaustive `Record<WebsiteFieldKey, …>` so a key without a renderer
 * fails `tsc`.
 */
type WebsiteFieldKey
  = | "general"
    | "people"
    | "shortenedLinks"
    | "paramRules"
    | "hierarchy"
    | "autofillRules"
    | "displayRules"
    | "languages";

const websiteFields = {
  general: {
    key: "general",
    label: i18n.t("General"),
    view: WebsiteGeneralView,
    edit: ({
      entity,
    }) => <WebsiteGeneralForm website={entity} />,
  },
  people: {
    key: "people",
    label: i18n.t("People"),
    view: ({
      entity,
    }) => <WebsitePeopleView website={entity} />,
    edit: ({
      entity,
    }) => <WebsitePeopleForm website={entity} />,
  },
  shortenedLinks: {
    key: "shortenedLinks",
    label: i18n.t("Shortened Links"),
    view: ({
      entity,
    }) => (
      <ShortenedLinksList
        links={entity.shortenedLinks}
        emptyText={i18n.t("None configured.")}
      />
    ),
    edit: ({
      entity,
    }) => <WebsiteShortenedLinksForm website={entity} />,
  },
  paramRules: {
    key: "paramRules",
    label: i18n.t("Param Rules"),
    view: ({
      entity,
    }) => (
      <ParamRulesList
        rules={entity.paramRules}
        emptyText={i18n.t("None configured.")}
      />
    ),
    edit: ({
      entity,
    }) => <WebsiteParamRulesForm website={entity} />,
  },
  hierarchy: {
    key: "hierarchy",
    label: i18n.t("Hierarchy"),
    view: WebsiteHierarchyView,
  },
  autofillRules: {
    key: "autofillRules",
    label: i18n.t("Autofill Rules"),
    view: ({
      entity,
    }) => (
      <AutofillRulesList
        websiteId={entity.id}
        query=""
      />
    ),
    edit: ({
      entity,
    }) => (
      <AutofillRulesList
        websiteId={entity.id}
        query=""
      />
    ),
  },
  displayRules: {
    key: "displayRules",
    label: i18n.t("Display Rules"),
    view: ({
      entity,
    }) => <CardDisplayRulesList websiteId={entity.id} />,
    edit: ({
      entity,
    }) => <CardDisplayRulesList websiteId={entity.id} />,
  },
  languages: {
    key: "languages",
    label: i18n.t("Languages"),
    view: ({
      entity,
    }) => (
      <LanguageUsagesTabView
        ownerType="website"
        ownerId={entity.id}
      />
    ),
    edit: ({
      entity,
    }) => (
      <LanguageUsagesTabEditor
        ownerType="website"
        ownerId={entity.id}
        kind="availability"
      />
    ),
  },
} satisfies Record<WebsiteFieldKey, WorkbenchField<Website>>;

/** The code-defined default layout — the current tab list, one untitled section per tab. */
const WEBSITE_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["general"] satisfies WebsiteFieldKey[],
      }],
    },
    {
      key: "people",
      label: i18n.t("People"),
      sections: [{
        key: "people",
        fields: ["people"] satisfies WebsiteFieldKey[],
      }],
    },
    {
      key: "shortened-links",
      label: i18n.t("Shortened Links"),
      sections: [{
        key: "shortened-links",
        fields: ["shortenedLinks"] satisfies WebsiteFieldKey[],
      }],
    },
    {
      key: "param-rules",
      label: i18n.t("Param Rules"),
      sections: [{
        key: "param-rules",
        fields: ["paramRules"] satisfies WebsiteFieldKey[],
      }],
    },
    {
      key: "hierarchy",
      label: i18n.t("Hierarchy"),
      sections: [{
        key: "hierarchy",
        fields: ["hierarchy"] satisfies WebsiteFieldKey[],
      }],
    },
    {
      key: "autofill",
      label: i18n.t("Autofill Rules"),
      sections: [{
        key: "autofill",
        fields: ["autofillRules"] satisfies WebsiteFieldKey[],
      }],
    },
    {
      key: "display-rules",
      label: i18n.t("Display Rules"),
      sections: [{
        key: "display-rules",
        fields: ["displayRules"] satisfies WebsiteFieldKey[],
      }],
    },
    {
      key: "languages",
      label: i18n.t("Languages"),
      sections: [{
        key: "languages",
        fields: ["languages"] satisfies WebsiteFieldKey[],
      }],
    },
  ],
};

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
  layoutKind: "website",
  fields: websiteFields,
  defaultLayout: WEBSITE_DEFAULT_LAYOUT,
  // Layout-driven: the tab rail + section stacks come from `fields` + `defaultLayout`. `tabs` is
  // retained only to carry the code-only `group` nav metadata (the "Rules" More dropdown on the
  // edit strip), re-attached by tab key in `deriveWorkbenchTabs`.
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
    },
    {
      key: "people",
      label: i18n.t("People"),
    },
    {
      key: "shortened-links",
      label: i18n.t("Shortened Links"),
    },
    {
      key: "param-rules",
      label: i18n.t("Param Rules"),
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
    {
      key: "languages",
      label: i18n.t("Languages"),
    },
  ],
};
