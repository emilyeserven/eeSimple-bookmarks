import type { EntityDescriptor } from "./types";
import type { EntityRouteKind } from "../lib/entityRoutes";

import { publisherDescriptor } from "./publisher";

/**
 * Opt-in registry of entities that have migrated to `EntityDescriptor`. Deliberately `Partial` —
 * unlike `ENTITY_PALETTE_CONFIGS`'s exhaustive `Record`, entities are added here one at a time as
 * they migrate (see issue #860); an unmigrated entity keeps working exactly as before via
 * `ENTITY_ROUTES` / `ENTITY_PALETTE_CONFIGS` / its own `components/workbench/*` export directly.
 *
 * Not yet consumed by `matchEntityRoute`, the CMD+K registry lookup, or
 * `WorkbenchRouteTab`/`EntityWorkbenchView` — wiring those up is future-PR work once more entities
 * have descriptors.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- heterogeneous entity payloads; each entry is only ever accessed through its own descriptor module
export const ENTITY_DESCRIPTORS: Partial<Record<EntityRouteKind, EntityDescriptor<any>>> = {
  publisher: publisherDescriptor,
};
