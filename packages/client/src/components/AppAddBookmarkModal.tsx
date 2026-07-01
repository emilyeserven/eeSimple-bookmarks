import { AddBookmarkModal } from "./AddBookmarkModal";
import { useUiStore } from "../stores/uiStore";

/**
 * The single, app-level Add Bookmark modal opened from the header Plus button on listing pages.
 * Driven by the transient `addBookmarkModal` uiStore field so it lives outside the (mobile) header
 * dropdown menu — the modal survives the menu closing. A `categoryId` locks the new bookmark to a
 * category (the category-page prefill).
 */
export function AppAddBookmarkModal() {
  const addBookmarkModal = useUiStore(state => state.addBookmarkModal);
  const closeAddBookmarkModal = useUiStore(state => state.closeAddBookmarkModal);

  return (
    <AddBookmarkModal
      open={addBookmarkModal !== null}
      onOpenChange={open => !open && closeAddBookmarkModal()}
      lockedCategoryId={addBookmarkModal?.categoryId}
    />
  );
}
