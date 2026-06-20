import type { PropertyFormApi } from "./propertyFormSchema";

import { AddPropertyGroupModal } from "./AddPropertyGroupModal";
import { LabeledSection } from "./LabeledSection";
import { CARD_IMAGE_CORNER_OPTIONS } from "../lib/propertyForm";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface PropertyDisplaySectionProps {
  form: PropertyFormApi;
  idPrefix: string;
  groupOptions: {
    value: string;
    label: string;
  }[];
  addGroupOpen: boolean;
  setAddGroupOpen: (open: boolean) => void;
}

/**
 * The "Display options" section of the property form: grouping combobox, the "Show in…" checkboxes,
 * and the card-edit toggle, plus the inline create-group modal. Extracted so `PropertyForm` keeps a
 * lean import surface; it operates on the shared form instance passed in.
 */
export function PropertyDisplaySection({
  form,
  idPrefix,
  groupOptions,
  addGroupOpen,
  setAddGroupOpen,
}: PropertyDisplaySectionProps) {
  return (
    <>
      <LabeledSection title="Display options">
        <div className="space-y-2">
          <span className="text-sm font-medium">Grouping</span>
          <form.AppField name="propertyGroupId">
            {field => (
              <field.ComboboxField
                label="Property group"
                options={groupOptions}
                placeholder="Ungrouped"
                searchPlaceholder="Search groups…"
                emptyText="No groups yet."
                createOption={{
                  label: "Create group…",
                  onSelect: () => setAddGroupOpen(true),
                }}
              />
            )}
          </form.AppField>
          <p className="text-xs text-muted-foreground">
            Grouped properties render together on bookmark pages and in the listings filters.
          </p>
        </div>
        <div className="space-y-2 border-t pt-3">
          <span className="text-sm font-medium">Show in…</span>
          <div className="space-y-2">
            <form.AppField name="inForm">
              {field => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${idPrefix}-in-form`}
                    checked={field.state.value}
                    onCheckedChange={checked => field.handleChange(checked === true)}
                  />
                  <Label htmlFor={`${idPrefix}-in-form`}>Main bookmark form</Label>
                </div>
              )}
            </form.AppField>
            <form.Subscribe selector={state => state.values.inForm}>
              {inForm =>
                inForm
                  ? (
                    <form.AppField name="showOutsideAdvanced">
                      {field => (
                        <div className="ml-6 flex items-center gap-2">
                          <Checkbox
                            id={`${idPrefix}-show-outside-advanced`}
                            checked={field.state.value}
                            onCheckedChange={checked => field.handleChange(checked === true)}
                          />
                          <Label
                            htmlFor={`${idPrefix}-show-outside-advanced`}
                            className="text-xs text-muted-foreground"
                          >
                            Show outside Advanced area
                          </Label>
                        </div>
                      )}
                    </form.AppField>
                  )
                  : null}
            </form.Subscribe>
            <form.AppField name="showInListings">
              {field => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${idPrefix}-show-in-listings`}
                    checked={field.state.value}
                    onCheckedChange={checked => field.handleChange(checked === true)}
                  />
                  <Label htmlFor={`${idPrefix}-show-in-listings`}>Bookmark listings</Label>
                </div>
              )}
            </form.AppField>
          </div>
        </div>
        <div className="space-y-2 border-t pt-3">
          <span className="text-sm font-medium">Card image corner</span>
          <form.AppField name="cardImageCorner">
            {field => (
              <field.SelectField
                label="Corner placement"
                options={CARD_IMAGE_CORNER_OPTIONS}
              />
            )}
          </form.AppField>
          <p className="text-xs text-muted-foreground">
            When set, the value is overlaid in that corner of the card&rsquo;s image instead of shown
            as a badge — provided the listing allows image corners and the bookmark has an image.
            Otherwise it falls back to a badge.
          </p>
        </div>
        <form.Subscribe selector={state => state.values.type}>
          {type =>
            type === "calculate"
              ? null
              : (
                <div className="space-y-2 border-t pt-3">
                  <span className="text-sm font-medium">Editing</span>
                  <form.AppField name="editableOnCard">
                    {field => (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`${idPrefix}-editable-on-card`}
                          checked={field.state.value}
                          onCheckedChange={checked => field.handleChange(checked === true)}
                        />
                        <Label htmlFor={`${idPrefix}-editable-on-card`}>
                          Allow editing from the bookmark card menu
                        </Label>
                      </div>
                    )}
                  </form.AppField>
                </div>
              )}
        </form.Subscribe>
      </LabeledSection>

      <AddPropertyGroupModal
        open={addGroupOpen}
        onOpenChange={setAddGroupOpen}
        onCreated={group => form.setFieldValue("propertyGroupId", group.id)}
      />
    </>
  );
}
