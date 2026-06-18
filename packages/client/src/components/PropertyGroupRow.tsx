import type { PropertyGroup } from "@eesimple/types";

import { useState } from "react";

import { LabeledSection } from "./LabeledSection";
import { useDeletePropertyGroup, useUpdatePropertyGroup } from "../hooks/usePropertyGroups";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

/** A single editable property-group row: rename, reprioritize, re-describe, and delete. */
export function PropertyGroupRow({
  group,
  onSaved,
}: { group: PropertyGroup;
  onSaved?: () => void; }) {
  const updateGroup = useUpdatePropertyGroup();
  const deleteGroup = useDeletePropertyGroup();
  const [name, setName] = useState(group.name);
  const [priority, setPriority] = useState(String(group.priority));
  const [description, setDescription] = useState(group.description ?? "");

  const parsedPriority = Number(priority);
  const dirty
    = name.trim() !== group.name
      || (Number.isFinite(parsedPriority) && parsedPriority !== group.priority)
      || description.trim() !== (group.description ?? "");
  const valid = name.trim().length > 0 && Number.isFinite(parsedPriority);

  function save(): void {
    if (!dirty || !valid) return;
    updateGroup.mutate(
      {
        id: group.id,
        input: {
          name: name.trim(),
          priority: parsedPriority,
          description: description.trim() || null,
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
        <div className="space-y-3">
          <div
            className="
              grid gap-3
              sm:grid-cols-[1fr_8rem_auto] sm:items-end
            "
          >
            <div className="space-y-1">
              <Label htmlFor={`property-group-name-${group.id}`}>Name</Label>
              <Input
                id={`property-group-name-${group.id}`}
                value={name}
                onChange={event => setName(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`property-group-priority-${group.id}`}>Priority</Label>
              <Input
                id={`property-group-priority-${group.id}`}
                type="number"
                value={priority}
                onChange={event => setPriority(event.target.value)}
              />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!dirty || !valid || updateGroup.isPending}
              onClick={save}
            >
              {updateGroup.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`property-group-description-${group.id}`}>Description</Label>
            <Textarea
              id={`property-group-description-${group.id}`}
              rows={2}
              placeholder="Optional — what this group is for."
              value={description}
              onChange={event => setDescription(event.target.value)}
            />
          </div>
        </div>
      </LabeledSection>

      <Separator />
      <LabeledSection
        title="Delete"
        description="Permanently remove this group. Its properties become ungrouped."
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="
            text-destructive
            hover:text-destructive
          "
          disabled={deleteGroup.isPending}
          onClick={() => deleteGroup.mutate(group.id)}
        >
          {deleteGroup.isPending ? "Deleting…" : "Delete"}
        </Button>
      </LabeledSection>

      {updateGroup.isError
        ? <p className="text-sm text-destructive">{updateGroup.error.message}</p>
        : null}
      {deleteGroup.isError
        ? <p className="text-sm text-destructive">{deleteGroup.error.message}</p>
        : null}
    </div>
  );
}
