import type { EntityWorkbench } from "./types";
import type { Person } from "@eesimple/types";

import i18n from "../../i18n";
import { LanguageUsagesTabEditor, LanguageUsagesTabView } from "../languageUsages/LanguageUsagesTab";
import { PersonGeneralForm } from "../PersonGeneralForm";
import { PersonGroupsForm, PersonGroupsView } from "../PersonGroupsForm";
import { PersonWebsitesForm, PersonWebsitesView } from "../PersonWebsitesForm";
import { PersonYouTubeChannelsForm, PersonYouTubeChannelsView } from "../PersonYouTubeChannelsForm";
import { PersonGeneralView } from "./personViews";

import { usePersonById, usePersonBySlug, useDeletePerson } from "@/hooks/usePeople";

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
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      view: {
        title: i18n.t("General"),
        description: i18n.t("Person details."),
        render: PersonGeneralView,
      },
      edit: {
        title: i18n.t("General"),
        description: i18n.t("Edit the person's name, URLs, and avatar."),
        render: ({
          entity,
        }) => <PersonGeneralForm person={entity} />,
      },
    },
    {
      key: "youtube-channels",
      label: i18n.t("YouTube Channels"),
      view: {
        title: i18n.t("YouTube Channels"),
        description: i18n.t("YouTube channels associated with this person."),
        render: ({
          entity,
        }) => <PersonYouTubeChannelsView person={entity} />,
      },
      edit: {
        title: i18n.t("YouTube Channels"),
        description: i18n.t("Connect YouTube channels to this person."),
        render: ({
          entity,
        }) => <PersonYouTubeChannelsForm person={entity} />,
      },
    },
    {
      key: "websites",
      label: i18n.t("Websites"),
      view: {
        title: i18n.t("Websites"),
        description: i18n.t("Websites associated with this person."),
        render: ({
          entity,
        }) => <PersonWebsitesView person={entity} />,
      },
      edit: {
        title: i18n.t("Websites"),
        description: i18n.t("Connect websites to this person."),
        render: ({
          entity,
        }) => <PersonWebsitesForm person={entity} />,
      },
    },
    {
      key: "groups",
      label: i18n.t("Groups"),
      view: {
        title: i18n.t("Groups"),
        description: i18n.t("Groups associated with this person."),
        render: ({
          entity,
        }) => <PersonGroupsView person={entity} />,
      },
      edit: {
        title: i18n.t("Groups"),
        description: i18n.t("Connect groups to this person."),
        render: ({
          entity,
        }) => <PersonGroupsForm person={entity} />,
      },
    },
    {
      key: "languages",
      label: i18n.t("Languages"),
      view: {
        title: i18n.t("Languages"),
        description: i18n.t("Languages this person uses and their proficiency."),
        render: ({
          entity,
        }) => (
          <LanguageUsagesTabView
            ownerType="person"
            ownerId={entity.id}
          />
        ),
      },
      edit: {
        title: i18n.t("Languages"),
        description: i18n.t("Record this person's languages and proficiency levels."),
        render: ({
          entity,
        }) => (
          <LanguageUsagesTabEditor
            ownerType="person"
            ownerId={entity.id}
            kind="proficiency"
          />
        ),
      },
    },
  ],
};
