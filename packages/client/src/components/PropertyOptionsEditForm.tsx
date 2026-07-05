import type { PropertyFormApi } from "./propertyFormSchema";
import type { CreateCustomPropertyInput, CustomProperty, UpdateCustomPropertyInput } from "@eesimple/types";

import { useEffect, useRef } from "react";

import i18n from "../i18n";
import { payloadFromValues, propertySchema, valuesFromProperty } from "./propertyFormParts";
import { PropertyOptionsSection } from "./PropertyOptionsSection";
import { useUpdateCustomProperty } from "../hooks/useCustomProperties";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useAppForm } from "../lib/form";

/**
 * The payload keys the Options tab owns. Everything else in the property payload belongs to another
 * tab (name/enabled → General, scope arrays → Categories/Media Types, show-in flags → Display), so the
 * Options auto-saver only ever persists these. `showInDetails`/`showInGallery` are listed because the
 * image/file options live on this tab.
 */
const OPTIONS_KEYS = [
  "numberMin",
  "numberMax",
  "unitSingular",
  "unitPlural",
  "valuePrefix",
  "zeroLabel",
  "maxLabel",
  "numberFormat",
  "quickFilterRange",
  "operandPropertyIds",
  "dateTimeFormat",
  "booleanLabelPreset",
  "booleanTrueLabel",
  "booleanFalseLabel",
  "ratingMax",
  "ratingAllowZero",
  "ratingAllowHalf",
  "ratingShowLabel",
  "ratingLabel",
  "allowDefault",
  "showInDetails",
  "showInGallery",
] as const satisfies readonly (keyof UpdateCustomPropertyInput)[];

type OptionsKey = (typeof OPTIONS_KEYS)[number];

const LABELS: Partial<Record<OptionsKey, string>> = {
  numberMin: i18n.t("Slider minimum"),
  numberMax: i18n.t("Slider maximum"),
  unitSingular: i18n.t("Unit"),
  unitPlural: i18n.t("Unit"),
  valuePrefix: i18n.t("Value prefix"),
  zeroLabel: i18n.t("Zero label"),
  maxLabel: i18n.t("Maximum label"),
  numberFormat: i18n.t("Number format"),
  quickFilterRange: i18n.t("Quick filter range"),
  operandPropertyIds: i18n.t("Operands"),
  dateTimeFormat: i18n.t("Captures"),
  booleanLabelPreset: i18n.t("Value display"),
  booleanTrueLabel: i18n.t("True label"),
  booleanFalseLabel: i18n.t("False label"),
  ratingMax: i18n.t("Scale"),
  ratingAllowZero: i18n.t("Allow zero"),
  ratingAllowHalf: i18n.t("Allow half ratings"),
  ratingShowLabel: i18n.t("Rating label"),
  ratingLabel: i18n.t("Rating label"),
  allowDefault: i18n.t("Default value"),
  showInDetails: i18n.t("Show in detail view"),
  showInGallery: i18n.t("Show in Media Management"),
};

/**
 * Watches the form's values and saves whichever Options-owned payload keys changed. The heavy
 * type-specific mapping is reused from `payloadFromValues`; each key persists independently (so the
 * per-field no-op guard means a single change emits a single named toast). `undefined` payload keys
 * (a field that doesn't apply to the current type) are skipped so they never overwrite stored values.
 */
function OptionsAutoSaver({
  payload,
  save,
}: {
  payload: CreateCustomPropertyInput;
  save: ReturnType<typeof useFieldAutoSave<UpdateCustomPropertyInput, CustomProperty>>["saveField"];
}) {
  const seeded = useRef(false);
  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      return;
    }
    for (const key of OPTIONS_KEYS) {
      const value = payload[key];
      if (value === undefined) continue;
      save(key, value as UpdateCustomPropertyInput[typeof key]);
    }
    // The per-field no-op guard means only the changed key(s) actually persist.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(OPTIONS_KEYS.map(key => payload[key]))]);
  return null;
}

interface PropertyOptionsEditFormProps {
  property: CustomProperty;
  numberProperties: CustomProperty[];
}

/**
 * The Options edit tab: reuses the shared `PropertyOptionsSection` markup bound to a local form, and
 * auto-saves each type-specific option (no Save button). Text/number inputs settle on blur, selects
 * and toggles on change; the heavy value→payload mapping is shared with the create form.
 */
export function PropertyOptionsEditForm({
  property,
  numberProperties,
}: PropertyOptionsEditFormProps) {
  const updateProperty = useUpdateCustomProperty();
  const {
    saveField,
  } = useFieldAutoSave<UpdateCustomPropertyInput, CustomProperty>({
    id: property.id,
    update: updateProperty,
    labels: LABELS,
    initial: payloadFromValues(valuesFromProperty(property)),
  });

  const form: PropertyFormApi = useAppForm({
    defaultValues: valuesFromProperty(property),
    validators: {
      onChange: propertySchema,
    },
  });

  return (
    <>
      <PropertyOptionsSection
        form={form}
        idPrefix={`property-${property.id}`}
        mode="edit"
        numberProperties={numberProperties}
        section="options"
        full={false}
      />
      <form.Subscribe selector={state => payloadFromValues(state.values)}>
        {payload => (
          <OptionsAutoSaver
            payload={payload}
            save={saveField}
          />
        )}
      </form.Subscribe>
    </>
  );
}
