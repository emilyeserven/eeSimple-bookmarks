import type { ConditionTree } from "@eesimple/types";

import { Maximize2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { conditionsSummaryLabel } from "./conditions/summarizeConditions";
import { PreviewBookmarksSection } from "./PreviewBookmarksSection";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

/** A small "expand to a modal" button shown on a section header. */
function ExpandButton({
  onClick, label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Maximize2 className="size-4" />
    </Button>
  );
}

interface CardDisplayRuleFormSectionsProps {
  isDefault: boolean;
  /** Whether the Display section starts open (only when creating a new rule). */
  displayDefaultOpen: boolean;
  nameValue: string;
  conditions: ConditionTree;
  displayModalOpen: boolean;
  ruleModalOpen: boolean;
  onExpandDisplay: () => void;
  onExpandRule: () => void;
  editingNote: React.ReactNode;
  displayWithPreview: React.ReactNode;
  generalFields: React.ReactNode;
  whenFields: React.ReactNode;
}

/**
 * The form body: the Default rule edits only its display config; a normal rule shows the collapsible
 * General / When / Display sections plus a live match preview. Split out of the parent form so each
 * stays a flat wiring component under fallow's complexity cap.
 */
export function CardDisplayRuleFormSections({
  isDefault, displayDefaultOpen, nameValue, conditions, displayModalOpen, ruleModalOpen,
  onExpandDisplay, onExpandRule, editingNote, displayWithPreview, generalFields, whenFields,
}: CardDisplayRuleFormSectionsProps) {
  const {
    t,
  } = useTranslation();
  if (isDefault) {
    return (
      <>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {t("The Default rule is the baseline applied to every bookmark card. Other rules override it for the bookmarks they match.")}
          </p>
          <ExpandButton
            onClick={onExpandDisplay}
            label={t("Expand display settings")}
          />
        </div>
        {displayModalOpen ? editingNote : displayWithPreview}
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end">
        <ExpandButton
          onClick={onExpandRule}
          label={t("Expand rule settings")}
        />
      </div>

      <CollapsibleFormSection
        title={t("General")}
        description={t("Name and optional note for this rule.")}
        defaultOpen
        preview={nameValue.trim() || t("Untitled rule")}
      >
        {ruleModalOpen ? editingNote : generalFields}
      </CollapsibleFormSection>

      <Separator />

      <CollapsibleFormSection
        title={t("When")}
        description={t("Which bookmarks this rule applies to. Combine conditions with AND/OR.")}
        defaultOpen
        preview={conditionsSummaryLabel(conditions)}
      >
        {ruleModalOpen ? editingNote : whenFields}
      </CollapsibleFormSection>

      <Separator />

      <CollapsibleFormSection
        title={t("Display")}
        description={t("How matching bookmark cards are shown. Unset attributes inherit from lower-priority rules.")}
        defaultOpen={displayDefaultOpen}
        preview={t("Card field & image overrides")}
      >
        <div className="mb-2 flex items-center justify-end">
          <ExpandButton
            onClick={onExpandDisplay}
            label={t("Expand display settings")}
          />
        </div>
        {displayModalOpen ? editingNote : displayWithPreview}
      </CollapsibleFormSection>

      <Separator />

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">{t("Preview Bookmarks")}</h3>
          <p className="text-xs text-muted-foreground">
            {t("Which existing bookmarks match this rule.")}
          </p>
        </div>
        <PreviewBookmarksSection conditions={conditions} />
      </section>
    </>
  );
}
