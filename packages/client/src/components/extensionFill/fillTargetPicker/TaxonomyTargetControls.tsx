import type { LockedKeys } from "./fillTargetShared";
import type { FillTarget, TaxonomyDirectFieldKey, TaxonomyEntityAssociation, TaxonomyEntityAssociationSpec, TaxonomyEntityWriteKey } from "@eesimple/types";

import {
  SOCIAL_MEDIA_PLATFORM_LABELS,
  SOCIAL_MEDIA_PLATFORMS,
  TAXONOMY_ENTITY_ASSOCIATIONS,
  TAXONOMY_ENTITY_FIELD_LABELS,
  TAXONOMY_ENTITY_SPECS,
} from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { URL_RESOLVABLE_ASSOCIATIONS } from "./fillTargetShared";
import { Combobox } from "../../Combobox";
import { KindSelect, LabeledInput } from "../controls";

import { directFieldSupported, taxonomyEntityFieldLabel, taxonomyEntityWriteKeys } from "@/lib/extensionFillForm";

type TaxonomyEntityTarget = Extract<FillTarget, { kind: "taxonomyEntity" }>;
type TaxonomyDirectTargetT = Extract<FillTarget, { kind: "taxonomyDirect" }>;
type ResolveMode = TaxonomyDirectTargetT["resolve"]["mode"];

/**
 * Controls for an "Associated taxonomy" target: pick the linked taxonomy, then one of its writable
 * fields, then (for a social link) the platform. Switching the taxonomy resets the field when the
 * previous one doesn't apply to the new entity.
 */
export function TaxonomyEntityTarget({
  target, onChange, lockedKeys,
}: {
  target: TaxonomyEntityTarget;
  onChange: (target: FillTarget) => void;
  lockedKeys: LockedKeys;
}) {
  const {
    t,
  } = useTranslation();
  // Scalar fields + relations (`relation:<key>`) + `language` — whichever the association supports.
  const writeKeys = taxonomyEntityWriteKeys(target.association);
  return (
    <div className="space-y-2">
      <KindSelect<TaxonomyEntityAssociation>
        label={t("Taxonomy")}
        disabled={lockedKeys.has("taxonomyEntity.association")}
        value={target.association}
        options={TAXONOMY_ENTITY_ASSOCIATIONS.map(association => ({
          value: association,
          label: t(TAXONOMY_ENTITY_SPECS[association].label),
        }))}
        onValueChange={(association) => {
          // Keep the current field if the new entity supports it, else fall back to its first field.
          const nextKeys = taxonomyEntityWriteKeys(association);
          const field = nextKeys.includes(target.field) ? target.field : nextKeys[0];
          onChange({
            kind: "taxonomyEntity",
            association,
            field,
          });
        }}
      />
      <KindSelect<TaxonomyEntityWriteKey>
        label={t("Field")}
        disabled={lockedKeys.has("taxonomyEntity.field")}
        value={target.field}
        options={writeKeys.map(field => ({
          value: field,
          label: t(taxonomyEntityFieldLabel(field)),
        }))}
        onValueChange={field => onChange({
          kind: "taxonomyEntity",
          association: target.association,
          field,
        })}
      />
      {target.field === "socialLink"
        ? (
          <Combobox
            aria-label={t("Platform")}
            disabled={lockedKeys.has("taxonomyEntity.socialPlatform")}
            options={SOCIAL_MEDIA_PLATFORMS.map(platform => ({
              value: platform,
              label: SOCIAL_MEDIA_PLATFORM_LABELS[platform],
            }))}
            value={target.socialPlatform || undefined}
            placeholder={t("Select a platform")}
            emptyText={t("No platforms found.")}
            onValueChange={value => onChange({
              kind: "taxonomyEntity",
              association: target.association,
              field: "socialLink",
              ...(value
                ? {
                  socialPlatform: value as TaxonomyEntityTarget["socialPlatform"],
                }
                : {}),
            })}
          />
        )
        : null}
    </div>
  );
}

/** Build a `taxonomyDirect` target from parts, clamping `field` to one the association supports. */
function buildDirectTarget(
  association: TaxonomyEntityAssociation,
  resolve: TaxonomyDirectTargetT["resolve"],
  field: TaxonomyDirectFieldKey,
  socialPlatform?: TaxonomyDirectTargetT["socialPlatform"],
): TaxonomyDirectTargetT {
  const nextField = directFieldSupported(association, field)
    ? field
    : TAXONOMY_ENTITY_SPECS[association].fields[0];
  return {
    kind: "taxonomyDirect",
    association,
    resolve,
    field: nextField,
    ...(nextField === "socialLink" && socialPlatform
      ? {
        socialPlatform,
      }
      : {}),
  };
}

/** The fillable fields for an association: its writable JSON fields plus `image` when supported. */
function directFieldKeys(association: TaxonomyEntityAssociation): TaxonomyDirectFieldKey[] {
  const spec: TaxonomyEntityAssociationSpec = TAXONOMY_ENTITY_SPECS[association];
  return spec.image ? [...spec.fields, "image"] : [...spec.fields];
}

/**
 * Controls for a "Taxonomy entity (direct)" target: how the entity is resolved from the page (its tab
 * URL, or a scraped identifier), which taxonomy + field to write, and the platform for a social link.
 * Switching the resolve mode narrows the association list (URL mode only resolves website/YouTube
 * channel); switching the association re-clamps the field.
 */
export function TaxonomyDirectTarget({
  target, onChange, lockedKeys,
}: {
  target: TaxonomyDirectTargetT;
  onChange: (target: FillTarget) => void;
  lockedKeys: LockedKeys;
}) {
  const {
    t,
  } = useTranslation();
  const resolveLocked = lockedKeys.has("taxonomyDirect.resolve");
  const associations = target.resolve.mode === "url"
    ? URL_RESOLVABLE_ASSOCIATIONS
    : TAXONOMY_ENTITY_ASSOCIATIONS;
  const fields = directFieldKeys(target.association);
  return (
    <div className="space-y-2">
      <KindSelect<ResolveMode>
        label={t("Resolve entity by")}
        disabled={resolveLocked}
        value={target.resolve.mode}
        options={[
          {
            value: "url",
            label: t("Page URL"),
          },
          {
            value: "match",
            label: t("Scraped name"),
          },
        ]}
        onValueChange={(mode) => {
          // URL mode only resolves website/YouTube channel — fall back to website when switching.
          const association = mode === "url" && !URL_RESOLVABLE_ASSOCIATIONS.includes(target.association)
            ? "website"
            : target.association;
          const resolve: TaxonomyDirectTargetT["resolve"] = mode === "url"
            ? {
              mode: "url",
            }
            : {
              mode: "match",
              select: target.resolve.mode === "match"
                ? target.resolve.select
                : {
                  selector: "",
                },
            };
          onChange(buildDirectTarget(association, resolve, target.field, target.socialPlatform));
        }}
      />
      {target.resolve.mode === "match"
        ? (
          <LabeledInput
            label={t("Entity name selector")}
            disabled={resolveLocked}
            placeholder="h1.entry-title"
            value={target.resolve.select.selector ?? ""}
            onChange={selector => onChange(buildDirectTarget(
              target.association,
              {
                mode: "match",
                select: {
                  ...target.resolve.mode === "match" ? target.resolve.select : {},
                  selector,
                },
              },
              target.field,
              target.socialPlatform,
            ))}
          />
        )
        : null}
      <KindSelect<TaxonomyEntityAssociation>
        label={t("Taxonomy")}
        disabled={lockedKeys.has("taxonomyDirect.association")}
        value={target.association}
        options={associations.map(association => ({
          value: association,
          label: t(TAXONOMY_ENTITY_SPECS[association].label),
        }))}
        onValueChange={association =>
          onChange(buildDirectTarget(association, target.resolve, target.field, target.socialPlatform))}
      />
      <KindSelect<TaxonomyDirectFieldKey>
        label={t("Field")}
        disabled={lockedKeys.has("taxonomyDirect.field")}
        value={target.field}
        options={fields.map(field => ({
          value: field,
          label: t(TAXONOMY_ENTITY_FIELD_LABELS[field]),
        }))}
        onValueChange={field =>
          onChange(buildDirectTarget(target.association, target.resolve, field, target.socialPlatform))}
      />
      {target.field === "socialLink"
        ? (
          <Combobox
            aria-label={t("Platform")}
            disabled={lockedKeys.has("taxonomyDirect.socialPlatform")}
            options={SOCIAL_MEDIA_PLATFORMS.map(platform => ({
              value: platform,
              label: SOCIAL_MEDIA_PLATFORM_LABELS[platform],
            }))}
            value={target.socialPlatform || undefined}
            placeholder={t("Select a platform")}
            emptyText={t("No platforms found.")}
            onValueChange={value => onChange(buildDirectTarget(
              target.association,
              target.resolve,
              "socialLink",
              (value as TaxonomyDirectTargetT["socialPlatform"]) || undefined,
            ))}
          />
        )
        : null}
    </div>
  );
}
