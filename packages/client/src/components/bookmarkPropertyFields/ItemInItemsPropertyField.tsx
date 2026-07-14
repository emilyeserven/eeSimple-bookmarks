import type { ProgressInputEntry } from "../bookmarkFormSchema";
import type { CustomProperty } from "@eesimple/types";

import { resolveItemInItemsTexts } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { FieldDescription } from "./FieldDescription";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ItemInItemsPropertyField({
  property, progress, onChange, mediaTypeId = null, derived = false,
}: {
  property: CustomProperty;
  progress: ProgressInputEntry | undefined;
  onChange: (field: keyof ProgressInputEntry, value: string | boolean) => void;
  /** The bookmark's media type, used to resolve the per-media-type text overrides. */
  mediaTypeId?: string | null;
  /**
   * When true, the counts are derived from the linked sections property's completion — the number
   * inputs render disabled with an explanatory hint (the server recomputes on every save). The
   * counter-word inputs stay editable, since the wording is meaningful for derived progress too.
   */
  derived?: boolean;
}) {
  const {
    t,
  } = useTranslation();
  const current = progress?.current ?? "";
  const total = progress?.total ?? "";
  // Inherited segments (media-type override → property base), used as the placeholders the per-bookmark
  // inputs fall back to when left blank.
  const inherited = resolveItemInItemsTexts(property, mediaTypeId);
  const beforePlaceholder = inherited.before ?? "";
  const betweenPlaceholder = inherited.between ?? t(" of ");
  const afterPlaceholder = inherited.after ?? "";
  return (
    <div className="col-span-full space-y-1">
      <Label>{property.name}</Label>
      <div className="flex flex-wrap items-center gap-1.5">
        <Input
          className="w-24"
          placeholder={beforePlaceholder || t("Before")}
          value={progress?.beforeText ?? ""}
          onChange={event => onChange("beforeText", event.target.value)}
        />
        <Input
          type="number"
          className="w-24"
          placeholder={t("Current")}
          value={current}
          disabled={derived}
          onChange={event => onChange("current", event.target.value)}
        />
        <Input
          className="w-24"
          placeholder={betweenPlaceholder || t("Between")}
          value={progress?.betweenText ?? ""}
          onChange={event => onChange("betweenText", event.target.value)}
        />
        <Input
          type="number"
          className="w-24"
          placeholder={t("Total")}
          value={total}
          disabled={derived}
          onChange={event => onChange("total", event.target.value)}
        />
        <Input
          className="w-24"
          placeholder={afterPlaceholder || t("After")}
          value={progress?.afterText ?? ""}
          onChange={event => onChange("afterText", event.target.value)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {t("Counter words for this bookmark — leave blank to inherit the default.")}
      </p>
      <div className="flex items-center gap-2">
        <Checkbox
          id={`progress-autospace-${property.id}`}
          checked={progress?.autoSpace !== false}
          onCheckedChange={value => onChange("autoSpace", value === true)}
        />
        <Label
          htmlFor={`progress-autospace-${property.id}`}
          className="text-xs font-normal text-muted-foreground"
        >
          {t("Add spaces between labels automatically")}
        </Label>
      </div>
      {derived
        ? (
          <p className="text-xs text-muted-foreground">
            {t("Derived automatically from the completed Sections items.")}
          </p>
        )
        : null}
      <FieldDescription text={property.description} />
    </div>
  );
}
