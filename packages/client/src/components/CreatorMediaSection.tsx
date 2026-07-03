import type { PlexItemResult } from "@eesimple/types";

import { useState } from "react";

import { X } from "lucide-react";

import { MultiCombobox } from "./MultiCombobox";
import { PlexItemLookup } from "./PlexItemLookup";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useAlbums } from "../hooks/useAlbums";
import { useConnectors } from "../hooks/useConnectors";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/** The creator/media fields a Person or Group absorbed from the former Artists taxonomy. */
export interface CreatorMediaInput {
  year?: number | null;
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  plexItemTitle?: string | null;
  albumIds?: string[];
}

interface CreatorMediaSectionProps {
  year: number | null;
  plexRatingKey: string | null;
  plexItemTitle: string | null;
  albumIds: string[];
  /** Persist a partial patch and fire a field-named toast (the caller wires its update mutation). */
  save: (input: CreatorMediaInput, fieldLabel: string) => void;
}

/**
 * The shared "media / creator" section for a Person or Group: a release year, a Plex `artist`
 * link (a person/band maps to a Plex artist — search, link, unlink), and the albums this creator is
 * credited on. Each control saves immediately via the caller-supplied `save` (no Save button),
 * matching the edit-tab auto-save standard.
 */
export function CreatorMediaSection({
  year,
  plexRatingKey,
  plexItemTitle,
  albumIds,
  save,
}: CreatorMediaSectionProps) {
  const {
    data: albums,
  } = useAlbums();
  const {
    data: connectors,
  } = useConnectors();
  const [yearDraft, setYearDraft] = useState(year?.toString() ?? "");

  const albumCreate = useEntityCreateOption("album", (album) => {
    if (albumIds.includes(album.id)) return;
    save({
      albumIds: [...albumIds, album.id],
    }, "Albums");
  });

  function saveYear(): void {
    const trimmed = yearDraft.trim();
    const next = trimmed === "" ? null : Number(trimmed);
    if (next !== null && !Number.isFinite(next)) return;
    if (next === year) return;
    save({
      year: next,
    }, "Year");
  }

  function linkPlex(item: PlexItemResult): void {
    save({
      plexRatingKey: item.ratingKey,
      plexItemType: item.type,
      plexItemTitle: item.title,
      year: item.year ?? year,
    }, "Plex link");
  }

  function unlinkPlex(): void {
    save({
      plexRatingKey: null,
      plexItemType: null,
      plexItemTitle: null,
    }, "Plex link");
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="creator-year">Year</Label>
        <Input
          id="creator-year"
          type="number"
          inputMode="numeric"
          placeholder="Optional release year"
          value={yearDraft}
          onChange={e => setYearDraft(e.target.value)}
          onBlur={saveYear}
          className="max-w-40"
        />
      </div>

      {connectors?.plex.enabled && (
        <div className="space-y-1">
          <Label>Plex link</Label>
          {plexRatingKey
            ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="rounded-sm bg-muted px-2 py-1">
                  {plexItemTitle ?? "Linked to Plex"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={unlinkPlex}
                >
                  <X className="size-4" />
                  Unlink
                </Button>
              </div>
            )
            : (
              <PlexItemLookup
                kind="artist"
                onSelect={linkPlex}
              />
            )}
        </div>
      )}

      <Separator />

      <div className="space-y-1">
        <Label>Albums</Label>
        <MultiCombobox
          options={(albums ?? []).map(a => ({
            value: a.id,
            label: a.name,
          }))}
          values={albumIds}
          onValuesChange={ids => save({
            albumIds: ids,
          }, "Albums")}
          placeholder="Select albums…"
          searchPlaceholder="Search albums…"
          emptyText="No albums found."
          createOption={albumCreate.createOption}
        />
        {albumCreate.modal}
      </div>
    </div>
  );
}
