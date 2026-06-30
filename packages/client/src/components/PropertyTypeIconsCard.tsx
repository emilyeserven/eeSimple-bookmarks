import type { CustomPropertyType } from "@eesimple/types";

import {
  CUSTOM_PROPERTY_TYPE_LABELS,
  CUSTOM_PROPERTY_TYPES,
} from "@eesimple/types";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconPicker } from "@/components/ui/icon-picker";
import { CUSTOM_PROPERTY_TYPE_ICONS } from "@/lib/propertyFormat";

interface PropertyTypeIconsCardProps {
  /** The user's per-type icon overrides (null = use defaults). */
  customPropertyTypeIcons: Record<string, string> | null;
  /** Persist a single type's icon override. */
  onSetIcon: (type: CustomPropertyType, iconName: string) => void;
  /** Clear all overrides back to defaults. */
  onReset: () => void;
}

/**
 * The "Property Type Icons" settings card: an icon picker per custom-property type plus a reset
 * button. Split out of `DisplayGeneralSettings` so each card carries only its own imports.
 */
export function PropertyTypeIconsCard({
  customPropertyTypeIcons, onSetIcon, onReset,
}: PropertyTypeIconsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Type Icons</CardTitle>
        <CardDescription>
          Choose an icon for each custom property type. These icons appear next to the type badge
          in property listings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="
            grid grid-cols-1 gap-3
            2xl:grid-cols-2
          "
        >
          {CUSTOM_PROPERTY_TYPES.map(type => (
            <div
              key={type}
              className="flex items-center gap-3"
            >
              <span className="w-28 shrink-0 text-sm font-medium">
                {CUSTOM_PROPERTY_TYPE_LABELS[type]}
              </span>
              <IconPicker
                value={customPropertyTypeIcons?.[type] ?? CUSTOM_PROPERTY_TYPE_ICONS[type]}
                onChange={iconName => onSetIcon(type, iconName)}
                aria-label={`Icon for ${CUSTOM_PROPERTY_TYPE_LABELS[type]}`}
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
      </CardContent>
    </Card>
  );
}
