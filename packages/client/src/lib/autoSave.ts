import { notifyError, notifySuccess } from "./notifications";

import i18n from "@/i18n";

/**
 * Standard wording for per-field auto-save toasts (edit-tab auto-save standard). Field edit tabs
 * have no Save button: each field persists on blur/change and reports via these helpers, so the
 * toast always **names the field** and the event lands in the right-panel Notifications log. Keep
 * the wording here — don't hand-write `notifySuccess(\`Updated …\`)` at call sites. `label` is
 * translated as its own phrase key here so every caller's field name localizes without touching
 * each call site.
 */

/** Success toast after a single field auto-saved, e.g. "Updated Name". */
export function notifyFieldSaved(label: string): void {
  notifySuccess(i18n.t("Updated {{label}}", {
    label: i18n.t(label),
  }));
}

/** Error toast after a field's auto-save failed, e.g. "Couldn't save Name: <cause>". */
export function notifyFieldSaveError(label: string, cause?: string): void {
  notifyError(
    cause
      ? i18n.t("Couldn't save {{label}}: {{cause}}", {
        label: i18n.t(label),
        cause,
      })
      : i18n.t("Couldn't save {{label}}", {
        label: i18n.t(label),
      }),
  );
}
