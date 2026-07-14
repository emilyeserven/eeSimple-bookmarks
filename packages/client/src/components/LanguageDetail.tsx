import type { Language } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { DetailField } from "@/components/DetailField";

interface LanguageViewProps {
  language: Language;
}

/** "Slug" row (monospace). */
export function LanguageSlugView({
  language,
}: LanguageViewProps) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Slug")}>
      <span className="font-mono">{language.slug}</span>
    </DetailField>
  );
}

/** "ISO code" row (monospace), with an em-dash fallback so the row always shows. */
export function LanguageIsoCodeView({
  language,
}: LanguageViewProps) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("ISO code")}>
      <span className="font-mono">{language.isoCode ?? "—"}</span>
    </DetailField>
  );
}

/** "Description" row, with an em-dash fallback so the row always shows. */
export function LanguageDescriptionView({
  language,
}: LanguageViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Description")}>{language.description ?? "—"}</DetailField>;
}

/** "Bookmarks" (count) row. */
export function LanguageBookmarksView({
  language,
}: LanguageViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Bookmarks")}>{language.bookmarkCount ?? 0}</DetailField>;
}

/** "Built-in" row. */
export function LanguageBuiltInView({
  language,
}: LanguageViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Built-in")}>{language.builtIn ? t("Yes — name is fixed") : t("No")}</DetailField>;
}

/** "Added" (created date) row. */
export function LanguageAddedView({
  language,
}: LanguageViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Added")}>{new Date(language.createdAt).toLocaleDateString()}</DetailField>;
}

/**
 * Read-only detail body for a single language, recomposed from the same placeable per-row
 * {@link DetailField} components the language workbench registry uses — so this whole-view shell stays in
 * lockstep with the layout-driven General tab.
 */
export function LanguageDetail({
  language,
}: { language: Language }) {
  return (
    <div className="space-y-2">
      <LanguageSlugView language={language} />
      <LanguageIsoCodeView language={language} />
      <LanguageDescriptionView language={language} />
      <LanguageBookmarksView language={language} />
      <LanguageBuiltInView language={language} />
      <LanguageAddedView language={language} />
    </div>
  );
}
