import type { RelationshipType } from "@eesimple/types";

import { useTranslation } from "react-i18next";

/**
 * Read-only detail body for a single relationship type. Shared by the View tab and the right
 * panel's View, so both surfaces show the same fields.
 */
export function RelationshipTypeDetail({
  relationshipType,
}: { relationshipType: RelationshipType }) {
  const {
    t,
  } = useTranslation();
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">{t("Slug")}</dt>
      <dd className="font-mono">{relationshipType.slug}</dd>
      <dt className="text-muted-foreground">{t("Direction")}</dt>
      <dd>{relationshipType.directional ? t("Directional (parent → child)") : t("Symmetric")}</dd>
      <dt className="text-muted-foreground">{t("Bookmarks")}</dt>
      <dd>{relationshipType.bookmarkCount ?? 0}</dd>
      <dt className="text-muted-foreground">{t("Relationships")}</dt>
      <dd>{relationshipType.relationshipCount ?? 0}</dd>
      <dt className="text-muted-foreground">{t("Built-in")}</dt>
      <dd>{relationshipType.builtIn ? t("Yes — name is fixed") : t("No")}</dd>
      <dt className="text-muted-foreground">{t("Added")}</dt>
      <dd>{new Date(relationshipType.createdAt).toLocaleDateString()}</dd>
    </dl>
  );
}
