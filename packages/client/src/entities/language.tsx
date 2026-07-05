import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { Language, UpdateLanguageInput } from "@eesimple/types";

import { LanguageCard } from "../components/LanguageCard";
import { LanguageTable } from "../components/LanguageTable";
import { languageWorkbench } from "../components/workbench/language";
import {
  useBulkDeleteLanguages,
  useLanguages,
} from "../hooks/useLanguages";
import i18n from "../i18n";
import { languagesApi } from "../lib/api/taxonomies";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const LANGUAGE_ROUTE: EntityRoute = {
  kind: "language",
  prefix: "/taxonomies/languages",
  slugIndex: 2,
  listLabel: i18n.t("Languages"),
  singular: i18n.t("Language"),
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const LANGUAGE_PALETTE: EntityPaletteConfig = {
  queryKey: ["languages"],
  listFn: () => languagesApi.list(),
  updateFn: (id, patch) => languagesApi.update(id, patch as UpdateLanguageInput),
  extraInvalidateKeys: [BOOKMARKS_KEY],
};

export const languageListingConfig: EntityListingConfig<Language> = {
  pageKey: "languages-listing",
  layout: "list",
  useItems: useLanguages,
  matches: (language, query) =>
    language.name.toLowerCase().includes(query)
    || (language.isoCode ?? "").toLowerCase().includes(query),
  deletableIds: items => items.filter(l => !l.builtIn).map(l => l.id),
  isSelectable: l => !l.builtIn,
  useBulkDelete: useBulkDeleteLanguages,
  noun: [i18n.t("language"), i18n.t("languages")],
  loadingLabel: i18n.t("Loading languages…"),
  entityPlural: i18n.t("languages"),
  emptyMessage: (
    <p className="text-muted-foreground">
      {i18n.t("No languages yet.")}
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <LanguageCard
      language={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <LanguageTable
      data={entities}
      selection={selection}
    />
  ),
};

export const languageDescriptor: EntityDescriptor<Language> = {
  kind: "language",
  route: LANGUAGE_ROUTE,
  palette: LANGUAGE_PALETTE,
  workbench: languageWorkbench,
  listing: languageListingConfig,
};
