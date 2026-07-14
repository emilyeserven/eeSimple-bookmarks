import type { OverrideKey, TaxonomyEntityAssociation } from "@eesimple/types";

/** The set of options a fill-rule group has locked (read-only) on the rule being edited. */
export type LockedKeys = Set<OverrideKey>;

export const NO_LOCKS: LockedKeys = new Set();

/** The two associations the server can resolve straight from the tab URL (domain / channelKey). */
export const URL_RESOLVABLE_ASSOCIATIONS: TaxonomyEntityAssociation[] = ["website", "youtubeChannel"];
