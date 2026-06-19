import type { MediaType } from "@eesimple/types";

import { useState } from "react";

import { LabeledSection } from "./LabeledSection";
import { useDeleteMediaType, useUpdateMediaType } from "../hooks/useMediaTypes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/** A single editable media-type row: rename and/or reorder. Built-ins can't be renamed or deleted. */
export function MediaTypeRow({
  mediaType,
  onSaved,
}: { mediaType: MediaType;
  onSaved?: () => void; }) {
  const updateMediaType = useUpdateMediaType();
  const deleteMediaType = useDeleteMediaType();
  const [name, setName] = useState(mediaType.name);
  const [sortOrder, setSortOrder] = useState(String(mediaType.sortOrder));

  const parsedSort = Number(sortOrder);
  const dirty
    = name.trim() !== mediaType.name
      || (Number.isFinite(parsedSort) && parsedSort !== mediaType.sortOrder);
  const valid = name.trim().length > 0 && Number.isFinite(parsedSort);

  function save(): void {
    if (!dirty || !valid || mediaType.builtIn) return;
    updateMediaType.mutate(
      {
        id: mediaType.id,
        input: {
          name: name.trim(),
          sortOrder: parsedSort,
        },
      },
      {
        onSuccess: () => onSaved?.(),
      },
    );
  }

  return (
    <div className="space-y-6">
      <LabeledSection title="Details">
        <div
          className="
            grid gap-3
            sm:grid-cols-[1fr_8rem_auto] sm:items-end
          "
        >
          <div className="space-y-1">
            <Label htmlFor={`media-type-name-${mediaType.id}`}>Name</Label>
            <Input
              id={`media-type-name-${mediaType.id}`}
              value={name}
              disabled={mediaType.builtIn}
              onChange={event => setName(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`media-type-sort-${mediaType.id}`}>Sort order</Label>
            <Input
              id={`media-type-sort-${mediaType.id}`}
              type="number"
              value={sortOrder}
              disabled={mediaType.builtIn}
              onChange={event => setSortOrder(event.target.value)}
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!dirty || !valid || mediaType.builtIn || updateMediaType.isPending}
            onClick={save}
          >
            {updateMediaType.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
        {mediaType.builtIn
          ? (
            <p className="text-xs text-muted-foreground">
              Built-in media type — it can&apos;t be renamed or deleted.
            </p>
          )
          : null}
      </LabeledSection>

      {mediaType.builtIn
        ? null
        : (
          <>
            <Separator />
            <LabeledSection
              title="Delete"
              description="Permanently remove this media type."
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="
                  text-destructive
                  hover:text-destructive
                "
                disabled={deleteMediaType.isPending}
                onClick={() => deleteMediaType.mutate(mediaType.id)}
              >
                {deleteMediaType.isPending ? "Deleting…" : "Delete"}
              </Button>
            </LabeledSection>
          </>
        )}

      {updateMediaType.isError
        ? <p className="text-sm text-destructive">{updateMediaType.error.message}</p>
        : null}
      {deleteMediaType.isError
        ? <p className="text-sm text-destructive">{deleteMediaType.error.message}</p>
        : null}
    </div>
  );
}
