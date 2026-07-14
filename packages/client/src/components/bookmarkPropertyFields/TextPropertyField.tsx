import type { CustomProperty } from "@eesimple/types";

import { Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FieldDescription } from "./FieldDescription";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TextPropertyField({
  property, fieldId, value, onChange, onFetch, isFetchPending,
}: {
  property: CustomProperty;
  fieldId: string;
  value: string;
  onChange: (value: string) => void;
  onFetch?: (value: string) => void;
  isFetchPending?: boolean;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-1">
      <Label htmlFor={fieldId}>{property.name}</Label>
      <div className="flex gap-1">
        <Input
          id={fieldId}
          type="text"
          value={value}
          onChange={event => onChange(event.target.value)}
          onBlur={onFetch && value.trim() ? () => onFetch(value) : undefined}
        />
        {onFetch && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title={t("Fetch metadata from Open Library")}
            aria-label={t("Fetch metadata from Open Library")}
            disabled={!value.trim() || isFetchPending}
            onClick={() => onFetch(value)}
          >
            {isFetchPending
              ? <Loader2 className="size-4 animate-spin" />
              : <Sparkles className="size-4" />}
          </Button>
        )}
      </div>
      <FieldDescription text={property.description} />
    </div>
  );
}
