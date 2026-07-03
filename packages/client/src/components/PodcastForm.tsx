import type { Podcast, PodcastSearchResult } from "@eesimple/types";

import { useState } from "react";

import { AddMediaPropertyModal } from "./AddMediaPropertyModal";
import { PodcastSearchPicker } from "./PodcastSearchPicker";
import { useMediaProperties } from "../hooks/useMediaProperties";
import { useCreatePodcast } from "../hooks/usePodcasts";

import { Combobox } from "@/components/Combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const createPodcast = useCreatePodcast();
  const {
    data: mediaProperties,
  } = useMediaProperties();

  const [name, setName] = useState("");
  const [romanizedName, setRomanizedName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [mediaPropertyId, setMediaPropertyId] = useState<string>("");
  const [addMediaPropertyOpen, setAddMediaPropertyOpen] = useState(false);
  // Apple Podcasts linkage captured from the search picker, persisted on create.
  const [itunesId, setItunesId] = useState<number | null>(null);
  const [itunesUrl, setItunesUrl] = useState<string | null>(null);

  /** Prefill the form from a chosen Apple Podcasts result (feed/iTunes linkage held for the create call). */
  function applyPickedPodcast(result: PodcastSearchResult): void {
    setName(result.name);
    setAuthor(result.author ?? "");
    setFeedUrl(result.feedUrl ?? "");
    setItunesId(result.itunesId);
    setItunesUrl(result.itunesUrl);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    createPodcast.mutate(
      {
        name: trimmed,
        romanizedName: romanizedName.trim() || null,
        mediaPropertyId: mediaPropertyId || null,
        feedUrl: feedUrl.trim() || null,
        author: author.trim() || null,
        description: description.trim() || null,
        itunesId,
        itunesUrl,
      },
      {
        onSuccess: (podcast) => {
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
        <Label htmlFor="podcast-name">Name</Label>
        <Input
          id="podcast-name"
          placeholder="e.g. Reply All"
          value={name}
          onChange={event => setName(event.target.value)}
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="podcast-romanized-name">Romanized name</Label>
        <Input
          id="podcast-romanized-name"
          placeholder="Optional romanized form"
          value={romanizedName}
          onChange={event => setRomanizedName(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="podcast-feed-url">Feed URL</Label>
        <Input
          id="podcast-feed-url"
          placeholder="https://example.com/feed.xml"
          value={feedUrl}
          onChange={event => setFeedUrl(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="podcast-author">Author</Label>
        <Input
          id="podcast-author"
          placeholder="Host or publisher"
          value={author}
          onChange={event => setAuthor(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="podcast-description">Description</Label>
        <Textarea
          id="podcast-description"
          placeholder="Optional description"
          value={description}
          onChange={event => setDescription(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Media property</Label>
        <Combobox
          aria-label="Media property"
          options={(mediaProperties ?? []).map(prop => ({
            value: prop.id,
            label: prop.name,
          }))}
          value={mediaPropertyId || undefined}
          onValueChange={value => setMediaPropertyId(value ?? "")}
          placeholder="No media property"
          searchPlaceholder="Search media properties…"
          emptyText="No media properties found."
          createOption={{
            label: "Create media property",
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
        {createPodcast.isPending ? "Creating…" : "Create podcast"}
      </Button>
    </form>
  );
}
