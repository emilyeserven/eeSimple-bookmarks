import { useTranslation } from "react-i18next";

/**
 * Thin, greppable wrapper around `t()` for translating a value pulled out of a `packages/types`
 * label registry (`CUSTOM_PROPERTY_TYPE_LABELS`, `CHOICES_DISPLAY_LABELS`,
 * `BOOKMARK_ADD_FORM_STANDARD_LABELS`, `STANDARD_CARD_FIELDS`, …). The registries stay English-only
 * (the `packages/types` i18n boundary); this hook is the one call-site name every registry lookup
 * translates through, e.g. `tLabel(CUSTOM_PROPERTY_TYPE_LABELS[type])`.
 */
export function useTranslatedLabel() {
  const {
    t,
  } = useTranslation();
  return t;
}
