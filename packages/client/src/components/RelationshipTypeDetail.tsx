import type { RelationshipType } from "@eesimple/types";

/**
 * Read-only detail body for a single relationship type. Shared by the View tab and the right
 * panel's View, so both surfaces show the same fields.
 */
export function RelationshipTypeDetail({
  relationshipType,
}: { relationshipType: RelationshipType }) {
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Slug</dt>
      <dd className="font-mono">{relationshipType.slug}</dd>
      <dt className="text-muted-foreground">Direction</dt>
      <dd>{relationshipType.directional ? "Directional (parent → child)" : "Symmetric"}</dd>
      <dt className="text-muted-foreground">Bookmarks</dt>
      <dd>{relationshipType.bookmarkCount ?? 0}</dd>
      <dt className="text-muted-foreground">Relationships</dt>
      <dd>{relationshipType.relationshipCount ?? 0}</dd>
      <dt className="text-muted-foreground">Built-in</dt>
      <dd>{relationshipType.builtIn ? "Yes — name is fixed" : "No"}</dd>
      <dt className="text-muted-foreground">Added</dt>
      <dd>{new Date(relationshipType.createdAt).toLocaleDateString()}</dd>
    </dl>
  );
}
