import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { Person, UpdatePersonInput } from "@eesimple/types";

import { PersonListItem } from "../components/PersonListItem";
import { PersonTable } from "../components/PersonTable";
import { personWorkbench } from "../components/workbench/person";
import { usePeople, useBulkDeletePeople } from "../hooks/usePeople";
import { peopleApi } from "../lib/api/taxonomies";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const PERSON_ROUTE: EntityRoute = {
  kind: "person",
  prefix: "/taxonomies/people",
  slugIndex: 2,
  listLabel: "People",
  singular: "Person",
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const PERSON_PALETTE: EntityPaletteConfig = {
  queryKey: ["people"],
  listFn: () => peopleApi.list(),
  updateFn: (id, patch) => peopleApi.update(id, patch as UpdatePersonInput),
  extraInvalidateKeys: [BOOKMARKS_KEY],
};

export const personListingConfig: EntityListingConfig<Person> = {
  pageKey: "people-listing",
  useItems: usePeople,
  matches: (person, query) => person.name.toLowerCase().includes(query),
  useBulkDelete: useBulkDeletePeople,
  noun: ["person", "people"],
  loadingLabel: "Loading people…",
  entityPlural: "people",
  emptyMessage: (
    <p className="text-muted-foreground">
      No people yet. Add one above, then assign them to bookmarks.
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <PersonListItem
      person={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <PersonTable
      people={entities}
      selection={selection}
    />
  ),
};

/** Second `EntityDescriptor` migration (after Group, PR #868) — issue #860. */
export const personDescriptor: EntityDescriptor<Person> = {
  kind: "person",
  route: PERSON_ROUTE,
  palette: PERSON_PALETTE,
  workbench: personWorkbench,
  listing: personListingConfig,
};
