import type { useBookmarkTaxonomyContext } from "./useBookmarkTaxonomyContext";
import type { Bookmark } from "@eesimple/types";

import { AddBookmarkModal } from "./AddBookmarkModal";
import { AddCategoryModal } from "./AddCategoryModal";
import { AddCustomPropertyModal } from "./AddCustomPropertyModal";
import { AddLocationModal } from "./AddLocationModal";
import { AddMediaTypeModal } from "./AddMediaTypeModal";
import { AddNewsletterModal } from "./AddNewsletterModal";
import { AddPersonModal } from "./AddPersonModal";
import { AddPropertyGroupModal } from "./AddPropertyGroupModal";
import { AddTagModal } from "./AddTagModal";
import { AddWebsiteModal } from "./AddWebsiteModal";
import { AddYouTubeChannelModal } from "./AddYouTubeChannelModal";

export type CreateKind
  = | "category"
    | "tag"
    | "media-type"
    | "person"
    | "website"
    | "property-group"
    | "youtube-channel"
    | "newsletter"
    | "location"
    | "custom-property";

/**
 * Every modal the command palette can open: the Add Bookmark draft plus the inline-create modals for
 * each entity kind. Extracted so `CommandPalette` keeps a small import surface.
 */
export function CommandPaletteModals({
  addBookmarkOpen,
  setAddBookmarkOpen,
  pendingUrl,
  createKind,
  assignOnCreate,
  closeCreate,
  bookmarkId,
  bookmark,
  updateBookmark,
}: {
  addBookmarkOpen: boolean;
  setAddBookmarkOpen: (open: boolean) => void;
  pendingUrl: string;
  createKind: CreateKind | null;
  assignOnCreate: boolean;
  closeCreate: () => void;
  bookmarkId: string | null;
  bookmark: Bookmark | undefined;
  updateBookmark: ReturnType<typeof useBookmarkTaxonomyContext>["updateBookmark"];
}) {
  return (
    <>
      <AddBookmarkModal
        open={addBookmarkOpen}
        onOpenChange={setAddBookmarkOpen}
        initialUrl={pendingUrl}
        autoScan={Boolean(pendingUrl)}
      />

      <AddCategoryModal
        open={createKind === "category"}
        onOpenChange={open => !open && closeCreate()}
        onCreated={assignOnCreate && bookmarkId
          ? cat => updateBookmark.mutate({
            id: bookmarkId,
            input: {
              categoryId: cat.id,
            },
          })
          : undefined}
      />
      <AddTagModal
        open={createKind === "tag"}
        onOpenChange={open => !open && closeCreate()}
        onCreated={assignOnCreate && bookmarkId && bookmark
          ? tag => updateBookmark.mutate({
            id: bookmarkId,
            input: {
              tagIds: [...bookmark.tags.map(t => t.id), tag.id],
            },
          })
          : undefined}
      />
      <AddMediaTypeModal
        open={createKind === "media-type"}
        onOpenChange={open => !open && closeCreate()}
        onCreated={assignOnCreate && bookmarkId
          ? mt => updateBookmark.mutate({
            id: bookmarkId,
            input: {
              mediaTypeId: mt.id,
            },
          })
          : undefined}
      />
      <AddPersonModal
        open={createKind === "person"}
        onOpenChange={open => !open && closeCreate()}
        onCreated={assignOnCreate && bookmarkId && bookmark
          ? person => updateBookmark.mutate({
            id: bookmarkId,
            input: {
              personIds: [...bookmark.people.map(a => a.id), person.id],
            },
          })
          : undefined}
      />
      <AddWebsiteModal
        open={createKind === "website"}
        onOpenChange={open => !open && closeCreate()}
      />
      <AddPropertyGroupModal
        open={createKind === "property-group"}
        onOpenChange={open => !open && closeCreate()}
      />
      <AddCustomPropertyModal
        open={createKind === "custom-property"}
        onOpenChange={open => !open && closeCreate()}
      />
      <AddYouTubeChannelModal
        open={createKind === "youtube-channel"}
        onOpenChange={open => !open && closeCreate()}
      />
      <AddNewsletterModal
        open={createKind === "newsletter"}
        onOpenChange={open => !open && closeCreate()}
        onCreated={assignOnCreate && bookmarkId
          ? nl => updateBookmark.mutate({
            id: bookmarkId,
            input: {
              newsletterId: nl.id,
            },
          })
          : undefined}
      />
      <AddLocationModal
        open={createKind === "location"}
        onOpenChange={open => !open && closeCreate()}
        onCreated={assignOnCreate && bookmarkId && bookmark
          ? location => updateBookmark.mutate({
            id: bookmarkId,
            input: {
              locationIds: [...bookmark.locations.map(l => l.id), location.id],
            },
          })
          : undefined}
      />
    </>
  );
}
