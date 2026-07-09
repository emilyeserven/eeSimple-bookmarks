import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, Website } from "@eesimple/types";

import i18n from "../../i18n";
import { AutofillRulesList } from "../AutofillRulesList";
import { CardDisplayRulesList } from "../CardDisplayRulesList";
import { GenreMoodAssignmentSection } from "../GenreMoodAssignmentSection";
import { LanguageUsagesTabEditor, LanguageUsagesTabView } from "../languageUsages/LanguageUsagesTab";
import { ParamRulesList } from "../ParamRulesList";
import { ShortenedLinksList } from "../ShortenedLinksList";
import {
  WebsiteAlternateNamesEditField,
  WebsiteDefaultCategoryEditField,
  WebsiteDefaultMediaTypeEditField,
  WebsiteDefaultTagsEditField,
  WebsiteDescriptionEditField,
  WebsiteDomainEditField,
  WebsiteFaviconEditField,
  WebsiteLabeledWebsitesEditField,
  WebsiteNameEditField,
  WebsiteRedirectFailureEditField,
  WebsiteScanIsbnEditField,
  WebsiteSocialLinksEditField,
  WebsiteYouTubeChannelsEditField,
} from "../WebsiteGeneralForm";
import { WebsiteGeneralFormProvider } from "../WebsiteGeneralFormContext";
import { WebsiteParamRulesForm } from "../WebsiteParamRulesForm";
import { WebsitePeopleForm, WebsitePeopleView } from "../WebsitePeopleForm";
import { WebsiteShortenedLinksForm } from "../WebsiteShortenedLinksForm";
import {
  WebsiteAlternateNamesView,
  WebsiteDescriptionView,
  WebsiteDomainView,
  WebsiteFaviconView,
  WebsiteHierarchyView,
  WebsiteMetadataView,
  WebsiteSocialLinksView,
  WebsiteSourceDefaultsView,
  WebsiteYouTubeChannelsView,
} from "./websiteViews";

import { useDeleteWebsite, useWebsiteBySlug, useWebsites } from "@/hooks/useWebsites";

/**
 * The website workbench's field registry (#1106 layout editor). Each existing tab pane becomes a
 * placeable, mode-aware {@link WorkbenchField}. The old opaque `general` composite is now **broken into
 * granular fields** (#1188) — name / favicon / domain / metadata / description / alternate names /
 * default category / default media type / default tags / source-defaults summary / YouTube channels /
 * social links / labeled websites / redirect-failure / genres & moods — so an operator can rearrange or
 * relocate each on the Page Layouts editor. Every editable field reads the **one** shared controller
 * from {@link WebsiteGeneralFormProvider} (mounted by `EntityEditView` via `editFormProvider`), except
 * `genreMoods` (independently-backed) and the view-only `metadata`/`sourceDefaults`. `hierarchy` is
 * **view-only** (no `edit`), which is what makes the Hierarchy tab disappear in edit mode for free.
 * Authored as an exhaustive `Record<WebsiteFieldKey, …>` so a key without a renderer fails `tsc`.
 */
type WebsiteFieldKey
  = | "name"
    | "favicon"
    | "domain"
    | "metadata"
    | "description"
    | "alternateNames"
    | "defaultCategory"
    | "defaultMediaType"
    | "defaultTags"
    | "sourceDefaults"
    | "youtubeChannels"
    | "socialLinks"
    | "labeledWebsites"
    | "redirectFailure"
    | "scanIsbn"
    | "genreMoods"
    | "people"
    | "shortenedLinks"
    | "paramRules"
    | "hierarchy"
    | "autofillRules"
    | "displayRules"
    | "languages";

/** The General-tab field keys whose `edit` renderer reads the shared `useWebsiteGeneralForm` controller
 *  from {@link WebsiteGeneralFormProvider} — everything editable except `genreMoods` (independently
 *  backed). Drives `EntityEditView`'s provider gate. */
const WEBSITE_SHARED_FORM_FIELD_KEYS = new Set<string>([
  "name",
  "favicon",
  "domain",
  "description",
  "alternateNames",
  "defaultCategory",
  "defaultMediaType",
  "defaultTags",
  "youtubeChannels",
  "socialLinks",
  "labeledWebsites",
  "redirectFailure",
  "scanIsbn",
]);

const websiteFields = {
  name: {
    key: "name",
    label: i18n.t("Site name"),
    edit: ({
      entity,
    }) => <WebsiteNameEditField website={entity} />,
  },
  favicon: {
    key: "favicon",
    label: i18n.t("Favicon"),
    view: WebsiteFaviconView,
    edit: ({
      entity,
    }) => <WebsiteFaviconEditField website={entity} />,
  },
  domain: {
    key: "domain",
    label: i18n.t("Domain"),
    view: WebsiteDomainView,
    edit: ({
      entity,
    }) => <WebsiteDomainEditField website={entity} />,
  },
  metadata: {
    key: "metadata",
    label: i18n.t("Metadata"),
    view: WebsiteMetadataView,
  },
  description: {
    key: "description",
    label: i18n.t("Description"),
    view: WebsiteDescriptionView,
    edit: () => <WebsiteDescriptionEditField />,
  },
  alternateNames: {
    key: "alternateNames",
    label: i18n.t("Alternate Names"),
    view: WebsiteAlternateNamesView,
    edit: () => <WebsiteAlternateNamesEditField />,
  },
  defaultCategory: {
    key: "defaultCategory",
    label: i18n.t("Default category"),
    edit: ({
      entity,
    }) => <WebsiteDefaultCategoryEditField website={entity} />,
  },
  defaultMediaType: {
    key: "defaultMediaType",
    label: i18n.t("Default media type"),
    edit: ({
      entity,
    }) => <WebsiteDefaultMediaTypeEditField website={entity} />,
  },
  defaultTags: {
    key: "defaultTags",
    label: i18n.t("Default tags"),
    edit: () => <WebsiteDefaultTagsEditField />,
  },
  sourceDefaults: {
    key: "sourceDefaults",
    label: i18n.t("Source defaults"),
    view: WebsiteSourceDefaultsView,
  },
  youtubeChannels: {
    key: "youtubeChannels",
    label: i18n.t("YouTube Channels"),
    view: WebsiteYouTubeChannelsView,
    edit: ({
      entity,
    }) => <WebsiteYouTubeChannelsEditField website={entity} />,
  },
  socialLinks: {
    key: "socialLinks",
    label: i18n.t("Social Links"),
    view: WebsiteSocialLinksView,
    edit: ({
      entity,
    }) => <WebsiteSocialLinksEditField website={entity} />,
  },
  labeledWebsites: {
    key: "labeledWebsites",
    label: i18n.t("Labeled Websites"),
    edit: ({
      entity,
    }) => <WebsiteLabeledWebsitesEditField website={entity} />,
  },
  redirectFailure: {
    key: "redirectFailure",
    label: i18n.t("Redirect Resolution Failure"),
    edit: ({
      entity,
    }) => <WebsiteRedirectFailureEditField website={entity} />,
  },
  scanIsbn: {
    key: "scanIsbn",
    label: i18n.t("Scan URL for ISBN"),
    edit: ({
      entity,
    }) => <WebsiteScanIsbnEditField website={entity} />,
  },
  genreMoods: {
    key: "genreMoods",
    label: i18n.t("Genres & Moods"),
    edit: ({
      entity,
    }) => (
      <GenreMoodAssignmentSection
        ownerType="website"
        ownerId={entity.id}
      />
    ),
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
        fields: [
          "name",
          "favicon",
          "domain",
          "metadata",
          "description",
          "alternateNames",
          "defaultCategory",
          "defaultMediaType",
          "defaultTags",
          "sourceDefaults",
          "youtubeChannels",
          "socialLinks",
          "labeledWebsites",
          "redirectFailure",
          "scanIsbn",
          "genreMoods",
        ] satisfies WebsiteFieldKey[],
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
  // Shared-`useAppForm` extraction (#1188): the granular General edit fields read one controller from
  // `WebsiteGeneralFormProvider`, which `EntityEditView` mounts around the edit body whenever the active
  // tab hosts one of these keys.
  sharedFormFieldKeys: WEBSITE_SHARED_FORM_FIELD_KEYS,
  editFormProvider: ({
    entity, children,
  }) => <WebsiteGeneralFormProvider website={entity}>{children}</WebsiteGeneralFormProvider>,
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
