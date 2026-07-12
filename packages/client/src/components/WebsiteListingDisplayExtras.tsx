import { useTranslation } from "react-i18next";

import { PruneEmptyButton } from "./PruneEmptyButton";

import { useBulkDeleteWebsites, useWebsites } from "@/hooks/useWebsites";

/**
 * The Websites listing's Prune-empty control, rendered in the display-options box
 * (config `renderDisplayRowExtra`), beside the shared Multiselect toggle.
 */
export function WebsiteListingDisplayExtras() {
  const {
    t,
  } = useTranslation();
  const {
    data: websites,
  } = useWebsites();
  const bulkDelete = useBulkDeleteWebsites();
  const emptyIds = (websites ?? [])
    .filter(w => !w.builtIn && (w.bookmarkCount ?? 0) === 0)
    .map(w => w.id);

  return (
    <PruneEmptyButton
      ids={emptyIds}
      isPending={bulkDelete.isPending}
      onPrune={(ids, cb) => bulkDelete.mutate(ids, cb)}
      noun={[t("website"), t("websites")]}
    />
  );
}
