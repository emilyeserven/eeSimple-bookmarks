import type { CardDisplayRuleScope } from "../lib/cardDisplayRulesFilter";

import { useMemo, useState } from "react";

import { Plus } from "lucide-react";

import { CardDisplayRuleCard } from "./CardDisplayRuleCard";
import { CardDisplayRuleForm } from "./CardDisplayRuleForm";
import { useCardDisplayRules, useCreateCardDisplayRule } from "../hooks/useCardDisplayRules";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useWebsiteDomain } from "../hooks/useWebsiteDomain";
import {
  ruleReferencesCategory,
  ruleReferencesMediaType,
  ruleReferencesProperty,
  ruleReferencesTag,
  ruleReferencesWebsite,
  ruleReferencesYoutubeChannel,
  seedCardDisplayConditions,
} from "../lib/cardDisplayRulesFilter";
import { propertyValueKind } from "../lib/propertyConditionKind";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  /** Scope to rules whose conditions reference this YouTube channel. */
  channelId?: string;
}

function emptyStateMessage(props: CardDisplayRulesListProps): string {
  if (props.categoryId) return "No display rules target this category yet. Add one below.";
  if (props.propertyId) return "No display rules reference this property yet. Add one below.";
  if (props.websiteId) return "No display rules target this website yet. Add one below.";
  if (props.tagId) return "No display rules reference this tag yet. Add one below.";
  if (props.mediaTypeId) return "No display rules reference this media type yet. Add one below.";
  if (props.channelId) return "No display rules target this channel yet. Add one below.";
  return "No display rules yet. Add one below.";
}

/**
 * The non-Default card display rules whose conditions reference the entity in context, each rendered
 * as the same inline auto-saving editor the Settings page uses (`CardDisplayRuleCard`). An "Add display
 * rule" button creates a rule pre-scoped to this entity so it lands in the list immediately. The list is
 * intentionally not drag-sortable — rule priority (`sortOrder`) is global, set on the Settings page.
 */
export function CardDisplayRulesList({
  categoryId, propertyId, websiteId, tagId, mediaTypeId, channelId,
}: CardDisplayRulesListProps) {
  const {
    data: rules, isLoading, error,
  } = useCardDisplayRules();
  const {
    data: properties,
  } = useCustomProperties();
  const create = useCreateCardDisplayRule();
  const [addingNew, setAddingNew] = useState(false);

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
    if (channelId) return rest.filter(rule => ruleReferencesYoutubeChannel(rule, channelId));
    return [];
  }, [rules, categoryId, propertyId, websiteId, websiteDomain, tagId, mediaTypeId, channelId]);

  const scope: CardDisplayRuleScope = {
    categoryId,
    websiteDomain,
    tagId,
    mediaTypeId,
    channelId,
    property: scopedProperty,
  };

  return (
    <section className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Display rules whose conditions match this item, in priority order. Higher-priority rules (set on
        the Card Display Rules settings page) win. Editing here updates the same rule everywhere.
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

      {addingNew
        ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">New display rule</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDisplayRuleForm
                seedConditions={seedCardDisplayConditions(scope)}
                isPending={create.isPending}
                onSave={(values) => {
                  create.mutate(
                    {
                      name: values.name,
                      description: values.description,
                      conditions: values.conditions,
                      ...values.display,
                    },
                    {
                      onSuccess: () => setAddingNew(false),
                    },
                  );
                }}
                onCancel={() => setAddingNew(false)}
              />
            </CardContent>
          </Card>
        )
        : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setAddingNew(true)}
          >
            <Plus className="mr-2 size-4" />
            Add display rule
          </Button>
        )}
    </section>
  );
}
