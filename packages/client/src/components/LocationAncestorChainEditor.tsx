import type { ComboboxOption } from "./Combobox";
import type { AncestorDraft } from "./locationFormSchema";
import type { LocationLookupCandidate } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";
import { emptyAncestorDraft } from "./locationFormSchema";
import { LocationLookupBox } from "./LocationLookupBox";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LocationAncestorChainEditorProps {
  /** Ancestors ordered immediate-parent-first up to the root. */
  value: AncestorDraft[];
  onChange: (next: AncestorDraft[]) => void;
  /** Existing locations to choose from when reusing an ancestor instead of creating one. */
  existingOptions: ComboboxOption[];
}

/**
 * Lets the user build a higher-level ancestor chain above a location (e.g. Hagi → Yamaguchi
 * Prefecture → … → Japan). Each ancestor row can either reuse an **existing** location (picked from
 * the combobox — it already has its own ancestors, so it caps the chain) or define a **new** one
 * with its own name and an optional lookup that prefills its coordinates/metadata. The caller passes
 * the chain to `useCreateLocationChain` (create form) or `useSetLocationAncestors` (edit form).
 */
export function LocationAncestorChainEditor({
  value, onChange, existingOptions,
}: LocationAncestorChainEditorProps) {
  const {
    t,
  } = useTranslation();

  function updateRow(index: number, patch: Partial<AncestorDraft>) {
    onChange(value.map((row, i) => (i === index
      ? {
        ...row,
        ...patch,
      }
      : row)));
  }

  /**
   * Pick (or clear) an existing location for a row. Selecting one caps the chain: it becomes the
   * topmost row, so any rows above it are dropped (the reused location supplies its own ancestry).
   */
  function selectExisting(index: number, existingId: string | undefined) {
    if (!existingId) {
      updateRow(index, {
        existingId: null,
      });
      return;
    }
    onChange([
      ...value.slice(0, index),
      {
        ...value[index],
        existingId,
      },
    ]);
  }

  function applyCandidate(index: number, candidate: LocationLookupCandidate) {
    updateRow(index, {
      name: candidate.name,
      // Prefill the romanized form just like the leaf form does, so an ancestor looked up
      // by a native-script name automatically carries its romanization.
      romanizedName: candidate.romanizedName,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      mapUrl: candidate.mapUrl,
      placeType: candidate.placeType,
      countryCode: candidate.countryCode,
    });
  }

  // An existing row only ever sits at the top (selecting one truncates the rows above), so the
  // chain is capped — and the "Add ancestor" button hidden — exactly when the last row is existing.
  const topRow = value[value.length - 1];
  const cappedByExisting = topRow?.existingId != null;

  return (
    <div className="space-y-3">
      <div>
        <Label>{t("Ancestors")}</Label>
        <p className="text-xs text-muted-foreground">
          {t("Optionally add higher-level locations, from the immediate parent up to the root. Pick an existing location to reuse it, or fill in a new one — new ancestors are created (or reused by name) when you save.")}
        </p>
      </div>
      {value.map((row, index) => {
        const isExisting = row.existingId != null;
        return (
          <div
            key={index}
            className="space-y-2 rounded-md border p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {index === 0
                  ? t("Immediate parent")
                  : t("Level {{level}}", {
                    level: index + 1,
                  })}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                {t("Remove")}
              </Button>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`ancestor-${index}-existing`}>{t("Use an existing location")}</Label>
              <Combobox
                id={`ancestor-${index}-existing`}
                aria-label={t("Ancestor {{number}} existing location", {
                  number: index + 1,
                })}
                options={existingOptions}
                value={row.existingId ?? ""}
                onValueChange={selected => selectExisting(index, selected)}
                placeholder={t("Choose an existing location")}
                searchPlaceholder={t("Search locations…")}
                emptyText={t("No locations found.")}
              />
            </div>
            {isExisting
              ? (
                <p className="text-xs text-muted-foreground">
                  {t("Reusing an existing location — its own ancestors are kept, so this caps the chain.")}
                </p>
              )
              : (
                <>
                  <Input
                    aria-label={t("Ancestor {{number}} name", {
                      number: index + 1,
                    })}
                    placeholder={t("Or create a new one — name (e.g. Yamaguchi Prefecture)")}
                    value={row.name}
                    onChange={event => updateRow(index, {
                      name: event.target.value,
                    })}
                  />
                  <Input
                    aria-label={t("Ancestor {{number}} romanized name", {
                      number: index + 1,
                    })}
                    placeholder={t("Romanized name (auto-filled from lookup)")}
                    value={row.romanizedName ?? ""}
                    onChange={event => updateRow(index, {
                      romanizedName: event.target.value.trim() === "" ? null : event.target.value,
                    })}
                  />
                  <LocationLookupBox onSelect={candidate => applyCandidate(index, candidate)} />
                </>
              )}
          </div>
        );
      })}
      {cappedByExisting
        ? null
        : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange([...value, emptyAncestorDraft()])}
          >
            {t("Add ancestor")}
          </Button>
        )}
    </div>
  );
}
