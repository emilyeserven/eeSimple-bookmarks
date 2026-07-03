import type { PropertyFormApi } from "./propertyFormSchema";

import { Link } from "@tanstack/react-router";

import { LabeledSection } from "./LabeledSection";
import { useEntityCreateOption } from "./useEntityCreateOption";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface PropertyDisplaySectionProps {
  form: PropertyFormApi;
  idPrefix: string;
  groupOptions: {
    value: string;
    label: string;
  }[];
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
}: PropertyDisplaySectionProps) {
  const groupCreate = useEntityCreateOption("property-group", group => form.setFieldValue("propertyGroupId", group.id));

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
                createOption={groupCreate.createOption}
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
            <p className="text-xs text-muted-foreground">
              Bookmark form placement is managed in
              {" "}
              <Link
                to="/settings/display/bookmark-add"
                className="
                  text-primary
                  hover:underline
                "
              >
                Bookmark Add Form settings
              </Link>
              .
            </p>
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
            <form.AppField name="showInDetails">
              {field => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${idPrefix}-show-in-details`}
                    checked={field.state.value}
                    onCheckedChange={checked => field.handleChange(checked === true)}
                  />
                  <Label htmlFor={`${idPrefix}-show-in-details`}>Bookmark details page</Label>
                </div>
              )}
            </form.AppField>
          </div>
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
                  <form.AppField name="editableViaCmdk">
                    {field => (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`${idPrefix}-editable-via-cmdk`}
                          checked={field.state.value}
                          onCheckedChange={checked => field.handleChange(checked === true)}
                        />
                        <Label htmlFor={`${idPrefix}-editable-via-cmdk`}>
                          Allow editing via CMD+K
                        </Label>
                      </div>
                    )}
                  </form.AppField>
                </div>
              )}
        </form.Subscribe>
        <form.Subscribe selector={state => state.values.type}>
          {type =>
            ["calculate", "image", "file", "itemInItems", "sections"].includes(type)
              ? null
              : (
                <div className="space-y-2 border-t pt-3">
                  <span className="text-sm font-medium">Inbox</span>
                  <form.AppField name="enabledInInbox">
                    {field => (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`${idPrefix}-enabled-in-inbox`}
                          checked={field.state.value}
                          onCheckedChange={checked => field.handleChange(checked === true)}
                        />
                        <Label htmlFor={`${idPrefix}-enabled-in-inbox`}>
                          Inbox pre-fill defaults
                        </Label>
                      </div>
                    )}
                  </form.AppField>
                  <p className="text-xs text-muted-foreground">
                    Lets you pre-fill this property&apos;s value in the Inbox review page.
                  </p>
                </div>
              )}
        </form.Subscribe>
      </LabeledSection>

      {groupCreate.modal}
    </>
  );
}
