import type { PlaceTypeOption } from "../lib/locationLevels";
import type { PlaceTypeLevelGroup, PlaceTypeIconConfig } from "@eesimple/types";

import { useState } from "react";

import { MapPin, Shapes } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconPicker } from "@/components/ui/icon-picker";
import { cn } from "@/lib/utils";

interface PlaceTypeIconsCardProps {
  /** The discovered place types (∪ any assigned), label-sorted — one picker row each. */
  options: PlaceTypeOption[];
  /** All configured level groups — used to split options by display mode. */
  groups: PlaceTypeLevelGroup[];
  /** The user's per-placeType icon overrides (a sparse placeType key → Lucide icon name map). */
  icons: PlaceTypeIconConfig;
  /** Persist a single place type's icon. */
  onSetIcon: (placeTypeKey: string, iconName: string) => void;
  /** Clear all icon overrides. */
  onReset: () => void;
}

/**
 * The "Place Type Icons" settings card: an icon picker per discovered place type plus a reset button.
 * Place types are split into two tabs: those assigned to pin-mode levels (the icon appears inside a
 * map pin), and those in area-mode levels or unassigned (the icon is used for fallback pin rendering).
 * The chosen Lucide icon is drawn inside that place type's map pin. Mirrors {@link PropertyTypeIconsCard}.
 */
export function PlaceTypeIconsCard({
  options, groups, icons, onSetIcon, onReset,
}: PlaceTypeIconsCardProps) {
  const [tab, setTab] = useState<"pin" | "area">("pin");

  // Place types assigned to at least one pin-mode level.
  const pinTypeKeys = new Set(
    groups.filter(g => g.displayMode === "pin").flatMap(g => g.placeTypes),
  );
  const pinOptions = options.filter(o => pinTypeKeys.has(o.key));
  // Everything else: area-assigned or unassigned (defaults to area rendering).
  const areaOptions = options.filter(o => !pinTypeKeys.has(o.key));

  const currentOptions = tab === "pin" ? pinOptions : areaOptions;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Place Type Icons</CardTitle>
        <CardDescription>
          Choose an icon for each place type map pin. The icon is drawn inside the pin on the
          Locations map.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tab switcher */}
        <nav
          aria-label="Place type icon tabs"
          className="flex gap-1 border-b pb-1"
        >
          {(["pin", "area"] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                `
                  flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm
                  font-medium transition-colors
                `,
                tab === t
                  ? "bg-accent text-accent-foreground"
                  : `
                    text-muted-foreground
                    hover:bg-accent/50 hover:text-foreground
                  `,
              )}
            >
              {t === "pin"
                ? <MapPin className="size-3.5" />
                : <Shapes className="size-3.5" />}
              {t === "pin" ? "Pin" : "Area"}
            </button>
          ))}
        </nav>

        {options.length === 0
          ? (
            <p className="text-sm text-muted-foreground">
              No place types discovered yet. Add locations (or assign place types to a level above) and
              they will appear here.
            </p>
          )
          : currentOptions.length === 0
            ? (
              <p className="text-sm text-muted-foreground">
                {tab === "pin"
                  ? "No place types are assigned to any pin-mode level. Switch to the Area tab or assign place types to a Pin level group above."
                  : "No area or unassigned place types yet."}
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
                  {currentOptions.map(option => (
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
