/* eslint-disable react-refresh/only-export-components -- this file pairs the provider component with
   its `useBookmarkGeneralFormContext` reader hook + the shared value type, the standard React context
   module shape */
import type { useBookmarkGeneralForm } from "./useBookmarkGeneralForm";
import type { usePrimaryLanguageField } from "../hooks/usePrimaryLanguageField";
import type { Bookmark } from "@eesimple/types";
import type { ReactNode } from "react";

import { createContext, useContext } from "react";

import { useBookmarkGeneralForm as useBookmarkGeneralFormHook } from "./useBookmarkGeneralForm";
import { useBookmarkSyncRegistration } from "../hooks/useBookmarkSyncRegistration";
import { usePrimaryLanguageField as usePrimaryLanguageFieldHook } from "../hooks/usePrimaryLanguageField";

/**
 * Shares the **one** `useBookmarkGeneralForm` controller across the bookmark General tab's now-granular
 * edit fields (#1163 field extraction). The layout render seam (`LayoutDrivenTabBody`) invokes each
 * field's `edit` renderer as a plain call, so N independent field components would each spin up N
 * separate `useAppForm` instances and lose the form's cross-field coordination (name-blur autofill,
 * website-lookup → autofill offer → category, primary-language sync). Instead the shared controller —
 * plus the react-query-backed primary-language field and the header "Sync from source" registration —
 * is instantiated **once** here and read by every granular edit field via
 * {@link useBookmarkGeneralFormContext}. View fields need no context (they read the entity directly).
 *
 * Mounted by `BookmarkEditView` around the edit body only when the active tab hosts a shared-form field,
 * so the controller + sync registration keep mounting exactly where `BookmarkGeneralForm` used to
 * (the General tab by default), while staying correct if an operator relocates the fields via Page
 * Layouts. This is the reusable pattern for extracting a shared-`useAppForm` composite — see the
 * `surface-entity-field` skill ("Extraction (reverse direction)").
 */
export interface BookmarkGeneralFormContextValue {
  ctrl: ReturnType<typeof useBookmarkGeneralForm>;
  primaryLanguage: ReturnType<typeof usePrimaryLanguageField>;
}

const BookmarkGeneralFormContext = createContext<BookmarkGeneralFormContextValue | null>(null);

export function BookmarkGeneralFormProvider({
  bookmark,
  children,
}: {
  bookmark: Bookmark;
  children: ReactNode;
}) {
  const ctrl = useBookmarkGeneralFormHook(bookmark);
  const primaryLanguage = usePrimaryLanguageFieldHook("bookmark", bookmark.id);

  // Register the header "Sync from source" button for this bookmark (re-scan its URL). Staged
  // Title/Description values persist through the same per-field auto-save the form's fields use.
  useBookmarkSyncRegistration({
    bookmark,
    form: ctrl.form,
    onFieldStaged: () => {
      ctrl.saveTitle();
      ctrl.saveDescription();
    },
  });

  return (
    <BookmarkGeneralFormContext.Provider
      value={{
        ctrl,
        primaryLanguage,
      }}
    >
      {children}
    </BookmarkGeneralFormContext.Provider>
  );
}

export function useBookmarkGeneralFormContext(): BookmarkGeneralFormContextValue {
  const value = useContext(BookmarkGeneralFormContext);
  if (!value) {
    throw new Error("useBookmarkGeneralFormContext must be used within a BookmarkGeneralFormProvider");
  }
  return value;
}
