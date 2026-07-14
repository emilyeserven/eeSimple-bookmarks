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
