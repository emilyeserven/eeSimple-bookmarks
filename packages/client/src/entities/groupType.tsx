import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { GroupType, UpdateGroupTypeInput } from "@eesimple/types";

import { GroupTypeListItem } from "../components/GroupTypeListItem";
import { GroupTypeTable } from "../components/GroupTypeTable";
import { groupTypeWorkbench } from "../components/workbench/groupType";
import { useBulkDeleteGroupTypes, useGroupTypes } from "../hooks/useGroupTypes";
import i18n from "../i18n";
import { groupTypesApi } from "../lib/api/taxonomies";

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const GROUP_TYPE_ROUTE: EntityRoute = {
  kind: "group-type",
  prefix: "/taxonomies/group-types",
  slugIndex: 2,
  listLabel: i18n.t("Group Types"),
  singular: i18n.t("Group Type"),
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const GROUP_TYPE_PALETTE: EntityPaletteConfig = {
  queryKey: ["group-types"],
  listFn: () => groupTypesApi.list(),
  updateFn: (id, patch) => groupTypesApi.update(id, patch as UpdateGroupTypeInput),
  extraInvalidateKeys: [["groups"]],
};

export const groupTypeListingConfig: EntityListingConfig<GroupType> = {
  pageKey: "group-types-listing",
  useItems: useGroupTypes,
  matches: (prop, query) =>
    prop.name.toLowerCase().includes(query) || prop.slug.toLowerCase().includes(query),
  deletableIds: items => items.filter(gt => !gt.builtIn).map(gt => gt.id),
  isSelectable: gt => !gt.builtIn,
  useBulkDelete: useBulkDeleteGroupTypes,
  noun: [i18n.t("group type"), i18n.t("group types")],
  loadingLabel: i18n.t("Loading group types…"),
  entityPlural: i18n.t("group types"),
  emptyMessage: (
    <p className="text-muted-foreground">
      {i18n.t("No group types yet. Add one above, then assign them to groups.")}
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <GroupTypeListItem
      groupType={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <GroupTypeTable
      data={entities}
      selection={selection}
    />
  ),
};

export const groupTypeDescriptor: EntityDescriptor<GroupType> = {
  kind: "group-type",
  route: GROUP_TYPE_ROUTE,
  palette: GROUP_TYPE_PALETTE,
  workbench: groupTypeWorkbench,
  listing: groupTypeListingConfig,
};
