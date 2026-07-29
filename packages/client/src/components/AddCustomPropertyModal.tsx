import type { CustomProperty, CustomPropertyType } from "@eesimple/types";

import { useId, useState } from "react";

import { useTranslation } from "react-i18next";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateCustomProperty } from "../hooks/useCustomProperties";
import { TYPE_OPTIONS } from "../lib/propertyForm";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslatedLabel } from "@/hooks/useTranslatedLabel";

interface AddCustomPropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (property: CustomProperty) => void;
}

/**
 * Minimal name + type modal to create a custom property inline from the listing page — a thin
 * `InlineCreateModal` wrapper using `extraFields` for the type select.
 */
export function AddCustomPropertyModal({
  open, onOpenChange, onCreated,
}: AddCustomPropertyModalProps) {
  const {
    t,
  } = useTranslation();
  const tLabel = useTranslatedLabel();
  const createProperty = useCreateCustomProperty();
  const [type, setType] = useState<CustomPropertyType>("number");
  const typeId = useId();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("New custom property")}
      description={t("Pick a name and type — fill in the rest from its edit page.")}
      placeholder={t("e.g. Rating")}
      submitLabel={t("Add property")}
      isError={createProperty.isError}
      errorMessage={createProperty.error?.message}
      extraFields={(
        <div className="space-y-1">
          <Label htmlFor={typeId}>{t("Type")}</Label>
          <Select
            value={type}
            onValueChange={value => setType(value as CustomPropertyType)}
          >
            <SelectTrigger
              id={typeId}
              className="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map(option => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                >
                  {tLabel(option.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      onSubmit={(name, done) => {
        createProperty.mutate(
          {
            name,
            type,
          },
          {
            onSuccess: (property) => {
              onCreated?.(property);
              setType("number");
              done();
            },
          },
        );
      }}
    />
  );
}
