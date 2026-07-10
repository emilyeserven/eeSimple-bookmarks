import { useTranslation } from "react-i18next";

import { HeaderBulkSelectButton } from "./header/HeaderBulkSelectButton";
import { PruneEmptyButton } from "./PruneEmptyButton";

import { useBulkDeleteWebsites, useWebsites } from "@/hooks/useWebsites";

const WEBSITES_PAGE_KEY = "websites-listing";

/**
 * The Websites listing's Prune-empty + Multiselect-toggle controls, rendered in the same row as
 * `ListingDisplayControls` (config `renderDisplayRowExtra`), opposite it. The Multiselect toggle
 * moves here instead of the header (`websiteListingConfig.hideBulkSelectFromHeader`), since
 * `HeaderBulkSelectButton` only needs a `pageKey` and has no header-specific dependency.
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
    <div className="flex items-center gap-2">
      <PruneEmptyButton
        ids={emptyIds}
        isPending={bulkDelete.isPending}
        onPrune={(ids, cb) => bulkDelete.mutate(ids, cb)}
        noun={[t("website"), t("websites")]}
      />
      <HeaderBulkSelectButton pageKey={WEBSITES_PAGE_KEY} />
    </div>
  );
}
