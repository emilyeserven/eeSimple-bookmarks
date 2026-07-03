import type { PodcastSyncField } from "../lib/syncSources/podcastDiff";
import type { Podcast, PodcastSearchResult, UpdatePodcastInput } from "@eesimple/types";

import { useCallback } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { PodcastSearchPicker } from "./PodcastSearchPicker";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { usePodcastSyncRegistration } from "../hooks/usePodcastSyncRegistration";

import { useMediaProperties } from "@/hooks/useMediaProperties";
import { useUpdatePodcast } from "@/hooks/usePodcasts";
import { podcastsApi } from "@/lib/api/taxonomies";
import { notifyFieldSaved, notifyFieldSaveError } from "@/lib/autoSave";
import { useAppForm } from "@/lib/form";

const podcastGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  romanizedName: z.string(),
  sortOrder: z.number().int(),
  mediaPropertyId: z.string(),
  feedUrl: z.string(),
  author: z.string(),
  description: z.string(),
});

const LABELS: Record<keyof UpdatePodcastInput, string> = {
  name: "Name",
  romanizedName: "Romanized name",
  sortOrder: "Sort order",
  mediaPropertyId: "Media property",
  feedUrl: "Feed URL",
  itunesId: "Apple Podcasts",
  itunesUrl: "Apple Podcasts",
  author: "Author",
  description: "Description",
};

interface Props {
  podcast: Podcast;
}

/** Edit a podcast's name, sort order, media property, feed URL, author, and description. Auto-saves. */
export function PodcastGeneralForm({
  podcast,
}: Props) {
  const navigate = useNavigate();
  const updatePodcast = useUpdatePodcast();
  const {
    data: mediaProperties,
  } = useMediaProperties();
  const autoSave = useFieldAutoSave<UpdatePodcastInput, Podcast>({
    id: podcast.id,
    update: updatePodcast,
    labels: LABELS,
    initial: {
      name: podcast.name,
      romanizedName: podcast.romanizedName ?? "",
      sortOrder: podcast.sortOrder,
      feedUrl: podcast.feedUrl ?? "",
      author: podcast.author ?? "",
      description: podcast.description ?? "",
    },
  });

  const mediaPropertyCreate = useEntityCreateOption("media-property", (mediaProperty) => {
    void updatePodcast.mutate(
      {
        id: podcast.id,
        input: {
          mediaPropertyId: mediaProperty.id,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Media property"),
        onError: error => notifyFieldSaveError(
          "Media property",
          error instanceof Error ? error.message : undefined,
        ),
      },
    );
  });

  const form = useAppForm({
    defaultValues: {
      name: podcast.name,
      romanizedName: podcast.romanizedName ?? "",
      sortOrder: podcast.sortOrder,
      mediaPropertyId: podcast.mediaPropertyId ?? "",
      feedUrl: podcast.feedUrl ?? "",
      author: podcast.author ?? "",
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

  usePodcastSyncRegistration({
    podcast,
    imagesApi: podcastsApi.images,
    applyText,
  });

  /** Fill fields + link iTunes from a search pick: persist name/author/feed/iTunes in one save + toast. */
  function applyPickedPodcast(result: PodcastSearchResult): void {
    form.setFieldValue("name", result.name);
    form.setFieldValue("author", result.author ?? "");
    form.setFieldValue("feedUrl", result.feedUrl ?? "");
    updatePodcast.mutate(
      {
        id: podcast.id,
        input: {
          name: result.name,
          author: result.author,
          feedUrl: result.feedUrl,
          itunesId: result.itunesId,
          itunesUrl: result.itunesUrl,
        },
      },
      {
        onSuccess: (updated) => {
          notifyFieldSaved("Podcast");
          navigateIfSlugChanged(updated);
          void podcastsApi.images
            .autoFetch(podcast.id, "artwork")
            .then(() => queryClient.invalidateQueries({
              queryKey: ["podcast-images", podcast.id],
            }))
            .catch(() => undefined);
        },
        onError: error => notifyFieldSaveError(
          "Podcast",
          error instanceof Error ? error.message : undefined,
        ),
      },
    );
  }

  return (
    <div className="space-y-4">
      <PodcastSearchPicker onSelect={applyPickedPodcast} />
      <div
        className="
          grid gap-3
          sm:grid-cols-[1fr_8rem]
        "
      >
        <form.AppField name="name">
          {field => (
            <field.TextField
              label="Name"
              onBlur={() => autoSave.saveField(
                "name",
                field.state.value.trim(),
                {
                  valid: field.state.meta.errors.length === 0,
                  onSuccess: (updated) => {
                    if (updated.slug !== podcast.slug) {
                      void navigate({
                        to: "/taxonomies/podcasts/$podcastSlug/edit/general",
                        params: {
                          podcastSlug: updated.slug,
                        },
                      });
                    }
                  },
                },
              )}
            />
          )}
        </form.AppField>
        <form.AppField name="sortOrder">
          {field => (
            <field.NumberField
              label="Sort order"
              hint="Lower sorts first."
              onBlur={() => autoSave.saveField(
                "sortOrder",
                field.state.value,
                {
                  valid: field.state.meta.errors.length === 0,
                },
              )}
            />
          )}
        </form.AppField>
      </div>

      <form.AppField name="romanizedName">
        {field => (
          <field.TextField
            label="Romanized name"
            placeholder="Optional romanized form"
            onBlur={() => autoSave.saveField("romanizedName", field.state.value.trim())}
          />
        )}
      </form.AppField>

      <form.AppField name="mediaPropertyId">
        {field => (
          <field.ComboboxField
            label="Media property"
            placeholder="No media property"
            searchPlaceholder="Search media properties…"
            emptyText="No media properties found."
            createOption={mediaPropertyCreate.createOption}
            options={(mediaProperties ?? []).map(prop => ({
              value: prop.id,
              label: prop.name,
            }))}
            onValueChange={value => autoSave.saveField(
              "mediaPropertyId",
              value || null,
              {
                valid: true,
              },
            )}
          />
        )}
      </form.AppField>
      {mediaPropertyCreate.modal}

      <form.AppField name="feedUrl">
        {field => (
          <field.TextField
            label="Feed URL"
            placeholder="https://example.com/feed.xml"
            onBlur={() => autoSave.saveField("feedUrl", field.state.value.trim() || null)}
          />
        )}
      </form.AppField>

      <form.AppField name="author">
        {field => (
          <field.TextField
            label="Author"
            onBlur={() => autoSave.saveField("author", field.state.value.trim() || null)}
          />
        )}
      </form.AppField>

      <form.AppField name="description">
        {field => (
          <field.TextareaField
            label="Description"
            onBlur={() => autoSave.saveField("description", field.state.value.trim() || null)}
          />
        )}
      </form.AppField>
    </div>
  );
}
