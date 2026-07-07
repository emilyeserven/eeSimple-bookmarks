import type { CustomPropertyRow, DetailPropertyRow } from "../hooks/useBookmarkAddFormSettingsPage";
import type {
  BookmarkAddFormAdvancedRule,
  BookmarkAddFormPlacement,
  BookmarkAddFormStandardField,
  Category,
  CustomProperty,
  TagNode,
} from "@eesimple/types";

import { BOOKMARK_ADD_FORM_STANDARD_FIELDS } from "@eesimple/types";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { ConditionsField } from "./conditions/ConditionsField";
import { SegmentedToggleRow } from "./SegmentedToggleRow";
import {
  BOOKMARK_ADD_FORM_STANDARD_LABELS,
  STANDARD_FIELD_ICONS,
} from "../hooks/useBookmarkAddFormSettingsPage";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslatedLabel } from "@/hooks/useTranslatedLabel";

/** A per-rule placement, plus the extra "inherit" state meaning "don't override this field". */
type RulePlacement = BookmarkAddFormPlacement | "inherit";

interface Props {
  rule: BookmarkAddFormAdvancedRule;
  detailProperties: DetailPropertyRow[];
  customProperties: CustomPropertyRow[];
  /** Data for the embedded ConditionsField (the shared Filter builder). */
  categories: Category[];
  properties: CustomProperty[];
  tagTree: TagNode[];
  onChange: (patch: Partial<BookmarkAddFormAdvancedRule>) => void;
  onDelete: () => void;
}

/**
 * One Advanced Rule row in Settings → Display → Bookmark Add Form: an optional name, the shared
 * ConditionsField (reusing the Filter builder), and a placement toggle for every field/property the
 * rule can reposition. Each toggle has a 4th "Inherit" state (the sparse default) meaning the rule
 * leaves that field at whatever the base settings / higher rules decide. When the rule's conditions
 * match the in-progress bookmark, its non-inherit choices override the base placement on the create
 * form. Wrapped in a collapsible so a long list of rules stays scannable.
 */
export function BookmarkAddFormAdvancedRuleEditor({
  rule, detailProperties, customProperties, categories, properties, tagTree, onChange, onDelete,
}: Props) {
  const {
    t,
  } = useTranslation();
  const tLabel = useTranslatedLabel();

  /** The four segments shown on every override row (Inherit is the sparse default). */
  const PLACEMENT_OPTIONS = [
    {
      value: "inherit",
      label: t("Inherit"),
    },
    {
      value: "default",
      label: t("Default"),
    },
    {
      value: "advanced",
      label: t("Advanced"),
    },
    {
      value: "hidden",
      label: t("Hidden"),
    },
  ] as const satisfies readonly { value: RulePlacement;
    label: string; }[];

  /** Set a standard field's placement in the rule's sparse map; "inherit" removes the key. */
  function setStandardPlacement(field: BookmarkAddFormStandardField, value: RulePlacement): void {
    onChange({
      standardFieldPlacements: withPlacement(rule.standardFieldPlacements, field, value),
    });
  }

  /** Set a property slug's placement in the rule's sparse map; "inherit" removes the key. */
  function setPropertyPlacement(slug: string, value: RulePlacement): void {
    onChange({
      propertyPlacements: withPlacement(rule.propertyPlacements, slug, value),
    });
  }

  const overrideCount
    = Object.keys(rule.standardFieldPlacements).length + Object.keys(rule.propertyPlacements).length;
  const title = rule.name?.trim() || t("Untitled rule");
  const preview = t("{{count}} field override(s)", {
    count: overrideCount,
  });

  return (
    <div className="rounded-lg border p-4">
      <CollapsibleFormSection
        title={title}
        description={t(
          "When a bookmark being added matches the conditions below, these fields override their normal placement on the Add Bookmark form.",
        )}
        preview={preview}
        defaultOpen={overrideCount === 0}
      >
        <div className="space-y-2">
          <Label htmlFor={`rule-name-${rule.id}`}>{t("Rule name")}</Label>
          <Input
            id={`rule-name-${rule.id}`}
            value={rule.name ?? ""}
            placeholder={t("Optional label (e.g. Books)")}
            onChange={event => onChange({
              name: event.target.value,
            })}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">{t("Conditions")}</p>
          <ConditionsField
            value={rule.conditions}
            onChange={conditions => onChange({
              conditions,
            })}
            categories={categories}
            properties={properties}
            tagTree={tagTree}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">{t("Standard fields")}</p>
          {BOOKMARK_ADD_FORM_STANDARD_FIELDS.map(field => (
            <SegmentedToggleRow
              key={field}
              label={tLabel(BOOKMARK_ADD_FORM_STANDARD_LABELS[field])}
              icon={<StandardFieldIcon field={field} />}
              options={PLACEMENT_OPTIONS}
              value={rule.standardFieldPlacements[field] ?? "inherit"}
              onChange={value => setStandardPlacement(field, value)}
            />
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">{t("Built-in detail properties")}</p>
          {detailProperties.map(row => (
            <SegmentedToggleRow
              key={row.slug}
              label={row.label}
              options={PLACEMENT_OPTIONS}
              value={rule.propertyPlacements[row.slug] ?? "inherit"}
              onChange={value => setPropertyPlacement(row.slug, value)}
            />
          ))}
        </div>

        {customProperties.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("Custom properties")}</p>
            {customProperties.map(row => (
              <SegmentedToggleRow
                key={row.property.id}
                label={row.property.name}
                options={PLACEMENT_OPTIONS}
                value={rule.propertyPlacements[row.property.slug] ?? "inherit"}
                onChange={value => setPropertyPlacement(row.property.slug, value)}
              />
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
            {t("Delete rule")}
          </Button>
        </div>
      </CollapsibleFormSection>
    </div>
  );
}

/**
 * Return a copy of a sparse placement map with `key` set to `value` — or with `key` omitted when
 * `value` is "inherit" (the map stays sparse, so an inherited field carries no entry). Rebuilds the
 * object rather than `delete`-ing a computed key (which the lint config forbids).
 */
function withPlacement(
  map: Record<string, BookmarkAddFormPlacement>,
  key: string,
  value: RulePlacement,
): Record<string, BookmarkAddFormPlacement> {
  const rest = Object.fromEntries(Object.entries(map).filter(([k]) => k !== key));
  return value === "inherit"
    ? rest
    : {
      ...rest,
      [key]: value,
    };
}

/** The lucide icon for a standard field, rendered muted (kept tiny so the row stays low-complexity). */
function StandardFieldIcon({
  field,
}: { field: BookmarkAddFormStandardField }) {
  const Icon = STANDARD_FIELD_ICONS[field];
  return <Icon className="size-3.5 shrink-0 text-muted-foreground" />;
}
