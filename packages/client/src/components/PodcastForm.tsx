import type { DraftEntityName } from "./entityNames/draftEntityName";
import type { Podcast, PodcastSearchResult, UpdatePodcastInput } from "@eesimple/types";

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { AddMediaPropertyModal } from "./AddMediaPropertyModal";
import { entriesFromDrafts } from "./entityNames/draftEntityName";
import { EntityNamesEditor } from "./entityNames/EntityNamesEditor";
import { PodcastAuthorsFields } from "./PodcastAuthorsFields";
import { PodcastSearchPicker } from "./PodcastSearchPicker";
import { usePodcastAuthors } from "./usePodcastAuthors";
import { useCreateEntityNames } from "../hooks/useEntityNames";
import { useMediaProperties } from "../hooks/useMediaProperties";
import { useCreatePodcast } from "../hooks/usePodcasts";

import { Combobox } from "@/components/Combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { podcastsApi } from "@/lib/api/taxonomies";

interface PodcastFormProps {
  /** Called with the created podcast (e.g. to select it in the opener, or navigate to its edit page). */
  onCreated?: (podcast: Podcast) => void;
}

/**
 * Create form for a Podcast. Enter a name (and optionally a feed URL / author / description), or group
 * it under a media property. Submit-driven (create keeps a Save button); the edit tabs auto-save.
 *
 * The media-property picker uses the manual `useState` + `AddMediaPropertyModal` pattern rather than
 * `useEntityCreateOption`, mirroring `BookForm` / `LocationForm` — keeps the create form free of the
 * registry so an inline-create modal can safely wrap it.
 */
export function PodcastForm({
  onCreated,
}: PodcastFormProps) {
  const {
    t,
  } = useTranslation();
  const createPodcast = useCreatePodcast();
  const createNames = useCreateEntityNames();
  const queryClient = useQueryClient();
  const {
    data: mediaProperties,
  } = useMediaProperties();

  const [name, setName] = useState("");
  const [nameDrafts, setNameDrafts] = useState<DraftEntityName[]>([]);
  const [feedUrl, setFeedUrl] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [description, setDescription] = useState("");
  const [mediaPropertyId, setMediaPropertyId] = useState<string>("");
  const [addMediaPropertyOpen, setAddMediaPropertyOpen] = useState(false);
  const [personIds, setPersonIds] = useState<string[]>([]);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  // Service linkage captured from the search picker, persisted on create.
  const [itunesId, setItunesId] = useState<number | null>(null);
  const [itunesUrl, setItunesUrl] = useState<string | null>(null);
  const [pocketCastsUuid, setPocketCastsUuid] = useState<string | null>(null);
  const [pocketCastsUrl, setPocketCastsUrl] = useState<string | null>(null);

  const authors = usePodcastAuthors({
    personIds,
    groupIds,
    onPersonIdsChange: setPersonIds,
    onGroupIdsChange: setGroupIds,
  });

  /** Prefill the form from a chosen result (feed + searched-service linkage); the author resolves to People. */
  function applyPickedPodcast(result: PodcastSearchResult): void {
    setName(result.name);
    setFeedUrl(result.feedUrl ?? "");
    setItunesId(result.itunesId);
    setItunesUrl(result.itunesUrl);
    setPocketCastsUuid(result.pocketCastsUuid);
    setPocketCastsUrl(result.pocketCastsUrl);
    void authors.applyAuthorName(result.author);
  }

  /** After create, cross-resolve the service links the pick didn't provide and persist any found. */
  function backfillProviderLinks(podcast: Podcast): void {
    if (!podcast.feedUrl) return;
    void podcastsApi
      .resolveLinks(podcast.id)
      .then((links) => {
        const input: UpdatePodcastInput = {};
        if (podcast.itunesUrl == null && links.itunesUrl != null) {
          input.itunesId = links.itunesId;
          input.itunesUrl = links.itunesUrl;
        }
        if (podcast.pocketCastsUrl == null && links.pocketCastsUrl != null) {
          input.pocketCastsUuid = links.pocketCastsUuid;
          input.pocketCastsUrl = links.pocketCastsUrl;
        }
        if (Object.keys(input).length === 0) return;
        return podcastsApi.update(podcast.id, input).then(() =>
          queryClient.invalidateQueries({
            queryKey: ["podcasts"],
          }));
      })
      .catch(() => undefined);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    createPodcast.mutate(
      {
        name: trimmed,
        mediaPropertyId: mediaPropertyId || null,
        feedUrl: feedUrl.trim() || null,
        spotifyUrl: spotifyUrl.trim() || null,
        personIds,
        groupIds,
        description: description.trim() || null,
        itunesId,
        itunesUrl,
        pocketCastsUuid,
        pocketCastsUrl,
      },
      {
        onSuccess: (podcast) => {
          backfillProviderLinks(podcast);
          const entries = entriesFromDrafts(nameDrafts);
          if (entries.length > 0) {
            createNames.mutate({
              ownerType: "podcast",
              ownerId: podcast.id,
              entries,
            });
          }
          onCreated?.(podcast);
        },
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <PodcastSearchPicker onSelect={applyPickedPodcast} />
      <div className="space-y-1.5">
        <Label htmlFor="podcast-name">{t("Name")}</Label>
        <Input
          id="podcast-name"
          placeholder={t("e.g. Reply All")}
          value={name}
          onChange={event => setName(event.target.value)}
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("Names")}</Label>
        <EntityNamesEditor
          value={nameDrafts}
          onChange={setNameDrafts}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="podcast-feed-url">{t("Feed URL")}</Label>
        <Input
          id="podcast-feed-url"
          placeholder="https://example.com/feed.xml"
          value={feedUrl}
          onChange={event => setFeedUrl(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="podcast-spotify-url">{t("Spotify link")}</Label>
        <Input
          id="podcast-spotify-url"
          placeholder="https://open.spotify.com/show/…"
          value={spotifyUrl}
          onChange={event => setSpotifyUrl(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("Authors")}</Label>
        <PodcastAuthorsFields
          personIds={personIds}
          groupIds={groupIds}
          onPersonIdsChange={setPersonIds}
          onGroupIdsChange={setGroupIds}
          personCreateOption={authors.personCreateOption}
          groupCreateOption={authors.groupCreateOption}
        />
      </div>
      {authors.modals}

      <div className="space-y-1.5">
        <Label htmlFor="podcast-description">{t("Description")}</Label>
        <Textarea
          id="podcast-description"
          placeholder={t("Optional description")}
          value={description}
          onChange={event => setDescription(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("Media property")}</Label>
        <Combobox
          aria-label={t("Media property")}
          options={(mediaProperties ?? []).map(prop => ({
            value: prop.id,
            label: prop.name,
          }))}
          value={mediaPropertyId || undefined}
          onValueChange={value => setMediaPropertyId(value ?? "")}
          placeholder={t("No media property")}
          searchPlaceholder={t("Search media properties…")}
          emptyText={t("No media properties found.")}
          createOption={{
            label: t("Create media property"),
            onSelect: () => setAddMediaPropertyOpen(true),
          }}
        />
      </div>
      <AddMediaPropertyModal
        open={addMediaPropertyOpen}
        onOpenChange={setAddMediaPropertyOpen}
        onCreated={mediaProperty => setMediaPropertyId(mediaProperty.id)}
      />

      {createPodcast.isError
        ? <p className="text-sm text-destructive">{createPodcast.error.message}</p>
        : null}

      <Button
        type="submit"
        disabled={createPodcast.isPending || name.trim().length === 0}
      >
        {createPodcast.isPending ? t("Creating…") : t("Create podcast")}
      </Button>
    </form>
  );
}
