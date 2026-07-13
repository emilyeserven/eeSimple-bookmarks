import { useNavigate } from "@tanstack/react-router";

import { AddMediaTypeModal } from "./AddMediaTypeModal";
import { AddTagModal } from "./AddTagModal";
import { AddTaxonomyTermModal } from "./AddTaxonomyTermModal";

type AddChildModalProps = ({ kind: "tag" | "mediaType";
  /** The current entity's id — becomes the new child's fixed parent. Undefined while loading. */
  parentId: string | undefined; }
  | { kind: "taxonomyTerm";
    /** The current term's id — becomes the new child term's fixed parent. Undefined while loading. */
    parentId: string | undefined;
    taxonomyId: string | undefined;
    taxonomySlug: string; })
  & {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  };

/**
 * The quick-create-child modal for a hierarchy taxonomy, with the parent fixed to the current entity
 * and a navigate-to-the-new-child on success. Shared by {@link AddChildButton} (desktop) and the
 * header More menu's mobile entry.
 */
export function AddChildModal(props: AddChildModalProps) {
  const {
    open, onOpenChange,
  } = props;
  const navigate = useNavigate();

  if (props.kind === "tag") {
    return (
      <AddTagModal
        open={open}
        onOpenChange={onOpenChange}
        showParent={false}
        defaultParentId={props.parentId}
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

  if (props.kind === "taxonomyTerm") {
    const {
      taxonomyId, taxonomySlug, parentId,
    } = props;
    if (!taxonomyId) return null;
    return (
      <AddTaxonomyTermModal
        taxonomyId={taxonomyId}
        open={open}
        onOpenChange={onOpenChange}
        defaultParentId={parentId}
        onCreated={(term) => {
          void navigate({
            to: "/taxonomies/$taxonomyKey/$termSlug/edit",
            params: {
              taxonomyKey: taxonomySlug,
              termSlug: term.slug,
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
      defaultParentId={props.parentId}
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
