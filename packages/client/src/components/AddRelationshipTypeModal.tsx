import { useState } from "react";

import { useTranslation } from "react-i18next";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateRelationshipType } from "../hooks/useRelationshipTypes";

import { Checkbox } from "@/components/ui/checkbox";

interface AddRelationshipTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Name + directional modal to create a relationship type, opened from the header create button —
 * a thin `InlineCreateModal` wrapper using `extraFields` for the `directional` checkbox.
 */
export function AddRelationshipTypeModal({
  open, onOpenChange,
}: AddRelationshipTypeModalProps) {
  const createRelationshipType = useCreateRelationshipType();
  const [directional, setDirectional] = useState(false);
  const {
    t,
  } = useTranslation();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("New relationship type")}
      description={t("Directional types read as parent → child and power the Hierarchy view; symmetric types read the same from either bookmark.")}
      placeholder={t("e.g. Inspiration")}
      submitLabel={t("Add relationship type")}
      isError={createRelationshipType.isError}
      errorMessage={createRelationshipType.error?.message}
      extraFields={(
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={directional}
            onCheckedChange={checked => setDirectional(checked === true)}
            aria-label={t("Directional")}
          />
          {t("Directional")}
        </label>
      )}
      onSubmit={(name, done) => {
        createRelationshipType.mutate(
          {
            name,
            directional,
          },
          {
            onSuccess: () => {
              setDirectional(false);
              done();
            },
          },
        );
      }}
    />
  );
}
