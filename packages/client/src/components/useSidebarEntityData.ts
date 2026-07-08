import { useSidebarTaxonomyData } from "./useSidebarTaxonomyData";
import { useAiSummaryQueue } from "../hooks/useAiSummarization";
import { useAutofillRules } from "../hooks/useAutofill";
import { useBookmarks } from "../hooks/useBookmarks";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useInboxItems } from "../hooks/useImports";
import { usePinnedSidebarItems } from "../hooks/usePinnedSidebarItems";
import { useSavedFilters } from "../hooks/useSavedFilters";

/** All the entity lists the sidebar renders, fetched in one place. */
export function useSidebarEntityData() {
  return {
    ...useSidebarTaxonomyData(),
    allBookmarks: useBookmarks().data,
    inboxItems: useInboxItems().data,
    aiSummaryQueue: useAiSummaryQueue().data,
    categories: useCategories().data,
    allCustomProperties: useCustomProperties().data,
    allAutofillRules: useAutofillRules().data,
    pinnedItems: usePinnedSidebarItems().data ?? [],
    savedFilters: useSavedFilters().data,
  };
}

export type SidebarEntityData = ReturnType<typeof useSidebarEntityData>;
