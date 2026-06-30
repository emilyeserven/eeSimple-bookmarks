import type { PlaceTypeOption } from "../lib/locationLevels";
import type { PlaceTypeIconConfig } from "@eesimple/types";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconPicker } from "@/components/ui/icon-picker";

interface PlaceTypeIconsCardProps {
  /** The discovered place types (∪ any assigned), label-sorted — one picker row each. */
  options: PlaceTypeOption[];
  /** The user's per-placeType icon overrides (a sparse placeType key → Lucide icon name map). */
  icons: PlaceTypeIconConfig;
  /** Persist a single place type's icon. */
  onSetIcon: (placeTypeKey: string, iconName: string) => void;
  /** Clear all icon overrides. */
  onReset: () => void;
}

/**
 * The "Place Type Icons" settings card: an icon picker per discovered place type plus a reset button.
 * The chosen Lucide icon is drawn inside that place type's map pin. Configured per place type (not per
 * level group) so place types sharing a group can still show distinct icons. Mirrors
 * {@link PropertyTypeIconsCard}.
 */
export function PlaceTypeIconsCard({
  options, icons, onSetIcon, onReset,
}: PlaceTypeIconsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Place Type Icons</CardTitle>
        <CardDescription>
          Choose an icon for each place type’s map pin. The icon is drawn inside the pin on the
          Locations map.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {options.length === 0
          ? (
            <p className="text-sm text-muted-foreground">
              No place types discovered yet. Add locations (or assign place types to a level above) and
              they’ll appear here.
            </p>
          )
          : (
            <>
              <div
                className="
                  grid grid-cols-1 gap-3
                  2xl:grid-cols-2
                "
              >
                {options.map(option => (
                  <div
                    key={option.key}
                    className="flex items-center gap-3"
                  >
                    <span className="w-28 shrink-0 text-sm font-medium">
                      {option.label}
                    </span>
                    <IconPicker
                      value={icons[option.key] ?? null}
                      onChange={iconName => onSetIcon(option.key, iconName)}
                      aria-label={`Icon for ${option.label}`}
                      className="max-w-xs"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onReset}
                >
                  Reset to defaults
                </Button>
              </div>
            </>
          )}
      </CardContent>
    </Card>
  );
}
