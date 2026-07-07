import type { PodcastLinkSyncField, PodcastSyncField } from "../lib/syncSources/podcastDiff";
import type { Podcast, PodcastProviderLinks, PodcastSearchResult, UpdatePodcastInput } from "@eesimple/types";

import { useCallback } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { LabeledWebsitesField } from "./LabeledWebsitesField";
import { LocationAssignmentSection } from "./LocationAssignmentSection";
import { PodcastAuthorsFields } from "./PodcastAuthorsFields";
import { PodcastSearchPicker } from "./PodcastSearchPicker";
import { TaxonomyGeneralFields } from "./TaxonomyGeneralFields";
import { usePodcastAuthors } from "./usePodcastAuthors";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { usePodcastSyncRegistration } from "../hooks/usePodcastSyncRegistration";
import i18n from "../i18n";
import { podcastLinkOptions } from "../lib/podcastLinks";

import { Label } from "@/components/ui/label";
import { useUpdatePodcast } from "@/hooks/usePodcasts";
import { podcastsApi } from "@/lib/api/taxonomies";
import { notifyFieldSaved, notifyFieldSaveError } from "@/lib/autoSave";
import { useAppForm } from "@/lib/form";

const podcastGeneralSchema = z.object({
  name: z.string().trim().min(1, i18n.t("Name is required")),
  sortOrder: z.number().int(),
  mediaPropertyId: z.string(),
  feedUrl: z.string(),
  spotifyUrl: z.string(),
  defaultLinkProvider: z.string(),
  description: z.string(),
});

const LABELS: Record<keyof UpdatePodcastInput, string> = {
  name: i18n.t("Name"),
  sortOrder: i18n.t("Sort order"),
  mediaPropertyId: i18n.t("Media property"),
  feedUrl: i18n.t("Feed URL"),
  itunesId: i18n.t("Apple Podcasts"),
  itunesUrl: i18n.t("Apple Podcasts"),
  spotifyUrl: i18n.t("Spotify link"),
  pocketCastsUuid: i18n.t("Pocket Casts"),
  pocketCastsUrl: i18n.t("Pocket Casts"),
  defaultLinkProvider: i18n.t("Default link"),
  personIds: i18n.t("People"),
  groupIds: i18n.t("Groups"),
  description: i18n.t("Description"),
  labeledWebsites: i18n.t("Websites"),
};

interface Props {
  podcast: Podcast;
}

/** Edit a podcast's name, sort order, media property, feed URL, authors, and description. Auto-saves. */
export function PodcastGeneralForm({
  podcast,
}: Props) {
  const navigate = useNavigate();
  const updatePodcast = useUpdatePodcast();
  const autoSave = useFieldAutoSave<UpdatePodcastInput, Podcast>({
    id: podcast.id,
    update: updatePodcast,
    labels: LABELS,
    initial: {
      name: podcast.name,
      sortOrder: podcast.sortOrder,
      feedUrl: podcast.feedUrl ?? "",
      spotifyUrl: podcast.spotifyUrl ?? "",
      defaultLinkProvider: podcast.defaultLinkProvider ?? null,
      description: podcast.description ?? "",
      labeledWebsites: podcast.labeledWebsites,
    },
  });

  /** Auto-save the People credits on change, with a field-named toast (edit-tab standard). */
  function savePeople(personIds: string[]): void {
    updatePodcast.mutate(
      {
        id: podcast.id,
        input: {
          personIds,
        },
      },
      {
        onSuccess: () => notifyFieldSaved(i18n.t("People")),
        onError: error => notifyFieldSaveError(i18n.t("People"), error instanceof Error ? error.message : undefined),
      },
    );
  }

  /** Auto-save the Group credits on change, with a field-named toast. */
  function saveGroups(groupIds: string[]): void {
    updatePodcast.mutate(
      {
        id: podcast.id,
        input: {
          groupIds,
        },
      },
      {
        onSuccess: () => notifyFieldSaved(i18n.t("Groups")),
        onError: error => notifyFieldSaveError(i18n.t("Groups"), error instanceof Error ? error.message : undefined),
      },
    );
  }

  const authors = usePodcastAuthors({
    personIds: podcast.personIds,
    groupIds: podcast.groupIds,
    onPersonIdsChange: savePeople,
    onGroupIdsChange: saveGroups,
  });

  const form = useAppForm({
    defaultValues: {
      name: podcast.name,
      sortOrder: podcast.sortOrder,
      mediaPropertyId: podcast.mediaPropertyId ?? "",
      feedUrl: podcast.feedUrl ?? "",
      spotifyUrl: podcast.spotifyUrl ?? "",
      defaultLinkProvider: podcast.defaultLinkProvider ?? "",
      description: podcast.description ?? "",
    },
    validators: {
      onChange: podcastGeneralSchema,
    },
  });

  const queryClient = useQueryClient();

  /** Navigate to the new slug when a rename changes it (mirrors the name field's on-blur save). */
  function navigateIfSlugChanged(updated: Podcast): void {
    if (updated.slug !== podcast.slug) {
      void navigate({
        to: "/taxonomies/podcasts/$podcastSlug/edit/general",
        params: {
          podcastSlug: updated.slug,
        },
      });
    }
  }

  /** Stage a synced text field into the form and persist it via per-field auto-save. */
  const applyText = useCallback((field: PodcastSyncField, value: string) => {
    form.setFieldValue(field, value);
    autoSave.saveField(field, value, {
      valid: true,
      onSuccess: field === "name" ? navigateIfSlugChanged : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form/autoSave are stable; navigate/slug read via closure
  }, []);

  /** Persist a cross-resolved service-link URL directly (itunesUrl/pocketCastsUrl aren't form fields). */
  const applyLink = useCallback((field: PodcastLinkSyncField, value: string) => {
    autoSave.saveField(field, value, {
      valid: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autoSave is stable
  }, []);

  usePodcastSyncRegistration({
    podcast,
    imagesApi: podcastsApi.images,
    applyText,
    applyLink,
  });

  /**
   * Backfill the service links the search hit didn't provide by cross-resolving the podcast's feed, then
   * persist any newly found ones. Best-effort: silently no-ops when nothing new resolves.
   */
  function backfillProviderLinks(result: PodcastSearchResult): void {
    void podcastsApi
      .resolveLinks(podcast.id)
      .then((links: PodcastProviderLinks) => {
        const input: UpdatePodcastInput = {};
        if (result.itunesUrl == null && links.itunesUrl != null) {
          input.itunesId = links.itunesId;
          input.itunesUrl = links.itunesUrl;
        }
        if (result.pocketCastsUrl == null && links.pocketCastsUrl != null) {
          input.pocketCastsUuid = links.pocketCastsUuid;
          input.pocketCastsUrl = links.pocketCastsUrl;
        }
        if (Object.keys(input).length === 0) return;
        updatePodcast.mutate(
          {
            id: podcast.id,
            input,
          },
          {
            onSuccess: () => notifyFieldSaved(i18n.t("Service links")),
          },
        );
      })
      .catch(() => undefined);
  }

  /**
   * Fill fields + link the searched service from a pick, cross-resolve the other services' links, and
   * resolve the author name to People.
   */
  function applyPickedPodcast(result: PodcastSearchResult): void {
    form.setFieldValue("name", result.name);
    form.setFieldValue("feedUrl", result.feedUrl ?? "");
    void authors.applyAuthorName(result.author);
    updatePodcast.mutate(
      {
        id: podcast.id,
        input: {
          name: result.name,
          feedUrl: result.feedUrl,
          itunesId: result.itunesId,
          itunesUrl: result.itunesUrl,
          pocketCastsUuid: result.pocketCastsUuid,
          pocketCastsUrl: result.pocketCastsUrl,
        },
      },
      {
        onSuccess: (updated) => {
          notifyFieldSaved(i18n.t("Podcast"));
          navigateIfSlugChanged(updated);
          void podcastsApi.images
            .autoFetch(podcast.id, "artwork")
            .then(() => queryClient.invalidateQueries({
              queryKey: ["podcast-images", podcast.id],
            }))
            .catch(() => undefined);
          if (result.feedUrl != null) backfillProviderLinks(result);
        },
        onError: error => notifyFieldSaveError(
          i18n.t("Podcast"),
          error instanceof Error ? error.message : undefined,
        ),
      },
    );
  }

  return (
    <div className="space-y-4">
      <PodcastSearchPicker onSelect={applyPickedPodcast} />
      <TaxonomyGeneralFields
        form={form}
        fields={{
          name: "name",
          sortOrder: "sortOrder",
          mediaPropertyId: "mediaPropertyId",
        }}
        saveField={autoSave.saveField}
        currentSlug={podcast.slug}
        onRenamed={slug => void navigate({
          to: "/taxonomies/podcasts/$podcastSlug/edit/general",
          params: {
            podcastSlug: slug,
          },
        })}
        ownerType="podcast"
        ownerId={podcast.id}
      />

      <form.AppField name="feedUrl">
        {field => (
          <field.TextField
            label={i18n.t("Feed URL")}
            placeholder="https://example.com/feed.xml"
            onBlur={() => autoSave.saveField("feedUrl", field.state.value.trim() || null)}
          />
        )}
      </form.AppField>

      <form.AppField name="spotifyUrl">
        {field => (
          <div className="space-y-1">
            <field.TextField
              label={i18n.t("Spotify link")}
              placeholder="https://open.spotify.com/show/…"
              onBlur={() => autoSave.saveField("spotifyUrl", field.state.value.trim() || null)}
            />
            <p className="text-xs text-muted-foreground">
              {i18n.t("Paste the show's Spotify URL — Spotify can't be searched automatically.")}
            </p>
          </div>
        )}
      </form.AppField>

      <form.AppField name="defaultLinkProvider">
        {field => (
          <div className="space-y-1">
            <field.ComboboxField
              label={i18n.t("Default link")}
              placeholder={i18n.t("First available service")}
              searchPlaceholder={i18n.t("Search services…")}
              emptyText={i18n.t("No service links yet.")}
              options={podcastLinkOptions(podcast)}
              onValueChange={value => autoSave.saveField(
                "defaultLinkProvider",
                (value || null) as UpdatePodcastInput["defaultLinkProvider"],
                {
                  valid: true,
                },
              )}
            />
            <p className="text-xs text-muted-foreground">
              {i18n.t("Which service this podcast links out to (detail page + bookmark cards).")}
            </p>
          </div>
        )}
      </form.AppField>

      <div className="space-y-1.5">
        <Label>{i18n.t("Authors")}</Label>
        <PodcastAuthorsFields
          personIds={podcast.personIds}
          groupIds={podcast.groupIds}
          onPersonIdsChange={savePeople}
          onGroupIdsChange={saveGroups}
          personCreateOption={authors.personCreateOption}
          groupCreateOption={authors.groupCreateOption}
        />
      </div>
      {authors.modals}

      <form.AppField name="description">
        {field => (
          <field.TextareaField
            label={i18n.t("Description")}
            onBlur={() => autoSave.saveField("description", field.state.value.trim() || null)}
          />
        )}
      </form.AppField>

      <LabeledWebsitesField
        labeledWebsites={podcast.labeledWebsites}
        onChange={next => autoSave.saveField("labeledWebsites", next)}
      />

      <GenreMoodAssignmentSection
        ownerType="podcast"
        ownerId={podcast.id}
      />

      <LocationAssignmentSection
        ownerType="podcast"
        ownerId={podcast.id}
      />
    </div>
  );
}
