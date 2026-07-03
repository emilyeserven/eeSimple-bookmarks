import type { EntityWorkbench } from "./types";
import type { Person } from "@eesimple/types";

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
  notFound: "Person not found.",
  navAriaLabel: "Person sections",
  getSlug: person => person.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Person details.",
        render: PersonGeneralView,
      },
      edit: {
        title: "General",
        description: "Edit the person's name, URLs, and avatar.",
        render: ({
          entity,
        }) => <PersonGeneralForm person={entity} />,
      },
    },
    {
      key: "youtube-channels",
      label: "YouTube Channels",
      view: {
        title: "YouTube Channels",
        description: "YouTube channels associated with this person.",
        render: ({
          entity,
        }) => <PersonYouTubeChannelsView person={entity} />,
      },
      edit: {
        title: "YouTube Channels",
        description: "Connect YouTube channels to this person.",
        render: ({
          entity,
        }) => <PersonYouTubeChannelsForm person={entity} />,
      },
    },
    {
      key: "websites",
      label: "Websites",
      view: {
        title: "Websites",
        description: "Websites associated with this person.",
        render: ({
          entity,
        }) => <PersonWebsitesView person={entity} />,
      },
      edit: {
        title: "Websites",
        description: "Connect websites to this person.",
        render: ({
          entity,
        }) => <PersonWebsitesForm person={entity} />,
      },
    },
    {
      key: "groups",
      label: "Groups",
      view: {
        title: "Groups",
        description: "Groups associated with this person.",
        render: ({
          entity,
        }) => <PersonGroupsView person={entity} />,
      },
      edit: {
        title: "Groups",
        description: "Connect groups to this person.",
        render: ({
          entity,
        }) => <PersonGroupsForm person={entity} />,
      },
    },
  ],
};
