import type { Language } from "@eesimple/types";

import { useTranslation } from "react-i18next";

/**
 * Read-only detail body for a single language. Shared by the View tab and the right panel's View,
 * so both surfaces show the same fields.
 */
export function LanguageDetail({
  language,
}: { language: Language }) {
  const {
    t,
  } = useTranslation();
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">{t("Slug")}</dt>
      <dd className="font-mono">{language.slug}</dd>
      <dt className="text-muted-foreground">{t("ISO code")}</dt>
      <dd className="font-mono">{language.isoCode ?? "—"}</dd>
      <dt className="text-muted-foreground">{t("Bookmarks")}</dt>
      <dd>{language.bookmarkCount ?? 0}</dd>
      <dt className="text-muted-foreground">{t("Built-in")}</dt>
      <dd>{language.builtIn ? t("Yes — name is fixed") : t("No")}</dd>
      <dt className="text-muted-foreground">{t("Added")}</dt>
      <dd>{new Date(language.createdAt).toLocaleDateString()}</dd>
    </dl>
  );
}
