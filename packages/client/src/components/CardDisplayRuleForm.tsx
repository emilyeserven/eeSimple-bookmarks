import type { CardDisplayRuleFormValues } from "./useCardDisplayRuleForm";
import type { CardDisplayRule, ConditionTree } from "@eesimple/types";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { CardDisplayRuleDisplaySettings } from "./CardDisplayRuleDisplaySettings";
import { CardDisplayRuleFormModals } from "./CardDisplayRuleFormModals";
import { CardDisplayRuleFormSections } from "./CardDisplayRuleFormSections";
import { CardDisplayRuleGeneralFields } from "./CardDisplayRuleGeneralFields";
import { CardDisplayRulePreview } from "./CardDisplayRulePreview";
import { ConditionsField } from "./conditions/ConditionsField";
import { useCardDisplayRuleForm } from "./useCardDisplayRuleForm";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type { CardDisplayRuleFormValues } from "./useCardDisplayRuleForm";

interface CardDisplayRuleFormProps {
  rule?: CardDisplayRule;
  /** Pre-scoped initial conditions for a new rule (create only); ignored when `rule` is set. */
  seedConditions?: ConditionTree;
  /** Explicit-save mode (create): called when the Save button is clicked. */
  onSave?: (values: CardDisplayRuleFormValues) => void;
  /** Auto-save mode (edit): called on every field change so the parent can debounce + persist. */
  onChange?: (values: CardDisplayRuleFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
  /** When provided (editing a non-default rule), renders a Delete button. */
  onDelete?: () => void;
  isDeleting?: boolean;
}

/**
 * Create/edit form for a card display rule: name + description, a condition tree (the "when"), and the
 * per-card display overrides. The Default rule hides the name/description/conditions and edits only its
 * concrete display config.
 */
export function CardDisplayRuleForm({
  rule, seedConditions, onSave, onChange, onCancel, isPending, onDelete, isDeleting,
}: CardDisplayRuleFormProps) {
  const {
    t,
  } = useTranslation();
  const isDefault = rule?.isDefault ?? false;
  const {
    values, categories, properties, tagTree, setFields, setDisplay, handleSubmit,
  } = useCardDisplayRuleForm({
    rule,
    seedConditions,
    onSave,
    onChange,
  });

  // Each section can be popped into its own modal for a roomier editing surface.
  const [displayModalOpen, setDisplayModalOpen] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);

  const isAutoSave = onChange !== undefined;
  const idPrefix = `rule-${rule?.id ?? "new"}`;

  const displayControls = (
    <CardDisplayRuleDisplaySettings
      idPrefix={idPrefix}
      value={values.display}
      onChange={setDisplay}
      properties={properties}
      isDefault={isDefault}
    />
  );

  const cardPreview = (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{t("Card preview")}</h3>
        <p className="text-xs text-muted-foreground">
          {t("How a matching bookmark card looks with these display settings.")}
        </p>
      </div>
      <CardDisplayRulePreview
        display={values.display}
        conditions={values.conditions}
        isDefault={isDefault}
        currentRuleId={rule?.id}
      />
    </section>
  );

  // On desktop the Card Display controls sit on the left and scroll internally; the live Card Preview
  // is pinned on the right (`md:sticky md:top-4`). Both columns align to the top (`md:items-start`) and
  // the preview is sized to its own content (`md:self-start`) with its own bounded scroll, so a tall
  // sample card scrolls inside its box rather than stretching to the grid height and bleeding past the
  // Display section onto the Preview Bookmarks search bar below. They stack on narrow screens.
  // `maxH` caps both columns. Inline it stays under the viewport (minus the app header + form chrome);
  // the expanded modal gets a taller cap since it owns the whole screen.
  function buildDisplayWithPreview(maxH: string) {
    return (
      <div
        className="
          gap-6
          md:grid md:grid-cols-[1fr_minmax(0,22rem)] md:items-start
        "
      >
        <div
          className={`
            md:min-h-0 md:overflow-y-auto md:pr-2
            ${maxH}
          `}
        >
          {displayControls}
        </div>
        <div
          className={`
            mt-6
            md:sticky md:top-4 md:mt-0 md:self-start md:overflow-y-auto
            ${maxH}
          `}
        >
          {cardPreview}
        </div>
      </div>
    );
  }

  const displayWithPreview = buildDisplayWithPreview("md:max-h-[calc(100vh-16rem)]");

  const generalFields = (
    <CardDisplayRuleGeneralFields
      idPrefix={idPrefix}
      name={values.name}
      description={values.description}
      onNameChange={name => setFields({
        name,
      })}
      onDescriptionChange={description => setFields({
        description,
      })}
    />
  );

  const whenFields = (
    <ConditionsField
      value={values.conditions}
      onChange={v => setFields({
        conditions: v,
      })}
      categories={categories}
      properties={properties}
      tagTree={tagTree}
    />
  );

  // A field group renders inline when its modal is closed; while the modal is open the inline copy is
  // replaced by a note so the same inputs/DnD ids aren't mounted twice.
  const editingNote = (
    <p className="text-xs text-muted-foreground">{t("Editing in the expanded view…")}</p>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <CardDisplayRuleFormSections
        isDefault={isDefault}
        displayDefaultOpen={!rule}
        nameValue={values.name}
        conditions={values.conditions}
        displayModalOpen={displayModalOpen}
        ruleModalOpen={ruleModalOpen}
        onExpandDisplay={() => setDisplayModalOpen(true)}
        onExpandRule={() => setRuleModalOpen(true)}
        editingNote={editingNote}
        displayWithPreview={displayWithPreview}
        generalFields={generalFields}
        whenFields={whenFields}
      />

      <CardDisplayRuleFormModals
        isDefault={isDefault}
        displayModalOpen={displayModalOpen}
        onDisplayOpenChange={setDisplayModalOpen}
        ruleModalOpen={ruleModalOpen}
        onRuleOpenChange={setRuleModalOpen}
        renderDisplay={() => buildDisplayWithPreview("md:max-h-[calc(92vh-8rem)]")}
        generalFields={generalFields}
        whenFields={whenFields}
      />

      <Separator />

      <div className="flex flex-wrap gap-2">
        {isAutoSave
          ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              {t("Done")}
            </Button>
          )
          : (
            <>
              <Button
                type="submit"
                disabled={isPending || !values.name.trim()}
              >
                {isPending ? t("Saving…") : t("Save rule")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                {t("Cancel")}
              </Button>
            </>
          )}
        {onDelete && !isDefault
          ? (
            <Button
              type="button"
              variant="destructive"
              className="ml-auto"
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? t("Deleting…") : t("Delete rule")}
            </Button>
          )
          : null}
      </div>
    </form>
  );
}
