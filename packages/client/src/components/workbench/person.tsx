import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, Person } from "@eesimple/types";

import i18n from "../../i18n";
import { LanguageUsagesTabEditor, LanguageUsagesTabView } from "../languageUsages/LanguageUsagesTab";
import { PersonGeneralForm } from "../PersonGeneralForm";
import { PersonGroupsForm, PersonGroupsView } from "../PersonGroupsForm";
import { PersonWebsitesForm, PersonWebsitesView } from "../PersonWebsitesForm";
import { PersonYouTubeChannelsForm, PersonYouTubeChannelsView } from "../PersonYouTubeChannelsForm";
import { PersonGeneralView } from "./personViews";

import { usePersonById, usePersonBySlug, useDeletePerson } from "@/hooks/usePeople";

/**
 * The person workbench's field registry (#1106 layout editor). All five fields carry both modes — the
 * entity has no view-only/edit-only tabs today.
 */
type PersonFieldKey = "general" | "youtubeChannels" | "websites" | "groups" | "languages";

const personFields = {
  general: {
    key: "general",
    label: i18n.t("General"),
    view: PersonGeneralView,
    edit: ({
      entity,
    }) => <PersonGeneralForm person={entity} />,
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
        fields: ["general"] satisfies PersonFieldKey[],
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
