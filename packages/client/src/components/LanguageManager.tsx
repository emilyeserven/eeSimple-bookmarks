import { useState } from "react";

import { useTranslation } from "react-i18next";

import { AddLanguageModal } from "./AddLanguageModal";
import { ListingScaffold } from "./ListingScaffold";

import { languageListingConfig } from "@/entities/language";
import { useSetListingPage } from "@/hooks/useListingPage";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable language listing. Each card opens its detail page; hover to Edit / view Info. */
export function LanguagesListing() {
  const {
    t,
  } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  useSetListingPage("languages-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: t("New language"),
  });
  const state = useListingScaffold(languageListingConfig);

  return (
    <div className="space-y-4">
      <ListingScaffold
        config={languageListingConfig}
        state={state}
      />

      <AddLanguageModal
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
