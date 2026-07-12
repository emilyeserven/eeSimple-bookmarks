import type { UpdateCustomPropertyInput } from "@eesimple/types";

/**
 * The payload keys the Options tab owns. Everything else in the property payload belongs to another
 * tab (name/enabled → General, scope arrays → Categories/Media Types, show-in flags → Display), so the
 * Options auto-saver only ever persists these. `showInDetails`/`showInGallery` are listed because the
 * image/file options live on this tab. Every type-specific option field emitted by `payloadFromValues`
 * must appear here or it is silently never saved (a missing key is the bug this list guards against).
 */
export const OPTIONS_KEYS = [
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
  "ratingAllowRange",
  "ratingLabels",
  "ratingDisplay",
  "ratingRangeIncludeStart",
  "choicesItems",
  "choicesDisplay",
  "choicesMultiple",
  "itemInItemsBeforeText",
  "itemInItemsBetweenText",
  "itemInItemsAfterText",
  "itemInItemsMediaTypeTexts",
  "itemInItemsSourcePropertyId",
  "sectionsDefaultType",
  "sectionsAllowedTypes",
  "sectionsTiered",
  "allowDefault",
  "showInDetails",
  "showInGallery",
] as const satisfies readonly (keyof UpdateCustomPropertyInput)[];

export type OptionsKey = (typeof OPTIONS_KEYS)[number];
