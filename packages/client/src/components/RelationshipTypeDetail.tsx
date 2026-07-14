import type { RelationshipType } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { DetailField } from "@/components/DetailField";

interface RelationshipTypeViewProps {
  relationshipType: RelationshipType;
}

/** "Slug" row (monospace). */
export function RelationshipTypeSlugView({
  relationshipType,
}: RelationshipTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Slug")}>
      <span className="font-mono">{relationshipType.slug}</span>
    </DetailField>
  );
}

/** "Description" row, with an em-dash fallback so the row always shows. */
export function RelationshipTypeDescriptionView({
  relationshipType,
}: RelationshipTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Description")}>{relationshipType.description ?? "—"}</DetailField>;
}

/** "Direction" (directional vs symmetric) row. */
export function RelationshipTypeDirectionView({
  relationshipType,
}: RelationshipTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Direction")}>
      {relationshipType.directional ? t("Directional (parent → child)") : t("Symmetric")}
    </DetailField>
  );
}

/** "Bookmarks" (count) row. */
export function RelationshipTypeBookmarkCountView({
  relationshipType,
}: RelationshipTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Bookmarks")}>{relationshipType.bookmarkCount ?? 0}</DetailField>;
}

/** "Relationships" (count) row. */
export function RelationshipTypeRelationshipCountView({
  relationshipType,
}: RelationshipTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Relationships")}>{relationshipType.relationshipCount ?? 0}</DetailField>;
}

/** "Built-in" row. */
export function RelationshipTypeBuiltInView({
  relationshipType,
}: RelationshipTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Built-in")}>
      {relationshipType.builtIn ? t("Yes — name is fixed") : t("No")}
    </DetailField>
  );
}

/** "Added" (created date) row. */
export function RelationshipTypeAddedView({
  relationshipType,
}: RelationshipTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Added")}>{new Date(relationshipType.createdAt).toLocaleDateString()}</DetailField>;
}

/**
 * Read-only detail body for a single relationship type, recomposed from the same placeable per-row
 * {@link DetailField} components the relationship type workbench registry uses — so this whole-view shell
 * (used by `RelationshipTypeDetail.stories.tsx`) stays in lockstep with the layout-driven General tab.
 */
export function RelationshipTypeDetail({
  relationshipType,
}: { relationshipType: RelationshipType }) {
  return (
    <div className="space-y-2">
      <RelationshipTypeSlugView relationshipType={relationshipType} />
      <RelationshipTypeDescriptionView relationshipType={relationshipType} />
      <RelationshipTypeDirectionView relationshipType={relationshipType} />
      <RelationshipTypeBookmarkCountView relationshipType={relationshipType} />
      <RelationshipTypeRelationshipCountView relationshipType={relationshipType} />
      <RelationshipTypeBuiltInView relationshipType={relationshipType} />
      <RelationshipTypeAddedView relationshipType={relationshipType} />
    </div>
  );
}
