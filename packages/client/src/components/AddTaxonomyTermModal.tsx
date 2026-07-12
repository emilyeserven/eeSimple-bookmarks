import type { TaxonomyTerm } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateTaxonomyTerm } from "../hooks/useTaxonomies";

interface AddTaxonomyTermModalProps {
  taxonomyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created term so the opener can navigate to it. */
  onCreated?: (term: TaxonomyTerm) => void;
  /** Fixed parent id — used by the "New sub-term" button to nest under the current term. */
  defaultParentId?: string | null;
}

/** Minimal name-only modal to create a taxonomy term inline. Mirrors `AddGenreMoodModal`. */
export function AddTaxonomyTermModal({
  taxonomyId, open, onOpenChange, onCreated, defaultParentId = null,
}: AddTaxonomyTermModalProps) {
  const {
    t,
  } = useTranslation();
  const createTerm = useCreateTaxonomyTerm(taxonomyId);

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title={defaultParentId ? t("New sub-term") : t("New term")}
      description={defaultParentId
        ? t("Create a term under the current one — you can fill in the rest from its edit page.")
        : t("Give the term a name — you can fill in the rest from its edit page.")}
      placeholder={t("e.g. Hiragana")}
      submitLabel={t("Add term")}
      isError={createTerm.isError}
      errorMessage={createTerm.error?.message}
      onSubmit={(name, done) => {
        createTerm.mutate(
          {
            name,
            parentId: defaultParentId,
          },
          {
            onSuccess: (term) => {
              onCreated?.(term);
              done();
            },
          },
        );
      }}
    />
  );
}
