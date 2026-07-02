import { useState } from "react";

import { useCreateRelationshipType } from "../hooks/useRelationshipTypes";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddRelationshipTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Name + directional modal to create a relationship type, opened from the header create button
 * (a two-field sibling of the name-only `InlineCreateModal` wrappers).
 */
export function AddRelationshipTypeModal({
  open, onOpenChange,
}: AddRelationshipTypeModalProps) {
  const create = useCreateRelationshipType();
  const [name, setName] = useState("");
  const [directional, setDirectional] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    create.mutate(
      {
        name: trimmed,
        directional,
      },
      {
        onError: err => setError(err.message),
        onSuccess: () => {
          setName("");
          setDirectional(false);
          setError(null);
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New relationship type</DialogTitle>
          <DialogDescription>
            Directional types read as parent → child and power the Hierarchy view; symmetric types
            read the same from either bookmark.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="new-relationship-type">Name</Label>
            <Input
              id="new-relationship-type"
              value={name}
              placeholder="e.g. Inspiration"
              onChange={e => setName(e.target.value)}
            />
          </div>
          <label
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Checkbox
              checked={directional}
              onCheckedChange={checked => setDirectional(checked === true)}
              aria-label="Directional"
            />
            Directional
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button
              type="submit"
              disabled={create.isPending || name.trim().length === 0}
            >
              {create.isPending ? "Adding…" : "Add relationship type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
