import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AddMediaTypeModal } from "./AddMediaTypeModal";
import { AddTagModal } from "./AddTagModal";

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
  const navigate = useNavigate();

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

      {kind === "tag"
        ? (
          <AddTagModal
            open={open}
            onOpenChange={setOpen}
            showParent={false}
            defaultParentId={parentId}
            onCreated={(tag) => {
              void navigate({
                to: "/tags/$tagSlug/edit/general",
                params: {
                  tagSlug: tag.slug,
                },
              });
            }}
          />
        )
        : (
          <AddMediaTypeModal
            open={open}
            onOpenChange={setOpen}
            defaultParentId={parentId}
            onCreated={(mediaType) => {
              void navigate({
                to: "/taxonomies/media-types/$mediaTypeSlug/edit/general",
                params: {
                  mediaTypeSlug: mediaType.slug,
                },
              });
            }}
          />
        )}
    </>
  );
}
