import type { ComboboxOption } from "./Combobox";
import type { AncestorDraft } from "./locationFormSchema";
import type { Location, LocationNode } from "@eesimple/types";

import { useState } from "react";

import { LocationAncestorChainEditor } from "./LocationAncestorChainEditor";
import { ancestorToInput, splitAncestorChain } from "./locationFormSchema";
import { useSetLocationAncestors } from "../hooks/useLocations";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

import { Button } from "@/components/ui/button";

interface LocationAncestorsSectionProps {
  /** The location being edited. */
  node: LocationNode;
  /** Existing locations selectable as ancestors (the node's own subtree already excluded). */
  existingOptions: ComboboxOption[];
  /** Called with the updated location after a successful reparent, so the form can resync. */
  onReparented?: (updated: Location) => void;
}

/**
 * Edit-page counterpart to the create form's ancestor-chain editor: builds (or reuses) higher-level
 * locations **above an existing location** and, on save, reparents it under the nearest resolved
 * ancestor. Unlike the per-field auto-save elsewhere on the General tab, this is an explicit Save
 * because it's a multi-location create-and-reparent operation, not a single-field PATCH.
 */
export function LocationAncestorsSection({
  node, existingOptions, onReparented,
}: LocationAncestorsSectionProps) {
  const setAncestors = useSetLocationAncestors();
  const [draft, setDraft] = useState<AncestorDraft[]>([]);

  const {
    newAncestors, parentId,
  } = splitAncestorChain(draft);
  const hasChange = newAncestors.length > 0 || parentId != null;

  function save() {
    setAncestors.mutate(
      {
        id: node.id,
        input: {
          ancestors: newAncestors.map(ancestorToInput),
          parentId,
        },
      },
      {
        onSuccess: (updated) => {
          notifyFieldSaved("Ancestors");
          setDraft([]);
          onReparented?.(updated);
        },
        onError: error => notifyFieldSaveError(
          "Ancestors",
          error instanceof Error ? error.message : undefined,
        ),
      },
    );
  }

  return (
    <div className="space-y-3">
      <LocationAncestorChainEditor
        value={draft}
        onChange={setDraft}
        existingOptions={existingOptions}
      />
      <Button
        type="button"
        size="sm"
        disabled={!hasChange || setAncestors.isPending}
        onClick={save}
      >
        {setAncestors.isPending ? "Saving…" : "Save ancestors"}
      </Button>
    </div>
  );
}
