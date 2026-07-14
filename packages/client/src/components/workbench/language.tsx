import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, Language } from "@eesimple/types";

import i18n from "../../i18n";
import { GenreMoodAssignmentSection } from "../GenreMoodAssignmentSection";
import {
  LanguageAddedView,
  LanguageBookmarksView,
  LanguageBuiltInView,
  LanguageDescriptionView,
  LanguageIsoCodeView,
  LanguageSlugView,
} from "../LanguageDetail";
import {
  LanguageDescriptionEditField,
  LanguageIsoCodeEditField,
  LanguageNameEditField,
} from "../LanguageGeneralForm";

import { useDeleteLanguage, useLanguageBySlug, useLanguages } from "@/hooks/useLanguages";

/**
 * The language workbench's field registry (#1106 layout editor). The old single `general` composite is
 * fully atomized (#1371, following the media-type #1189 reference) into per-field, mode-aware
 * {@link WorkbenchField}s so an operator can place each independently in **Settings → Page Layouts**. Each
 * edit field owns its own single-field `useAppForm` + `useFieldAutoSave` — no form-context provider
 * needed (the Category precedent). `name`/`genreMoods` are **edit-only**; `slug`/`bookmarks`/`builtIn`/
 * `added` are **view-only**; `isoCode`/`description` carry both. Authored as an exhaustive
 * `Record<LanguageFieldKey, …>` so a key without a renderer fails `tsc`.
 */
type LanguageFieldKey
  = | "name"
    | "slug"
    | "isoCode"
    | "description"
    | "genreMoods"
    | "bookmarks"
    | "builtIn"
    | "added";

const languageFields = {
  name: {
    key: "name",
    label: i18n.t("Name"),
    edit: ({
      entity,
    }) => <LanguageNameEditField language={entity} />,
  },
  slug: {
    key: "slug",
    label: i18n.t("Slug"),
    view: ({
      entity,
    }) => <LanguageSlugView language={entity} />,
  },
  isoCode: {
    key: "isoCode",
    label: i18n.t("ISO code"),
    view: ({
      entity,
    }) => <LanguageIsoCodeView language={entity} />,
    edit: ({
      entity,
    }) => <LanguageIsoCodeEditField language={entity} />,
  },
  description: {
    key: "description",
    label: i18n.t("Description"),
    view: ({
      entity,
    }) => <LanguageDescriptionView language={entity} />,
    edit: ({
      entity,
    }) => <LanguageDescriptionEditField language={entity} />,
  },
  genreMoods: {
    key: "genreMoods",
    label: i18n.t("Genres & moods"),
    edit: ({
      entity,
    }) => (
      <GenreMoodAssignmentSection
        ownerType="language"
        ownerId={entity.id}
      />
    ),
  },
  bookmarks: {
    key: "bookmarks",
    label: i18n.t("Bookmarks"),
    view: ({
      entity,
    }) => <LanguageBookmarksView language={entity} />,
  },
  builtIn: {
    key: "builtIn",
    label: i18n.t("Built-in"),
    view: ({
      entity,
    }) => <LanguageBuiltInView language={entity} />,
  },
  added: {
    key: "added",
    label: i18n.t("Added"),
    view: ({
      entity,
    }) => <LanguageAddedView language={entity} />,
  },
} satisfies Record<LanguageFieldKey, WorkbenchField<Language>>;

/**
 * The code default layout: one General tab, one untitled section listing every atomized field in one
 * per-mode-sensible order — the edit-visible subset (`name`/`isoCode`/`description`/`genreMoods`)
 * reproduces the pre-#1371 form order, and the view-visible subset
 * (`slug`/`isoCode`/`description`/`bookmarks`/`builtIn`/`added`) reproduces the pre-#1371 `LanguageDetail`
 * order.
 */
const LANGUAGE_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: [
          "name",
          "slug",
          "isoCode",
          "description",
          "genreMoods",
          "bookmarks",
          "builtIn",
          "added",
        ] satisfies LanguageFieldKey[],
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
