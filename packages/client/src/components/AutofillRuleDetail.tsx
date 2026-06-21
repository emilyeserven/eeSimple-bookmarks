import type {
  AutofillRule,
  Category,
  ConditionMatchOperator,
  ConditionNode,
  CustomProperty,
  MediaType,
  Tag,
} from "@eesimple/types";

import { LabeledSection } from "./LabeledSection";
import { formatDateTime, formatNumber } from "../lib/bookmarkFormat";
import { summarizeConditions } from "../lib/conditionsSummary";
import { describePropertyPredicate } from "../lib/describePropertyPredicate";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const OPERATOR_VERBS: Record<ConditionMatchOperator, string> = {
  contains: "contains",
  starts_with: "starts with",
  regex: "matches",
  domain: "domain is",
};

function describeConditionNode(
  node: ConditionNode,
  categories: Category[],
  tags: Tag[],
  properties: CustomProperty[],
): string {
  switch (node.type) {
    case "group": {
      if (node.children.length === 0) return "(empty group)";
      const combLabel = node.combinator === "and" ? "ALL" : "ANY";
      const inner = node.children
        .map(c => describeConditionNode(c, categories, tags, properties))
        .join(node.combinator === "and" ? " AND " : " OR ");
      return `${combLabel} of: (${inner})`;
    }
    case "match":
      return node.operator === "domain"
        ? `Domain is "${node.pattern}"`
        : `${node.field === "url" ? "URL" : "Title"} ${OPERATOR_VERBS[node.operator]} "${node.pattern}"`;
    case "category": {
      const names = node.categoryIds.map(id => categories.find(c => c.id === id)?.name ?? id);
      return `Category is one of: ${names.join(", ")}`;
    }
    case "website":
      return node.domains.length === 1
        ? `Website is: ${node.domains[0]}`
        : `Website is one of: ${node.domains.join(", ")}`;
    case "tag": {
      const names = node.tagIds.map(id => tags.find(t => t.id === id)?.name ?? id);
      return `Tagged with any of: ${names.join(", ")}`;
    }
    case "youtube-channel":
      return node.channelIds.length === 1
        ? "YouTube channel is (1)"
        : `YouTube channel is one of (${node.channelIds.length})`;
    case "media-type":
      return node.mediaTypeIds.length === 1
        ? "media type is (1)"
        : `media type is one of (${node.mediaTypeIds.length})`;
    case "relationship-type":
      return node.relationshipTypeIds.length === 1
        ? "has a relationship of type (1)"
        : `has a relationship of one of (${node.relationshipTypeIds.length})`;
    case "property": {
      const property = properties.find(p => p.id === node.propertyId);
      const name = property?.name ?? "Unknown property";
      return `${name}: ${describePropertyPredicate(node.predicate, property)}`;
    }
    default: {
      const exhaustive: never = node;
      return String(exhaustive);
    }
  }
}

/** Body of the General view tab: description and metadata (name lives in the page header). */
export function AutofillGeneralFields({
  rule,
}: { rule: AutofillRule }) {
  return (
    <div className="space-y-3 text-sm">
      {rule.description
        ? <p>{rule.description}</p>
        : <p className="text-muted-foreground">No description.</p>}
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2">
        <dt className="text-muted-foreground">Priority</dt>
        <dd>{rule.sortOrder}</dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd className="font-mono">{rule.slug}</dd>
        <dt className="text-muted-foreground">Added</dt>
        <dd>{new Date(rule.createdAt).toLocaleDateString()}</dd>
      </dl>
    </div>
  );
}

/** Body of the Conditions view tab: detailed breakdown of the activation condition tree. */
export function AutofillConditionsFields({
  rule, categories, tags, properties,
}: {
  rule: AutofillRule;
  categories: Category[];
  tags: Tag[];
  properties: CustomProperty[];
}) {
  const tree = rule.conditions;
  if (tree.children.length === 0) {
    return <p className="text-sm text-muted-foreground">Always matches (no conditions set.)</p>;
  }
  const combinatorLabel = tree.combinator === "and" ? "ALL" : "ANY";
  return (
    <div className="space-y-2 text-sm">
      <p className="text-muted-foreground">
        Matches
        {" "}
        {combinatorLabel}
        {" "}
        of:
      </p>
      <ul className="space-y-1">
        {tree.children.map((child, index) => (

          <li
            key={index}
            className="flex gap-2"
          >
            <span className="text-muted-foreground">•</span>
            <span>{describeConditionNode(child, categories, tags, properties)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Body of the Prefill view tab: what category/media type/tags/properties the rule sets. */
export function AutofillPrefillFields({
  rule, categories, mediaTypes, tags, properties,
}: {
  rule: AutofillRule;
  categories: Category[];
  mediaTypes: MediaType[];
  tags: Tag[];
  properties: CustomProperty[];
}) {
  const categoryName = rule.setCategoryId
    ? (categories.find(c => c.id === rule.setCategoryId)?.name ?? null)
    : null;

  const mediaTypeName = rule.setMediaTypeId
    ? (mediaTypes.find(m => m.id === rule.setMediaTypeId)?.name ?? null)
    : null;

  const tagNames = rule.tagIds.map(id => tags.find(t => t.id === id)?.name ?? id);

  const propertyValues: { id: string;
    name: string;
    display: string; }[] = [
    ...rule.numberValues.map((e) => {
      const prop = properties.find(p => p.id === e.propertyId);
      return {
        id: e.propertyId,
        name: prop?.name ?? "Unknown",
        display: prop ? formatNumber(e.value, prop) : String(e.value),
      };
    }),
    ...rule.booleanValues.map((e) => {
      const prop = properties.find(p => p.id === e.propertyId);
      return {
        id: e.propertyId,
        name: prop?.name ?? "Unknown",
        display: e.value ? "Yes" : "No",
      };
    }),
    ...rule.dateTimeValues.map((e) => {
      const prop = properties.find(p => p.id === e.propertyId);
      return {
        id: e.propertyId,
        name: prop?.name ?? "Unknown",
        display: prop ? formatDateTime(e.value, prop) : e.value,
      };
    }),
  ];

  return (
    <div className="space-y-6">
      <LabeledSection title="Category">
        {categoryName
          ? <p className="text-sm">{categoryName}</p>
          : <p className="text-sm text-muted-foreground">— Leave unchanged —</p>}
      </LabeledSection>

      <Separator />

      <LabeledSection title="Media type">
        {mediaTypeName
          ? <p className="text-sm">{mediaTypeName}</p>
          : <p className="text-sm text-muted-foreground">— Leave unchanged —</p>}
      </LabeledSection>

      <Separator />

      <LabeledSection title="Tags">
        {tagNames.length > 0
          ? (
            <ul className="space-y-1 text-sm">
              {tagNames.map((name, i) => (

                <li key={i}>
                  •
                  {" "}
                  {name}
                </li>
              ))}
            </ul>
          )
          : <p className="text-sm text-muted-foreground">None</p>}
      </LabeledSection>

      <Separator />

      <LabeledSection title="Custom Properties">
        {propertyValues.length > 0
          ? (
            <ul className="space-y-1 text-sm">
              {propertyValues.map(pv => (
                <li key={pv.id}>
                  •
                  {" "}
                  {pv.name}
                  :
                  {" "}
                  {pv.display}
                </li>
              ))}
            </ul>
          )
          : <p className="text-sm text-muted-foreground">None</p>}
      </LabeledSection>
    </div>
  );
}

interface AutofillRuleDetailProps {
  rule: AutofillRule;
  categories: Category[];
  onEdit?: () => void;
  onDelete?: () => void;
  deleteIsPending?: boolean;
}

/** Read-only view of a single autofill rule — shared by the full-page view and the panel View mode. */
export function AutofillRuleDetail({
  rule, categories, onEdit, onDelete, deleteIsPending,
}: AutofillRuleDetailProps) {
  const categoryName = rule.setCategoryId
    ? (categories.find(c => c.id === rule.setCategoryId)?.name ?? null)
    : null;

  const prefillParts: string[] = [];
  if (categoryName) prefillParts.push(`Category: ${categoryName}`);
  if (rule.tagIds.length > 0) {
    prefillParts.push(`${rule.tagIds.length} ${rule.tagIds.length === 1 ? "tag" : "tags"}`);
  }
  const propertyCount = rule.numberValues.length + rule.booleanValues.length;
  if (propertyCount > 0) {
    prefillParts.push(`${propertyCount} ${propertyCount === 1 ? "property" : "properties"}`);
  }
  const prefillSummary = prefillParts.length > 0 ? prefillParts.join(" · ") : "Nothing prefilled";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{rule.name}</h2>
          {rule.description
            ? <p className="text-sm text-muted-foreground">{rule.description}</p>
            : null}
        </div>
        <div className="flex gap-2">
          {onEdit
            ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onEdit}
              >
                Edit
              </Button>
            )
            : null}
          {onDelete
            ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                disabled={deleteIsPending}
                onClick={onDelete}
              >
                {deleteIsPending ? "Deleting…" : "Delete"}
              </Button>
            )
            : null}
        </div>
      </div>

      <Separator />

      <LabeledSection
        title="Activation Conditions"
        description={summarizeConditions(rule.conditions)}
      />

      <Separator />

      <LabeledSection
        title="What Gets Prefilled"
        description={prefillSummary}
      />

      <Separator />

      <p className="text-xs text-muted-foreground">Priority: {rule.sortOrder}</p>
    </div>
  );
}
