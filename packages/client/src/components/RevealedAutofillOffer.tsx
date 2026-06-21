import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { useWebsiteLookup } from "../hooks/useWebsites";
import type { Category } from "@eesimple/types";

import { BookmarkAutofillOffer } from "./BookmarkAutofillOffer";

type WebsiteLookupResult = ReturnType<typeof useWebsiteLookup>;

export interface RevealedAutofillOfferProps {
  form: BookmarkFormApi;
  websiteLookup: WebsiteLookupResult;
  lockedCategoryId?: string;
  categories: Category[];
  autofillOfferDismissed: boolean;
  onAutofillOfferDismiss: () => void;
}

/** Autofill rule offer, shown only for a new site that resolved to a domain. */
export function RevealedAutofillOffer({
  form,
  websiteLookup,
  lockedCategoryId,
  categories,
  autofillOfferDismissed,
  onAutofillOfferDismiss,
}: RevealedAutofillOfferProps) {
  if (!(websiteLookup.data?.exists === false && websiteLookup.data.domain)) {
    return null;
  }
  return (
    <form.Subscribe selector={state => state.values.categoryId}>
      {categoryId => (
        <BookmarkAutofillOffer
          domain={websiteLookup.data?.domain ?? ""}
          categoryId={categoryId}
          lockedCategoryId={lockedCategoryId}
          categories={categories}
          dismissed={autofillOfferDismissed}
          onDismiss={onAutofillOfferDismiss}
        />
      )}
    </form.Subscribe>
  );
}
