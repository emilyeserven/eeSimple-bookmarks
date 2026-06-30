import type { PlaceTypeOption } from "../lib/locationLevels";
import type { PlaceTypeColorConfig, PlaceTypeLevelGroup, PlaceTypeIconConfig } from "@eesimple/types";

import { useMemo, useState } from "react";

import { NO_LEVEL_MAP_COLOR } from "@eesimple/types";
import { MapPin, Shapes } from "lucide-react";

import { LevelColorControl } from "./LevelColorControl";

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
  /** The user's per-placeType color overrides (a sparse placeType key → `#rrggbb` hex map). */
  colors: PlaceTypeColorConfig;
  /** Persist (or clear, with `null`) a single place type's color. */
  onSetColor: (placeTypeKey: string, color: string | null) => void;
  /** Clear all color overrides. */
  onResetColors: () => void;
}

/**
 * The "Pin Style" settings card: per discovered place type, an icon picker plus a color swatch (one
 * row controls that place type's whole pin appearance), with reset buttons. Place types are split into
 * two tabs: those assigned to pin-mode levels (the icon/color applies to the map pin), and those in
 * area-mode levels or unassigned. The chosen icon is drawn inside the pin; the color overrides the
 * level group's color for that place type. Mirrors {@link PropertyTypeIconsCard}.
 */
export function PlaceTypeIconsCard({
  options, groups, icons, onSetIcon, onReset, colors, onSetColor, onResetColors,
}: PlaceTypeIconsCardProps) {
  const [tab, setTab] = useState<"pin" | "area">("pin");

  // Place types assigned to at least one pin-mode level.
  const pinTypeKeys = new Set(
    groups.filter(g => g.displayMode === "pin").flatMap(g => g.placeTypes),
  );
  // Place types assigned to any level at all (pin- or area-mode) — the rest lack a level entirely.
  const assignedKeys = useMemo(
    () => new Set(groups.flatMap(group => group.placeTypes)),
    [groups],
  );
  const pinOptions = options.filter(o => pinTypeKeys.has(o.key));
  // Everything else: area-assigned or unassigned (defaults to area rendering).
  const areaOptions = options.filter(o => !pinTypeKeys.has(o.key));

  const currentOptions = tab === "pin" ? pinOptions : areaOptions;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pin Style</CardTitle>
        <CardDescription>
          Choose an icon and a color for each place type. The icon is drawn inside the pin on the
          Locations map; the color overrides the level-group color for that place type.
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
                      <span
                        className="
                          flex w-28 shrink-0 items-center gap-1.5 text-sm
                          font-medium
                        "
                      >
                        {!assignedKeys.has(option.key)
                          ? (
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{
                                backgroundColor: NO_LEVEL_MAP_COLOR,
                              }}
                              title={`${option.label} isn’t assigned to any level`}
                              aria-hidden="true"
                            />
                          )
                          : null}
                        <span className="truncate">{option.label}</span>
                      </span>
                      <IconPicker
                        value={icons[option.key] ?? null}
                        onChange={iconName => onSetIcon(option.key, iconName)}
                        aria-label={`Icon for ${option.label}`}
                        className="max-w-xs"
                      />
                      <LevelColorControl
                        color={colors[option.key] ?? null}
                        label={option.label}
                        onChange={color => onSetColor(option.key, color)}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onReset}
                  >
                    Reset icons
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onResetColors}
                  >
                    Reset colors
                  </Button>
                </div>
              </>
            )}
      </CardContent>
    </Card>
  );
}
