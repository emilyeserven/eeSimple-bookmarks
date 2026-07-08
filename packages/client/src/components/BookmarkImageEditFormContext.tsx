/* eslint-disable react-refresh/only-export-components -- this file pairs the provider component with
   its `useBookmarkImageEditFormContext` reader hook, the standard React context module shape (mirrors
   `BookmarkGeneralFormContext` / `BookmarkPropertiesFormContext`) */
import type { BookmarkImageEditFormController } from "./useBookmarkImageEditForm";
import type { Bookmark } from "@eesimple/types";
import type { ReactNode } from "react";

import { createContext, useContext } from "react";

import { useBookmarkImageEditForm } from "./useBookmarkImageEditForm";

/**
 * Shares the **one** `useBookmarkImageEditForm` controller across the bookmark Image tab's now-granular
 * fields (#1163+): the image picker, the import/Save action buttons, the cover-display toggle, and the
 * page-screenshot section. The controller stages a single {@link BookmarkImageEditFormController} image
 * intent and persists it on Save, so all four fields must read **one** instance — N independent field
 * components would each stage their own intent and have their own Save. Instantiated once here and read
 * via {@link useBookmarkImageEditFormContext}; mounted by `BookmarkEditView` around the edit body
 * whenever the active tab hosts an image field (the same gate pattern as the General/Properties forms).
 */
const BookmarkImageEditFormContext = createContext<BookmarkImageEditFormController | null>(null);

export function BookmarkImageEditFormProvider({
  bookmark,
  children,
}: {
  bookmark: Bookmark;
  children: ReactNode;
}) {
  const controller = useBookmarkImageEditForm(bookmark);
  return (
    <BookmarkImageEditFormContext.Provider value={controller}>
      {children}
    </BookmarkImageEditFormContext.Provider>
  );
}

export function useBookmarkImageEditFormContext(): BookmarkImageEditFormController {
  const value = useContext(BookmarkImageEditFormContext);
  if (!value) {
    throw new Error("useBookmarkImageEditFormContext must be used within a BookmarkImageEditFormProvider");
  }
  return value;
}
