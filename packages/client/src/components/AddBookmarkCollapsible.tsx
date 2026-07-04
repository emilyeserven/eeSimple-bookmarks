import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BookmarkForm } from "./BookmarkForm";
import { useUiStore } from "../stores/uiStore";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AddBookmarkCollapsibleProps {
  /** When set, locks the form to this category and hides its Category picker. */
  lockedCategoryId?: string;
}

/**
 * The collapsible "Add Bookmark" card used at the top of the bookmark listings and (optionally) the
 * homepage. Open state is shared across surfaces via the UI store so the form's expanded/collapsed
 * preference is remembered wherever it appears.
 */
export function AddBookmarkCollapsible({
  lockedCategoryId,
}: AddBookmarkCollapsibleProps) {
  const {
    t,
  } = useTranslation();
  const addBookmarkFormOpen = useUiStore(state => state.addBookmarkFormOpen);
  const setAddBookmarkFormOpen = useUiStore(state => state.setAddBookmarkFormOpen);

  return (
    <Collapsible
      open={addBookmarkFormOpen}
      onOpenChange={setAddBookmarkFormOpen}
      className="group/add-bookmark rounded-lg border bg-card"
    >
      <CollapsibleTrigger
        className="
          flex w-full items-center justify-between p-4 text-sm font-medium
          hover:text-foreground
        "
      >
        {t("Add Bookmark")}
        <ChevronDown
          className="
            size-4 transition-transform
            group-data-[state=open]/add-bookmark:rotate-180
          "
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <BookmarkForm lockedCategoryId={lockedCategoryId} />
      </CollapsibleContent>
    </Collapsible>
  );
}
