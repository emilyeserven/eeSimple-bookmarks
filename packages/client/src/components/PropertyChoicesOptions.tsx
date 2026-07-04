import type { PropertyFormApi, PropertyFormValues } from "./propertyFormSchema";
import type { DragEndEvent } from "@dnd-kit/core";
import type { ChoicesItem } from "@eesimple/types";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { AllowDefaultField } from "./AllowDefaultField";
import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { SortableChoiceItem } from "./SortableChoiceItem";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTranslatedLabel } from "@/hooks/useTranslatedLabel";
import { CHOICES_DISPLAY_OPTIONS } from "@/lib/propertyForm";

function slugifyChoice(text: string): string {
  const slug = text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "option";
}

function deduplicateValue(items: ChoicesItem[], base: string, excludeIndex: number): string {
  const existing = new Set(items.filter((_, i) => i !== excludeIndex).map(item => item.value));
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

function updateChoicesItems(items: ChoicesItem[], index: number, patch: Partial<ChoicesItem>): ChoicesItem[] {
  return items.map((item, i) => (i === index
    ? {
      ...item,
      ...patch,
    }
    : item));
}

interface ChoicesOptionsProps {
  form: PropertyFormApi;
  idPrefix: string;
  defaultOpen: boolean;
  full: boolean;
}

export function ChoicesOptions({
  form, idPrefix, defaultOpen, full,
}: ChoicesOptionsProps) {
  const tLabel = useTranslatedLabel();
  const choicesDisplayOptions = CHOICES_DISPLAY_OPTIONS.map(option => ({
    ...option,
    label: tLabel(option.label),
  }));
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <form.AppField name="choicesItems">
      {itemsField => (
        <form.Subscribe
          selector={state => ({
            choicesDisplay: state.values.choicesDisplay,
            choicesItems: state.values.choicesItems,
          })}
        >
          {({
            choicesDisplay, choicesItems,
          }) => {
            const preview = choicesItems.length === 0
              ? "No choices defined"
              : `${choicesItems.length} choice${choicesItems.length === 1 ? "" : "s"}`;

            function handleDragEnd(event: DragEndEvent) {
              const {
                active, over,
              } = event;
              if (!over || active.id === over.id) return;
              const oldIndex = choicesItems.findIndex(item => item.value === active.id);
              const newIndex = choicesItems.findIndex(item => item.value === over.id);
              if (oldIndex === -1 || newIndex === -1) return;
              itemsField.handleChange(arrayMove(choicesItems, oldIndex, newIndex));
            }

            return (
              <>
                {full ? <Separator /> : null}
                <CollapsibleFormSection
                  title="Choices Options"
                  description="Define the list of choices and how they display."
                  preview={preview}
                  defaultOpen={defaultOpen}
                >
                  <div className="space-y-4">
                    <form.AppField name="choicesDisplay">
                      {field => (
                        <field.SelectField
                          label="Display"
                          options={choicesDisplayOptions}
                          onValueChange={(value) => {
                            field.handleChange(value as PropertyFormValues["choicesDisplay"]);
                            if (value === "checkbox") {
                              form.setFieldValue("choicesMultiple", true);
                            }
                            else if (value === "radio") {
                              form.setFieldValue("choicesMultiple", false);
                            }
                          }}
                        />
                      )}
                    </form.AppField>

                    <form.AppField name="choicesMultiple">
                      {(field) => {
                        const locked = choicesDisplay === "checkbox" || choicesDisplay === "radio";
                        return (
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`${idPrefix}-choices-multiple`}
                              checked={field.state.value}
                              disabled={locked}
                              onCheckedChange={checked => field.handleChange(Boolean(checked))}
                            />
                            <Label htmlFor={`${idPrefix}-choices-multiple`}>
                              Allow multiple selections
                              {locked ? " (set by display type)" : ""}
                            </Label>
                          </div>
                        );
                      }}
                    </form.AppField>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Choices</Label>
                      {choicesItems.length > 0 && (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={choicesItems.map(item => item.value)}
                            strategy={verticalListSortingStrategy}
                          >
                            <ul className="space-y-2">
                              {choicesItems.map((item, index) => (
                                <SortableChoiceItem
                                  key={item.value}
                                  item={item}
                                  index={index}
                                  idPrefix={idPrefix}
                                  onLabelChange={(i, label) =>
                                    itemsField.handleChange(
                                      updateChoicesItems(choicesItems, i, {
                                        label,
                                      }),
                                    )}
                                  onLabelBlur={(i, label) => {
                                    const base = slugifyChoice(label);
                                    const deduped = deduplicateValue(choicesItems, base, i);
                                    itemsField.handleChange(
                                      updateChoicesItems(choicesItems, i, {
                                        value: deduped,
                                      }),
                                    );
                                  }}
                                  onDefaultChange={(i) => {
                                    itemsField.handleChange(
                                      choicesItems.map((it, idx) => ({
                                        ...it,
                                        isDefault: idx === i ? true : undefined,
                                      })),
                                    );
                                  }}
                                  onRemove={(i) => {
                                    itemsField.handleChange(
                                      choicesItems.filter((_, idx) => idx !== i),
                                    );
                                  }}
                                />
                              ))}
                            </ul>
                          </SortableContext>
                        </DndContext>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const base = slugifyChoice(`Option ${choicesItems.length + 1}`);
                          const deduped = deduplicateValue(choicesItems, base, -1);
                          itemsField.handleChange([
                            ...choicesItems,
                            {
                              label: `Option ${choicesItems.length + 1}`,
                              value: deduped,
                            },
                          ]);
                        }}
                      >
                        Add choice
                      </Button>
                    </div>

                    <AllowDefaultField
                      form={form}
                      idPrefix={idPrefix}
                      className="space-y-1"
                    />
                  </div>
                </CollapsibleFormSection>
              </>
            );
          }}
        </form.Subscribe>
      )}
    </form.AppField>
  );
}
