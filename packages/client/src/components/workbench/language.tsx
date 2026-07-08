import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, Language } from "@eesimple/types";

import i18n from "../../i18n";
import { LanguageDetail } from "../LanguageDetail";
import { LanguageGeneralForm } from "../LanguageGeneralForm";

import { useDeleteLanguage, useLanguageBySlug, useLanguages } from "@/hooks/useLanguages";

/**
 * The language workbench's field registry (#1106 layout editor). A single `general` field carries
 * both modes (`LanguageDetail` view / `LanguageGeneralForm` edit) — the entity has one tab today.
 */
type LanguageFieldKey = "general";

const languageFields = {
  general: {
    key: "general",
    label: i18n.t("General"),
    view: ({
      entity,
    }) => <LanguageDetail language={entity} />,
    edit: ({
      entity,
    }) => <LanguageGeneralForm language={entity} />,
  },
} satisfies Record<LanguageFieldKey, WorkbenchField<Language>>;

/** The code default layout: the single General tab, one untitled section, one field. */
const LANGUAGE_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["general"] satisfies LanguageFieldKey[],
      }],
    },
  ],
};

/** Single source of truth for a language's view/edit UI (main pane routes + right panel). */
export const languageWorkbench: EntityWorkbench<Language> = {
  useBySlug: (slug) => {
    const {
      language, isLoading,
    } = useLanguageBySlug(slug);
    return {
      entity: language,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useLanguages();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: language => language.name,
  isBuiltIn: language => language.builtIn,
  canDelete: language => !language.builtIn,
  useDelete: () => {
    const mutation = useDeleteLanguage();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("Language not found."),
  navAriaLabel: i18n.t("Language sections"),
  listingPath: "/taxonomies/languages",
  getSlug: language => language.slug,
  layoutKind: "language",
  fields: languageFields,
  defaultLayout: LANGUAGE_DEFAULT_LAYOUT,
  // Layout-driven: the body comes from `fields` + `defaultLayout`. A single tab needs no `group`, so
  // `tabs` is a thin placeholder retained only for the descriptor's type requirement.
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
    },
  ],
};
