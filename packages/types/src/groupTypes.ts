/**
 * A Group Type — a flat taxonomy classifying groups (e.g. Company, Creator Collaborative,
 * Podcast Multi-Host, Doujin Circle). A group may belong to one group type via a nullable FK.
 */
export interface GroupType {
  id: string;
  /** Display name. Unique. */
  name: string;
  /** URL-friendly identifier derived from the name. Unique. */
  slug: string;
  /** Free-text description surfaced on the group type's detail page. */
  description: string | null;
  /** Whether this is a seeded built-in (protected from rename/delete). */
  builtIn: boolean;
  /** Hidden from the picker while still resolvable by existing groups. */
  hidden: boolean;
  /** Display ordering weight; lower sorts first. */
  sortOrder: number;
  /** ISO-8601 timestamp of when the group type was created. */
  createdAt: string;
  /** How many groups currently reference this group type. Computed server-side. */
  groupCount?: number;
}

/** Payload for creating a group type. */
export interface CreateGroupTypeInput {
  name: string;
  sortOrder?: number;
  description?: string | null;
}

/** Payload for updating a group type (rename, reorder, and/or hide). */
export interface UpdateGroupTypeInput {
  name?: string;
  sortOrder?: number;
  description?: string | null;
  /** Hide/show from the picker. Allowed on built-ins (unlike rename/delete). */
  hidden?: boolean;
}
