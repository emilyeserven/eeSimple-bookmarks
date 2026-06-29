import type { CardDisplayRuleScope } from "../lib/cardDisplayRulesFilter";

import { useMemo } from "react";

import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { CardDisplayRuleCard } from "./CardDisplayRuleCard";
import { useCardDisplayRules, useCreateCardDisplayRule } from "../hooks/useCardDisplayRules";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useWebsiteDomain } from "../hooks/useWebsiteDomain";
import {
  ruleReferencesCategory,
  ruleReferencesLocation,
  ruleReferencesMediaType,
  ruleReferencesProperty,
  ruleReferencesTag,
  ruleReferencesWebsite,
  ruleReferencesYoutubeChannel,
  seedCardDisplayConditions,
} from "../lib/cardDisplayRulesFilter";
import { propertyValueKind } from "../lib/propertyConditionKind";

import { Button } from "@/components/ui/button";

interface CardDisplayRulesListProps {
  /** Scope to rules whose conditions reference this category. */
  categoryId?: string;
  /** Scope to rules whose conditions reference this custom property. */
  propertyId?: string;
  /** Scope to rules whose conditions reference this website (resolved to its domain). */
  websiteId?: string;
  /** Scope to rules whose conditions reference this tag. */
  tagId?: string;
  /** Scope to rules whose conditions reference this media type. */
  mediaTypeId?: string;
  /** Scope to rules whose conditions reference this location. */
  locationId?: string;
  /** Scope to rules whose conditions reference this YouTube channel. */
  channelId?: string;
}

function emptyStateMessage(props: CardDisplayRulesListProps): string {
  if (props.categoryId) return "No display rules target this category yet. Add one below.";
  if (props.propertyId) return "No display rules reference this property yet. Add one below.";
  if (props.websiteId) return "No display rules target this website yet. Add one below.";
  if (props.tagId) return "No display rules reference this tag yet. Add one below.";
  if (props.mediaTypeId) return "No display rules reference this media type yet. Add one below.";
  if (props.locationId) return "No display rules reference this location yet. Add one below.";
  if (props.channelId) return "No display rules target this channel yet. Add one below.";
  return "No display rules yet. Add one below.";
}

/**
 * The non-Default card display rules whose conditions reference the entity in context, each rendered
 * as a `CardDisplayRuleCard` row linking to the rule's own View/Edit pages. An "Add display rule"
 * button creates a rule pre-scoped to this entity and opens its edit page. The list is intentionally
 * not drag-sortable — rule priority (`sortOrder`) is global, set on the Card Display Rules page.
 */
export function CardDisplayRulesList({
  categoryId, propertyId, websiteId, tagId, mediaTypeId, locationId, channelId,
}: CardDisplayRulesListProps) {
  const {
    data: rules, isLoading, error,
  } = useCardDisplayRules();
  const {
    data: properties,
  } = useCustomProperties();
  const create = useCreateCardDisplayRule();
  const navigate = useNavigate();

  // Card display rules reference websites by normalized domain, not id.
  const websiteDomain = useWebsiteDomain(websiteId);

  // The scoped property travels with its value kind so a seeded property condition is well-typed.
  const scopedProperty = useMemo(() => {
    if (!propertyId) return undefined;
    const property = (properties ?? []).find(p => p.id === propertyId);
    return property
      ? {
        id: property.id,
        valueKind: propertyValueKind(property),
      }
      : undefined;
  }, [properties, propertyId]);

  const scopedRules = useMemo(() => {
    const rest = (rules ?? []).filter(rule => !rule.isDefault);
    if (categoryId) return rest.filter(rule => ruleReferencesCategory(rule, categoryId));
    if (propertyId) return rest.filter(rule => ruleReferencesProperty(rule, propertyId));
    if (websiteId) return websiteDomain ? rest.filter(rule => ruleReferencesWebsite(rule, websiteDomain)) : [];
    if (tagId) return rest.filter(rule => ruleReferencesTag(rule, tagId));
    if (mediaTypeId) return rest.filter(rule => ruleReferencesMediaType(rule, mediaTypeId));
    if (locationId) return rest.filter(rule => ruleReferencesLocation(rule, locationId));
    if (channelId) return rest.filter(rule => ruleReferencesYoutubeChannel(rule, channelId));
    return [];
  }, [rules, categoryId, propertyId, websiteId, websiteDomain, tagId, mediaTypeId, locationId, channelId]);

  const scope: CardDisplayRuleScope = {
    categoryId,
    websiteDomain,
    tagId,
    mediaTypeId,
    locationId,
    channelId,
    property: scopedProperty,
  };

  /** Create a rule pre-scoped to this entity and jump to its edit page (then per-field auto-save). */
  function handleAddRule() {
    create.mutate(
      {
        name: "New rule",
        conditions: seedCardDisplayConditions(scope),
      },
      {
        onSuccess: (rule) => {
          if (rule.slug) {
            void navigate({
              to: "/card-display-rules/$ruleSlug/edit/general",
              params: {
                ruleSlug: rule.slug,
              },
            });
          }
        },
      },
    );
  }

  return (
    <section className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Display rules whose conditions match this item, in priority order. Higher-priority rules (set on
        the Card Display Rules page) win. Open a rule to edit it — changes apply everywhere.
      </p>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading rules…</p> : null}
      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
      {!isLoading && scopedRules.length === 0
        ? (
          <p className="text-sm text-muted-foreground">{emptyStateMessage({
            categoryId,
            propertyId,
            websiteId,
            tagId,
            mediaTypeId,
            locationId,
            channelId,
          })}
          </p>
        )
        : null}

      {scopedRules.length > 0
        ? (
          <div className="space-y-3">
            {scopedRules.map(rule => (
              <CardDisplayRuleCard
                key={rule.id}
                rule={rule}
              />
            ))}
          </div>
        )
        : null}

      <Button
        type="button"
        variant="outline"
        disabled={create.isPending}
        onClick={handleAddRule}
      >
        <Plus className="mr-2 size-4" />
        Add display rule
      </Button>
    </section>
  );
}
