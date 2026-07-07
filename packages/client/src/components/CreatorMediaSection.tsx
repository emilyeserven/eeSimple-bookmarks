import type { PlexItemResult } from "@eesimple/types";

import { useState } from "react";

import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PlexItemLookup } from "./PlexItemLookup";
import { useConnectors } from "../hooks/useConnectors";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** The creator/media fields a Person or Group absorbed from the former Artists taxonomy. */
export interface CreatorMediaInput {
  year?: number | null;
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  plexItemTitle?: string | null;
}

interface CreatorMediaSectionProps {
  year: number | null;
  plexRatingKey: string | null;
  plexItemTitle: string | null;
  /** Persist a partial patch and fire a field-named toast (the caller wires its update mutation). */
  save: (input: CreatorMediaInput, fieldLabel: string) => void;
}

/**
 * The shared "media / creator" section for a Person or Group: a release year and a Plex `artist`
 * link (a person/band maps to a Plex artist — search, link, unlink). Each control saves immediately
 * via the caller-supplied `save` (no Save button), matching the edit-tab auto-save standard.
 */
export function CreatorMediaSection({
  year,
  plexRatingKey,
  plexItemTitle,
  save,
}: CreatorMediaSectionProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: connectors,
  } = useConnectors();
  const [yearDraft, setYearDraft] = useState(year?.toString() ?? "");

  function saveYear(): void {
    const trimmed = yearDraft.trim();
    const next = trimmed === "" ? null : Number(trimmed);
    if (next !== null && !Number.isFinite(next)) return;
    if (next === year) return;
    save({
      year: next,
    }, t("Year"));
  }

  function linkPlex(item: PlexItemResult): void {
    save({
      plexRatingKey: item.ratingKey,
      plexItemType: item.type,
      plexItemTitle: item.title,
      year: item.year ?? year,
    }, t("Plex link"));
  }

  function unlinkPlex(): void {
    save({
      plexRatingKey: null,
      plexItemType: null,
      plexItemTitle: null,
    }, t("Plex link"));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="creator-year">{t("Year")}</Label>
        <Input
          id="creator-year"
          type="number"
          inputMode="numeric"
          placeholder={t("Optional release year")}
          value={yearDraft}
          onChange={e => setYearDraft(e.target.value)}
          onBlur={saveYear}
          className="max-w-40"
        />
      </div>

      {connectors?.plex.enabled && (
        <div className="space-y-1">
          <Label>{t("Plex link")}</Label>
          {plexRatingKey
            ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="rounded-sm bg-muted px-2 py-1">
                  {plexItemTitle ?? t("Linked to Plex")}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={unlinkPlex}
                >
                  <X className="size-4" />
                  {t("Unlink")}
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
    </div>
  );
}
