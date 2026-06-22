import { useState } from "react";

import { Plus } from "lucide-react";

import { AddChildModal } from "./AddChildModal";

import { Button } from "@/components/ui/button";

interface AddChildButtonProps {
  /** Which hierarchy taxonomy the current detail page belongs to. */
  kind: "tag" | "mediaType";
  /** The current entity's id — becomes the new child's fixed parent. Undefined while loading. */
  parentId: string | undefined;
}

/**
 * Header button (rendered just left of the panel toggle) on a hierarchy-taxonomy *detail* page that
 * quick-creates a child of the current entity, with the parent fixed to it. Keeps its own modal
 * state so `AppHeader` stays lean. Disabled until the parent id resolves.
 */
export function AddChildButton({
  kind, parentId,
}: AddChildButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={kind === "tag" ? "New sub-tag" : "New sub-type"}
        title={kind === "tag" ? "New sub-tag" : "New sub-type"}
        disabled={!parentId}
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
      </Button>

      <AddChildModal
        kind={kind}
        parentId={parentId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
