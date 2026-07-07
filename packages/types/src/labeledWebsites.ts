/**
 * A single labeled website on an entity. Taxonomy-optional: when the user picks an entry from the
 * Websites taxonomy, `websiteId` is set and `url` is filled from that website; when they type a
 * freeform URL, `websiteId` is `null` and `url` is the typed value. Stored as a jsonb array on each
 * URL-bearing entity, mirroring {@link SocialLink}.
 */
export interface LabeledWebsite {
  label: string;
  url: string;
  websiteId: string | null;
}
