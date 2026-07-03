import type { EntityWorkbench } from "./types";
import type { Language } from "@eesimple/types";

import { LanguageDetail } from "../LanguageDetail";
import { LanguageGeneralForm } from "../LanguageGeneralForm";

import { useDeleteLanguage, useLanguageBySlug, useLanguages } from "@/hooks/useLanguages";

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
  notFound: "Language not found.",
  navAriaLabel: "Language sections",
  getSlug: language => language.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "ISO code, usage counts, and metadata.",
        render: ({
          entity,
        }) => <LanguageDetail language={entity} />,
      },
      edit: {
        title: "General",
        description: "Name and ISO code.",
        render: ({
          entity,
        }) => <LanguageGeneralForm language={entity} />,
      },
    },
  ],
};
