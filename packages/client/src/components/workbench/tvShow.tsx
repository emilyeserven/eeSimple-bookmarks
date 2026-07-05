import type { EntityWorkbench } from "./types";
import type { TvShow } from "@eesimple/types";

import i18n from "../../i18n";
import { LanguageUsagesTabEditor, LanguageUsagesTabView } from "../languageUsages/LanguageUsagesTab";
import { PlexTaxonomyImageTab } from "../PlexTaxonomyImageTab";
import { PlexTitleGeneralView } from "../PlexTitleGeneralView";
import { TvShowGeneralForm } from "../TvShowGeneralForm";

import { useDeleteTvShow, useTvShowBySlug, useTvShows } from "@/hooks/useTvShows";
import { tvShowsApi } from "@/lib/api/taxonomies";

/** Single source of truth for a TV show's view/edit UI (main pane routes + right panel). */
export const tvShowWorkbench: EntityWorkbench<TvShow> = {
  useBySlug: (slug) => {
    const {
      tvShow, isLoading,
    } = useTvShowBySlug(slug);
    return {
      entity: tvShow,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useTvShows();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: tvShow => tvShow.name,
  useDelete: () => {
    const mutation = useDeleteTvShow();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("TV show not found."),
  navAriaLabel: i18n.t("TV show sections"),
  listingPath: "/taxonomies/tv-shows",
  getSlug: tvShow => tvShow.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: i18n.t("General"),
        description: i18n.t("Media property, Plex link, year, and metadata."),
        render: ({
          entity,
        }) => (
          <PlexTitleGeneralView
            entity={entity}
            ownerType="tvShow"
            createdAt={entity.createdAt}
            bookmarkCount={entity.bookmarkCount}
          />
        ),
      },
      edit: {
        title: i18n.t("General"),
        description: i18n.t("Name, media property, Plex link, and year."),
        render: ({
          entity,
        }) => <TvShowGeneralForm tvShow={entity} />,
      },
    },
    {
      key: "image",
      label: "Image",
      view: {
        title: i18n.t("Image"),
        description: i18n.t("The TV show's poster image."),
        render: ({
          entity,
        }) => (
          <PlexTaxonomyImageTab
            entity={entity}
            imagesApi={tvShowsApi.images}
            queryKeyPrefix="tvShow-images"
            readOnly
          />
        ),
      },
      edit: {
        title: i18n.t("Image"),
        description: i18n.t("Upload a poster, or pull it from the linked Plex item."),
        render: ({
          entity,
        }) => (
          <PlexTaxonomyImageTab
            entity={entity}
            imagesApi={tvShowsApi.images}
            queryKeyPrefix="tvShow-images"
          />
        ),
      },
    },
    {
      key: "languages",
      label: "Languages",
      view: {
        title: i18n.t("Languages"),
        description: i18n.t("Languages this show is available in and how."),
        render: ({
          entity,
        }) => (
          <LanguageUsagesTabView
            ownerType="tvShow"
            ownerId={entity.id}
          />
        ),
      },
      edit: {
        title: i18n.t("Languages"),
        description: i18n.t("Record which languages this show offers (dub, subtitles, …)."),
        render: ({
          entity,
        }) => (
          <LanguageUsagesTabEditor
            ownerType="tvShow"
            ownerId={entity.id}
            kind="availability"
          />
        ),
      },
    },
  ],
};
