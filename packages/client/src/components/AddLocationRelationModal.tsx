import type { LocationRelation } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateLocationRelation } from "../hooks/useLocationRelations";

interface AddLocationRelationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created relation so the opener can select it. */
  onCreated?: (relation: LocationRelation) => void;
}

/** Minimal name-only modal to create a location relation inline (e.g. from a bookmark's Locations). */
export function AddLocationRelationModal({
  open, onOpenChange, onCreated,
}: AddLocationRelationModalProps) {
  const createRelation = useCreateLocationRelation();
  const {
    t,
  } = useTranslation();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("New location relation")}
      description={t("Give the relation a name — you can reorder it later from Settings → Locations.")}
      placeholder={t("e.g. Filmed In")}
      submitLabel={t("Add location relation")}
      isError={createRelation.isError}
      errorMessage={createRelation.error?.message}
      onSubmit={(name, done) => {
        createRelation.mutate(
          {
            name,
          },
          {
            onSuccess: (relation) => {
              onCreated?.(relation);
              done();
            },
          },
        );
      }}
    />
  );
}
