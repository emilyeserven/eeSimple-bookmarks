// This module is the panel's content-type registry entry point: it re-exports the assembled
// registry array (built in ./contentTypes/registry) plus the lookup helper and shared types its
// consumers iterate over.
import type { PanelContentTypeDef } from "./contentTypes/types";
import type { DrawerContentType } from "@/lib/drawerSearch";

import { PANEL_CONTENT_TYPES } from "./contentTypes/registry";

export { PANEL_CONTENT_TYPES } from "./contentTypes/registry";
export type { PanelContentTypeDef, PanelListItem } from "./contentTypes/types";

/** Look up a content type's definition. */
export function getContentType(type: DrawerContentType): PanelContentTypeDef {
  const def = PANEL_CONTENT_TYPES.find(candidate => candidate.type === type);
  if (!def) throw new Error(`Unknown panel content type: ${type}`);
  return def;
}
