import type { AncestorDraft } from "./locationFormSchema";
import type { LocationLookupCandidate } from "@eesimple/types";

import { emptyAncestorDraft } from "./locationFormSchema";
import { LocationLookupBox } from "./LocationLookupBox";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LocationAncestorChainEditorProps {
  /** Ancestors ordered immediate-parent-first up to the root. */
  value: AncestorDraft[];
  onChange: (next: AncestorDraft[]) => void;
}

/**
 * Lets the user build a higher-level ancestor chain for a new location (e.g. Hagi → Yamaguchi
 * Prefecture → … → Japan). Each ancestor has its own name and an optional lookup that prefills its
 * coordinates/metadata. On submit the caller passes these to `useCreateLocationChain`.
 */
export function LocationAncestorChainEditor({
  value, onChange,
}: LocationAncestorChainEditorProps) {
  function updateRow(index: number, patch: Partial<AncestorDraft>) {
    onChange(value.map((row, i) => (i === index
      ? {
        ...row,
        ...patch,
      }
      : row)));
  }

  function applyCandidate(index: number, candidate: LocationLookupCandidate) {
    updateRow(index, {
      name: candidate.name,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      mapUrl: candidate.mapUrl,
      placeType: candidate.placeType,
      countryCode: candidate.countryCode,
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Ancestors</Label>
        <p className="text-xs text-muted-foreground">
          Optionally add higher-level locations, from the immediate parent up to the root. They&apos;re
          created (or reused) when you save.
        </p>
      </div>
      {value.map((row, index) => (
        <div
          key={index}
          className="space-y-2 rounded-md border p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {index === 0 ? "Immediate parent" : `Level ${index + 1}`}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              Remove
            </Button>
          </div>
          <Input
            aria-label={`Ancestor ${index + 1} name`}
            placeholder="Name (e.g. Yamaguchi Prefecture)"
            value={row.name}
            onChange={event => updateRow(index, {
              name: event.target.value,
            })}
          />
          <LocationLookupBox onSelect={candidate => applyCandidate(index, candidate)} />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...value, emptyAncestorDraft()])}
      >
        Add ancestor
      </Button>
    </div>
  );
}
