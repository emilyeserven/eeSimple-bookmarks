import type { BookmarkFormApi } from "./bookmarkFormSchema";

import { LocationPicker } from "./LocationPicker";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useLocationTree } from "../hooks/useLocations";

import { Label } from "@/components/ui/label";

interface BookmarkLocationsFieldProps {
  form: BookmarkFormApi;
}

/**
 * The Locations tree-picker with inline create, writing the `locationIds` form field. Self-fetches
 * the location tree; submit-driven on the create form (no per-change auto-save). Placed independently
 * via the standard-field zone.
 */
export function BookmarkLocationsField({
  form,
}: BookmarkLocationsFieldProps) {
  const {
    data: tree = [],
  } = useLocationTree();
  const locationCreate = useEntityCreateOption("location", (location) => {
    const current = form.getFieldValue("locationIds");
    if (!current.includes(location.id)) form.setFieldValue("locationIds", [...current, location.id]);
  });

  return (
    <>
      <form.Field name="locationIds">
        {field => (
          <div className="space-y-1">
            <Label>Locations</Label>
            <LocationPicker
              tree={tree}
              selectedIds={field.state.value}
              onToggle={(id) => {
                const current = field.state.value;
                field.handleChange(
                  current.includes(id)
                    ? current.filter(locationId => locationId !== id)
                    : [...current, id],
                );
              }}
              createOption={locationCreate.createOption}
            />
          </div>
        )}
      </form.Field>
      {locationCreate.modal}
    </>
  );
}
