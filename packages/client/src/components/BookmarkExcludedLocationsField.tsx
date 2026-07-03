import type { BookmarkFormApi } from "./bookmarkFormSchema";

import { LocationPicker } from "./LocationPicker";
import { useLocationTree } from "../hooks/useLocations";

import { Label } from "@/components/ui/label";

interface BookmarkExcludedLocationsFieldProps {
  form: BookmarkFormApi;
}

/**
 * The autofill location-blacklist picker, writing the `blacklistedLocationIds` form field.
 * Self-fetches the location tree; submit-driven on the create form. Placed independently via the
 * standard-field zone.
 */
export function BookmarkExcludedLocationsField({
  form,
}: BookmarkExcludedLocationsFieldProps) {
  const {
    data: tree = [],
  } = useLocationTree();

  return (
    <form.Field name="blacklistedLocationIds">
      {field => (
        <div className="space-y-1">
          <Label>Excluded Locations</Label>
          <p className="text-xs text-muted-foreground">
            Locations toggled here will never be auto-applied by autofill rules.
          </p>
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
          />
        </div>
      )}
    </form.Field>
  );
}
