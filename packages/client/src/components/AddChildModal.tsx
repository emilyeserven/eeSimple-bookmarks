import { useNavigate } from "@tanstack/react-router";

import { AddMediaTypeModal } from "./AddMediaTypeModal";
import { AddTagModal } from "./AddTagModal";

interface AddChildModalProps {
  /** Which hierarchy taxonomy the current detail page belongs to. */
  kind: "tag" | "mediaType";
  /** The current entity's id — becomes the new child's fixed parent. Undefined while loading. */
  parentId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The quick-create-child modal for a hierarchy taxonomy, with the parent fixed to the current entity
 * and a navigate-to-the-new-child on success. Shared by {@link AddChildButton} (desktop) and the
 * header More menu's mobile entry.
 */
export function AddChildModal({
  kind, parentId, open, onOpenChange,
}: AddChildModalProps) {
  const navigate = useNavigate();

  if (kind === "tag") {
    return (
      <AddTagModal
        open={open}
        onOpenChange={onOpenChange}
        showParent={false}
        defaultParentId={parentId}
        onCreated={(tag) => {
          void navigate({
            to: "/tags/$tagSlug/edit",
            params: {
              tagSlug: tag.slug,
            },
          });
        }}
      />
    );
  }

  return (
    <AddMediaTypeModal
      open={open}
      onOpenChange={onOpenChange}
      defaultParentId={parentId}
      onCreated={(mediaType) => {
        void navigate({
          to: "/taxonomies/media-types/$mediaTypeSlug/edit",
          params: {
            mediaTypeSlug: mediaType.slug,
          },
        });
      }}
    />
  );
}
