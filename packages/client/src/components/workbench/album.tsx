import type { EntityWorkbench } from "./types";
import type { Album } from "@eesimple/types";

import i18n from "../../i18n";
import { AlbumCreditsValue } from "../AlbumCreditsSection";
import { AlbumGeneralForm } from "../AlbumGeneralForm";
import { LanguageUsagesTabEditor, LanguageUsagesTabView } from "../languageUsages/LanguageUsagesTab";
import { PlexTaxonomyImageTab } from "../PlexTaxonomyImageTab";
import { PlexTitleGeneralView } from "../PlexTitleGeneralView";

import { useAlbumBySlug, useAlbums, useDeleteAlbum } from "@/hooks/useAlbums";
import { albumsApi } from "@/lib/api/taxonomies";

/** Single source of truth for an album's view/edit UI (main pane routes + right panel). */
export const albumWorkbench: EntityWorkbench<Album> = {
  useBySlug: (slug) => {
    const {
      album, isLoading,
    } = useAlbumBySlug(slug);
    return {
      entity: album,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useAlbums();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: album => album.name,
  useDelete: () => {
    const mutation = useDeleteAlbum();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("Album not found."),
  navAriaLabel: i18n.t("Album sections"),
  listingPath: "/taxonomies/albums",
  getSlug: album => album.slug,
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      view: {
        title: i18n.t("General"),
        description: i18n.t("Media property, credits, Plex link, year, and metadata."),
        render: ({
          entity,
        }) => (
          <PlexTitleGeneralView
            entity={entity}
            ownerType="album"
            createdAt={entity.createdAt}
            bookmarkCount={entity.bookmarkCount}
            renderExtra={<AlbumCreditsValue album={entity} />}
          />
        ),
      },
      edit: {
        title: i18n.t("General"),
        description: i18n.t("Name, media property, credits, Plex link, and year."),
        render: ({
          entity,
        }) => <AlbumGeneralForm album={entity} />,
      },
    },
    {
      key: "image",
      label: i18n.t("Image"),
      view: {
        title: i18n.t("Image"),
        description: i18n.t("The album's cover image."),
        render: ({
          entity,
        }) => (
          <PlexTaxonomyImageTab
            entity={entity}
            imagesApi={albumsApi.images}
            queryKeyPrefix="album-images"
            readOnly
          />
        ),
      },
      edit: {
        title: i18n.t("Image"),
        description: i18n.t("Upload a cover image, or pull it from the linked Plex item."),
        render: ({
          entity,
        }) => (
          <PlexTaxonomyImageTab
            entity={entity}
            imagesApi={albumsApi.images}
            queryKeyPrefix="album-images"
          />
        ),
      },
    },
    {
      key: "languages",
      label: i18n.t("Languages"),
      view: {
        title: i18n.t("Languages"),
        description: i18n.t("Languages this album is available in and how."),
        render: ({
          entity,
        }) => (
          <LanguageUsagesTabView
            ownerType="album"
            ownerId={entity.id}
          />
        ),
      },
      edit: {
        title: i18n.t("Languages"),
        description: i18n.t("Record which languages this album offers (dub, subtitles, …)."),
        render: ({
          entity,
        }) => (
          <LanguageUsagesTabEditor
            ownerType="album"
            ownerId={entity.id}
            kind="availability"
          />
        ),
      },
    },
  ],
};
