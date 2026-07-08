import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, Person } from "@eesimple/types";

import i18n from "../../i18n";
import { LanguageUsagesTabEditor, LanguageUsagesTabView } from "../languageUsages/LanguageUsagesTab";
import {
  PersonAvatarEdit,
  PersonCreatorMediaEdit,
  PersonDetailsFields,
  PersonGenreMoodsEdit,
  PersonLabeledWebsitesEdit,
  PersonNamesEdit,
  PersonPrimaryLanguageEdit,
  PersonSocialLinksEdit,
} from "../PersonGeneralForm";
import { PersonGroupsForm, PersonGroupsView } from "../PersonGroupsForm";
import { PersonWebsitesForm, PersonWebsitesView } from "../PersonWebsitesForm";
import { PersonYouTubeChannelsForm, PersonYouTubeChannelsView } from "../PersonYouTubeChannelsForm";
import {
  PersonAvatarView,
  PersonConnectionsView,
  PersonCreatorMediaView,
  PersonDescriptionView,
  PersonLabeledWebsitesView,
  PersonMetadataView,
  PersonNamesView,
  PersonPrimaryLanguageView,
  PersonSocialLinksView,
} from "./personViews";

import { usePersonById, usePersonBySlug, useDeletePerson } from "@/hooks/usePeople";

/**
 * The person workbench's field registry (#1106 layout editor). The old opaque `general` composite is
 * broken into granular, independently-placeable fields (#1194); the four remaining tabs stay one field
 * each. `avatar`/`details`/`primaryLanguage`/`names`/`labeledWebsites`/`socialLinks`/`creatorMedia` carry
 * both modes; `genreMoods` is edit-only (not shown in view) and `metadata`/`connections` are view-only —
 * that is how the asymmetric General view/edit reconcile into one ordered field list (the mode picks the
 * renderer, so view/edit parity is by construction).
 */
type PersonFieldKey
  = | "avatar"
    | "details"
    | "primaryLanguage"
    | "names"
    | "labeledWebsites"
    | "socialLinks"
    | "creatorMedia"
    | "genreMoods"
    | "metadata"
    | "connections"
    | "youtubeChannels"
    | "websites"
    | "groups"
    | "languages";

const personFields = {
  avatar: {
    key: "avatar",
    label: i18n.t("Avatar"),
    view: PersonAvatarView,
    edit: ({
      entity,
    }) => <PersonAvatarEdit person={entity} />,
  },
  details: {
    key: "details",
    label: i18n.t("Details"),
    view: PersonDescriptionView,
    edit: ({
      entity,
    }) => <PersonDetailsFields person={entity} />,
  },
  primaryLanguage: {
    key: "primaryLanguage",
    label: i18n.t("Primary language"),
    view: PersonPrimaryLanguageView,
    edit: ({
      entity,
    }) => <PersonPrimaryLanguageEdit person={entity} />,
  },
  names: {
    key: "names",
    label: i18n.t("Names"),
    view: PersonNamesView,
    edit: ({
      entity,
    }) => <PersonNamesEdit person={entity} />,
  },
  labeledWebsites: {
    key: "labeledWebsites",
    label: i18n.t("Websites"),
    view: PersonLabeledWebsitesView,
    edit: ({
      entity,
    }) => <PersonLabeledWebsitesEdit person={entity} />,
  },
  socialLinks: {
    key: "socialLinks",
    label: i18n.t("Social links"),
    view: PersonSocialLinksView,
    edit: ({
      entity,
    }) => <PersonSocialLinksEdit person={entity} />,
  },
  creatorMedia: {
    key: "creatorMedia",
    label: i18n.t("Creator / media"),
    view: PersonCreatorMediaView,
    edit: ({
      entity,
    }) => <PersonCreatorMediaEdit person={entity} />,
  },
  genreMoods: {
    key: "genreMoods",
    label: i18n.t("Genres & moods"),
    edit: ({
      entity,
    }) => <PersonGenreMoodsEdit person={entity} />,
  },
  metadata: {
    key: "metadata",
    label: i18n.t("Metadata"),
    view: PersonMetadataView,
  },
  connections: {
    key: "connections",
    label: i18n.t("Connections"),
    view: PersonConnectionsView,
  },
  youtubeChannels: {
    key: "youtubeChannels",
    label: i18n.t("YouTube Channels"),
    view: ({
      entity,
    }) => <PersonYouTubeChannelsView person={entity} />,
    edit: ({
      entity,
    }) => <PersonYouTubeChannelsForm person={entity} />,
  },
  websites: {
    key: "websites",
    label: i18n.t("Websites"),
    view: ({
      entity,
    }) => <PersonWebsitesView person={entity} />,
    edit: ({
      entity,
    }) => <PersonWebsitesForm person={entity} />,
  },
  groups: {
    key: "groups",
    label: i18n.t("Groups"),
    view: ({
      entity,
    }) => <PersonGroupsView person={entity} />,
    edit: ({
      entity,
    }) => <PersonGroupsForm person={entity} />,
  },
  languages: {
    key: "languages",
    label: i18n.t("Languages"),
    view: ({
      entity,
    }) => (
      <LanguageUsagesTabView
        ownerType="person"
        ownerId={entity.id}
      />
    ),
    edit: ({
      entity,
    }) => (
      <LanguageUsagesTabEditor
        ownerType="person"
        ownerId={entity.id}
        kind="proficiency"
      />
    ),
  },
} satisfies Record<PersonFieldKey, WorkbenchField<Person>>;

/** The code default layout: the current five tabs, one untitled section each, in current order. */
const PERSON_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        // Edit order kept close to the pre-extraction form; the view-only `metadata`/`connections`
        // fields trail and vanish in edit, and edit-only `genreMoods` vanishes in view.
        fields: [
          "avatar",
          "details",
          "primaryLanguage",
          "names",
          "labeledWebsites",
          "socialLinks",
          "creatorMedia",
          "genreMoods",
          "metadata",
          "connections",
        ] satisfies PersonFieldKey[],
      }],
    },
    {
      key: "youtube-channels",
      label: i18n.t("YouTube Channels"),
      sections: [{
        key: "youtube-channels",
        fields: ["youtubeChannels"] satisfies PersonFieldKey[],
      }],
    },
    {
      key: "websites",
      label: i18n.t("Websites"),
      sections: [{
        key: "websites",
        fields: ["websites"] satisfies PersonFieldKey[],
      }],
    },
    {
      key: "groups",
      label: i18n.t("Groups"),
      sections: [{
        key: "groups",
        fields: ["groups"] satisfies PersonFieldKey[],
      }],
    },
    {
      key: "languages",
      label: i18n.t("Languages"),
      sections: [{
        key: "languages",
        fields: ["languages"] satisfies PersonFieldKey[],
      }],
    },
  ],
};

/** Single source of truth for an person's tabbed view/edit UI (main pane routes + right panel). */
export const personWorkbench: EntityWorkbench<Person> = {
  useBySlug: (slug) => {
    const {
      person, isLoading,
    } = usePersonBySlug(slug);
    return {
      entity: person,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      person, isLoading, error,
    } = usePersonById(id);
    return {
      entity: person,
      isLoading,
      error: error ?? null,
    };
  },
  name: person => person.name,
  useDelete: () => {
    const mutation = useDeletePerson();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("Person not found."),
  navAriaLabel: i18n.t("Person sections"),
  listingPath: "/taxonomies/people",
  getSlug: person => person.slug,
  layoutKind: "person",
  fields: personFields,
  defaultLayout: PERSON_DEFAULT_LAYOUT,
  // Layout-driven: the body comes from `fields` + `defaultLayout`. `tabs` is a thin placeholder
  // retained only for the descriptor's type requirement (no `group` nav metadata needed here).
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
    },
    {
      key: "youtube-channels",
      label: i18n.t("YouTube Channels"),
    },
    {
      key: "websites",
      label: i18n.t("Websites"),
    },
    {
      key: "groups",
      label: i18n.t("Groups"),
    },
    {
      key: "languages",
      label: i18n.t("Languages"),
    },
  ],
};
