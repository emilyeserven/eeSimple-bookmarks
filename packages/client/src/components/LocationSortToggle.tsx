import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useUiStore } from "@/stores/uiStore";

/**
 * The Locations listing's sort-mode control: server/default order vs grouped by place-type level.
 * Reads/writes the per-device `locationSortMode` uiStore pref consumed by `useLocationSortedTree`
 * (`entities/location.tsx`). Rendered via the tree scaffold's `renderToolbar` slot, left of the
 * ExpandAllToggle.
 */
export function LocationSortToggle() {
  const sortMode = useUiStore(state => state.locationSortMode);
  const setSortMode = useUiStore(state => state.setLocationSortMode);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Sort</span>
      <ToggleGroup
        type="single"
        size="sm"
        variant="outline"
        value={sortMode}
        onValueChange={(value) => {
          if (value === "default" || value === "place-type") setSortMode(value);
        }}
        aria-label="Sort locations"
      >
        <ToggleGroupItem value="default">Default</ToggleGroupItem>
        <ToggleGroupItem value="place-type">Place type</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
