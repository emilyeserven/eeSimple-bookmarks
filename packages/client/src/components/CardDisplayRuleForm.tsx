import type { RuleDisplayValue } from "./CardDisplayRuleDisplaySettings";
import type { CardDisplayRule, ConditionTree } from "@eesimple/types";

import { useRef, useState } from "react";

import { defaultCardZoneLayouts, emptyConditionTree } from "@eesimple/types";
import { Maximize2 } from "lucide-react";

import { CardDisplayRuleDisplaySettings } from "./CardDisplayRuleDisplaySettings";
import { CardDisplayRulePreview } from "./CardDisplayRulePreview";
import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { ConditionsField } from "./conditions/ConditionsField";
import { conditionsSummaryLabel } from "./conditions/summarizeConditions";
import { PreviewBookmarksSection } from "./PreviewBookmarksSection";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTagTree } from "../hooks/useTags";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export interface CardDisplayRuleFormValues {
  name: string;
  description: string | null;
  conditions: ConditionTree;
  display: RuleDisplayValue;
}

function initialFromRule(rule?: CardDisplayRule): CardDisplayRuleFormValues {
  return {
    name: rule?.name ?? "",
    description: rule?.description ?? "",
    conditions: rule?.conditions ?? emptyConditionTree(),
    display: {
      fieldZones: rule?.fieldZones ?? null,
      cardZoneLayouts: rule?.cardZoneLayouts ?? (rule?.isDefault ? defaultCardZoneLayouts() : null),
      imageMode: rule?.imageMode ?? (rule?.isDefault ? "natural" : null),
      imageVisibility: rule?.imageVisibility ?? (rule?.isDefault ? "shown" : null),
      imageLayout: rule?.imageLayout ?? (rule?.isDefault ? "above" : null),
      hideWebsiteForYouTube: rule?.hideWebsiteForYouTube ?? (rule?.isDefault ? false : null),
    },
  };
}

interface CardDisplayRuleFormProps {
  rule?: CardDisplayRule;
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
  rule, onSave, onChange, onCancel, isPending, onDelete, isDeleting,
}: CardDisplayRuleFormProps) {
  const isDefault = rule?.isDefault ?? false;
  const initialValues = initialFromRule(rule);
  const [values, setValues] = useState<CardDisplayRuleFormValues>(initialValues);
  const valuesRef = useRef<CardDisplayRuleFormValues>(initialValues);
  // Each section can be popped into its own modal for a roomier editing surface.
  const [displayModalOpen, setDisplayModalOpen] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);

  const {
    data: categories,
  } = useCategories();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: tagTree,
  } = useTagTree();

  function setFields(patch: Partial<CardDisplayRuleFormValues>): void {
    const next = {
      ...valuesRef.current,
      ...patch,
    };
    valuesRef.current = next;
    setValues(next);
    onChange?.(next);
  }

  function setDisplay(patch: Partial<RuleDisplayValue>): void {
    setFields({
      display: {
        ...valuesRef.current.display,
        ...patch,
      },
    });
  }

  const isAutoSave = onChange !== undefined;
  const idPrefix = `rule-${rule?.id ?? "new"}`;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave?.({
      ...valuesRef.current,
      name: valuesRef.current.name.trim(),
      description: valuesRef.current.description?.trim() || null,
    });
  }

  const displayControls = (
    <CardDisplayRuleDisplaySettings
      idPrefix={idPrefix}
      value={values.display}
      onChange={setDisplay}
      properties={properties ?? []}
      isDefault={isDefault}
    />
  );

  const cardPreview = (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Card preview</h3>
        <p className="text-xs text-muted-foreground">
          How a matching bookmark card looks with these display settings.
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
    <>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={values.name}
          onChange={e => setFields({
            name: e.target.value,
          })}
          placeholder="Rule name"
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={values.description ?? ""}
          onChange={e => setFields({
            description: e.target.value,
          })}
          placeholder="Optional note"
          rows={2}
        />
      </div>
    </>
  );

  const whenFields = (
    <ConditionsField
      value={values.conditions}
      onChange={v => setFields({
        conditions: v,
      })}
      categories={categories ?? []}
      properties={properties ?? []}
      tagTree={tagTree ?? []}
    />
  );

  // A field group renders inline when its modal is closed; while the modal is open the inline copy is
  // replaced by a note so the same inputs/DnD ids aren't mounted twice.
  const editingNote = (
    <p className="text-xs text-muted-foreground">Editing in the expanded view…</p>
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
              Done
            </Button>
          )
          : (
            <>
              <Button
                type="submit"
                disabled={isPending || !values.name.trim()}
              >
                {isPending ? "Saving…" : "Save rule"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                Cancel
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
              {isDeleting ? "Deleting…" : "Delete rule"}
            </Button>
          )
          : null}
      </div>
    </form>
  );
}

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
function CardDisplayRuleFormSections({
  isDefault, displayDefaultOpen, nameValue, conditions, displayModalOpen, ruleModalOpen,
  onExpandDisplay, onExpandRule, editingNote, displayWithPreview, generalFields, whenFields,
}: CardDisplayRuleFormSectionsProps) {
  if (isDefault) {
    return (
      <>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            The Default rule is the baseline applied to every bookmark card. Other rules override it
            for the bookmarks they match.
          </p>
          <ExpandButton
            onClick={onExpandDisplay}
            label="Expand display settings"
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
          label="Expand rule settings"
        />
      </div>

      <CollapsibleFormSection
        title="General"
        description="Name and optional note for this rule."
        defaultOpen
        preview={nameValue.trim() || "Untitled rule"}
      >
        {ruleModalOpen ? editingNote : generalFields}
      </CollapsibleFormSection>

      <Separator />

      <CollapsibleFormSection
        title="When"
        description="Which bookmarks this rule applies to. Combine conditions with AND/OR."
        defaultOpen
        preview={conditionsSummaryLabel(conditions)}
      >
        {ruleModalOpen ? editingNote : whenFields}
      </CollapsibleFormSection>

      <Separator />

      <CollapsibleFormSection
        title="Display"
        description="How matching bookmark cards are shown. Unset attributes inherit from lower-priority rules."
        defaultOpen={displayDefaultOpen}
        preview="Card field & image overrides"
      >
        <div className="mb-2 flex items-center justify-end">
          <ExpandButton
            onClick={onExpandDisplay}
            label="Expand display settings"
          />
        </div>
        {displayModalOpen ? editingNote : displayWithPreview}
      </CollapsibleFormSection>

      <Separator />

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Preview Bookmarks</h3>
          <p className="text-xs text-muted-foreground">
            Which existing bookmarks match this rule.
          </p>
        </div>
        <PreviewBookmarksSection conditions={conditions} />
      </section>
    </>
  );
}

interface CardDisplayRuleFormModalsProps {
  isDefault: boolean;
  displayModalOpen: boolean;
  onDisplayOpenChange: (open: boolean) => void;
  ruleModalOpen: boolean;
  onRuleOpenChange: (open: boolean) => void;
  /** Builds the display controls + preview; only invoked while the display modal is open. */
  renderDisplay: () => React.ReactNode;
  generalFields: React.ReactNode;
  whenFields: React.ReactNode;
}

/**
 * The two "expand to a modal" dialogs for the rule form (Display, and General+When). Kept separate so
 * the parent form stays a flat wiring component. Each dialog renders its body only while open so the
 * same inputs / DnD ids are never mounted twice (the inline copy shows a placeholder meanwhile).
 */
function CardDisplayRuleFormModals({
  isDefault, displayModalOpen, onDisplayOpenChange, ruleModalOpen, onRuleOpenChange,
  renderDisplay, generalFields, whenFields,
}: CardDisplayRuleFormModalsProps) {
  return (
    <>
      <Dialog
        open={displayModalOpen}
        onOpenChange={onDisplayOpenChange}
      >
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Display settings</DialogTitle>
          </DialogHeader>
          {displayModalOpen ? renderDisplay() : null}
        </DialogContent>
      </Dialog>

      {isDefault
        ? null
        : (
          <Dialog
            open={ruleModalOpen}
            onOpenChange={onRuleOpenChange}
          >
            <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Rule settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">General</h3>
                  {ruleModalOpen ? generalFields : null}
                </div>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">When</h3>
                  <p className="text-xs text-muted-foreground">
                    Which bookmarks this rule applies to. Combine conditions with AND/OR.
                  </p>
                  {ruleModalOpen ? whenFields : null}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
    </>
  );
}
