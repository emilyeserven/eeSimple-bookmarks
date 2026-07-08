/* eslint-disable react-refresh/only-export-components -- this file pairs the provider component with
   its `useBookmarkPropertiesFormContext` reader hook + the shared value type, the standard React
   context module shape (mirrors `BookmarkGeneralFormContext`) */
import type { useBookmarkPropertiesForm } from "./useBookmarkPropertiesForm";
import type { Bookmark } from "@eesimple/types";
import type { ReactNode } from "react";

import { createContext, useContext } from "react";

import { useBookmarkPropertiesForm as useBookmarkPropertiesFormHook } from "./useBookmarkPropertiesForm";

/**
 * Shares the **one** `useBookmarkPropertiesForm` controller across the bookmark's now-granular
 * per-property edit fields (#1163+ custom-property field extraction). The layout render seam
 * (`LayoutDrivenTabBody`) invokes each field's `edit` renderer as a plain call, so N independent
 * per-property field components would each spin up their own controller — and since the controller
 * debounce-persists the **whole** property value set in one PATCH, N instances would clobber each
 * other's saves and each fire its own "Properties" toast. Instead the single controller is
 * instantiated **once** here and read by every per-property (and the YouTube-metadata) edit field via
 * {@link useBookmarkPropertiesFormContext}. View fields need no context (they read the entity directly).
 *
 * Mounted by `BookmarkEditView` around the edit body whenever the active tab hosts a custom-property
 * field (or the YouTube-metadata field), so the controller mounts exactly where those fields live and
 * follows them if an operator relocates them via Page Layouts — the same pattern as
 * `BookmarkGeneralFormContext`.
 */
export type BookmarkPropertiesFormContextValue = ReturnType<typeof useBookmarkPropertiesForm>;

const BookmarkPropertiesFormContext = createContext<BookmarkPropertiesFormContextValue | null>(null);

export function BookmarkPropertiesFormProvider({
  bookmark,
  children,
}: {
  bookmark: Bookmark;
  children: ReactNode;
}) {
  const ctrl = useBookmarkPropertiesFormHook(bookmark);
  return (
    <BookmarkPropertiesFormContext.Provider value={ctrl}>
      {children}
    </BookmarkPropertiesFormContext.Provider>
  );
}

export function useBookmarkPropertiesFormContext(): BookmarkPropertiesFormContextValue {
  const value = useContext(BookmarkPropertiesFormContext);
  if (!value) {
    throw new Error("useBookmarkPropertiesFormContext must be used within a BookmarkPropertiesFormProvider");
  }
  return value;
}
