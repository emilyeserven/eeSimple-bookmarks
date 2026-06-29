import type { Theme } from "../stores/uiStore";
import type {
  CustomPropertyType,
  DisplayPreferenceSettings,
} from "@eesimple/types";

import {
  CUSTOM_PROPERTY_TYPE_LABELS,
  CUSTOM_PROPERTY_TYPES,
} from "@eesimple/types";

import {
  useDisplayPreferenceSettings,
  useUpdateDisplayPreferenceSettings,
} from "../hooks/useAppSettings";
import { notifyError, notifySuccess } from "../lib/notifications";
import { useUiStore } from "../stores/uiStore";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { IconPicker } from "@/components/ui/icon-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CUSTOM_PROPERTY_TYPE_ICONS } from "@/lib/propertyFormat";

const THEME_LABELS: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const DISPLAY_DEFAULTS: Pick<
  DisplayPreferenceSettings,
  "customPropertyTypeIcons" | "showRomanizedByDefault" | "sortByRomanized"
> = {
  customPropertyTypeIcons: null,
  showRomanizedByDefault: false,
  sortByRomanized: true,
};

/** General display preferences — theme, romanized-name handling, and per-type property icons. */
export function DisplayGeneralSettings() {
  // Theme stays a device-local pref (often dark-on-phone / light-on-desktop), so it remains in uiStore.
  const theme = useUiStore(state => state.theme);
  const setTheme = useUiStore(state => state.setTheme);

  const {
    data: displayData,
  } = useDisplayPreferenceSettings();
  const updateDisplay = useUpdateDisplayPreferenceSettings();
  const display = {
    ...DISPLAY_DEFAULTS,
    ...displayData,
  };

  /** Persist a single display-preference field and fire the named toast. */
  function saveDisplay(patch: Partial<DisplayPreferenceSettings>, message: string): void {
    if (!displayData) return;
    updateDisplay.mutate({
      ...displayData,
      ...patch,
    }, {
      onSuccess: () => notifySuccess(message),
      onError: error => notifyError(error.message),
    });
  }

  function setPropertyTypeIcon(type: CustomPropertyType, iconName: string): void {
    const current = display.customPropertyTypeIcons ?? {};
    saveDisplay({
      customPropertyTypeIcons: {
        ...current,
        [type]: iconName,
      },
    }, "Property type icon updated");
  }

  function resetPropertyTypeIcons(): void {
    saveDisplay({
      customPropertyTypeIcons: null,
    }, "Property type icons reset to defaults");
  }

  const setShowRomanizedByDefault = (value: boolean) =>
    saveDisplay({
      showRomanizedByDefault: value,
    }, "Romanized display updated");
  const setSortByRomanized = (value: boolean) =>
    saveDisplay({
      sortByRomanized: value,
    }, "Romanized sort updated");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Choose a color theme. &ldquo;System&rdquo; follows your operating system setting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <Label htmlFor="theme-select">Theme</Label>
          <Select
            value={theme}
            onValueChange={value => setTheme(value as Theme)}
          >
            <SelectTrigger
              id="theme-select"
              className="
                w-full
                sm:w-60
              "
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(THEME_LABELS) as Theme[]).map(value => (
                <SelectItem
                  key={value}
                  value={value}
                >
                  {THEME_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Romanized names</CardTitle>
          <CardDescription>
            Control how romanized names/titles are shown and sorted. When an item has a romanized
            form it is always shown de-emphasized after the primary label.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2">
            <Checkbox
              id="show-romanized-default"
              checked={display.showRomanizedByDefault}
              onCheckedChange={checked => setShowRomanizedByDefault(checked === true)}
            />
            <div className="space-y-0.5">
              <Label htmlFor="show-romanized-default">Show Romanized by default</Label>
              <p className="text-sm text-muted-foreground">
                Make the romanized form the primary label (the real name shows de-emphasized after
                it). Off by default.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="sort-by-romanized"
              checked={display.sortByRomanized}
              onCheckedChange={checked => setSortByRomanized(checked === true)}
            />
            <div className="space-y-0.5">
              <Label htmlFor="sort-by-romanized">Sort by Romanized</Label>
              <p className="text-sm text-muted-foreground">
                Use the romanized value as the sort key when sorting alphabetically (items without a
                romanized form fall back to their name). On by default.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
              sm:grid-cols-2
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
                  value={display.customPropertyTypeIcons?.[type] ?? CUSTOM_PROPERTY_TYPE_ICONS[type]}
                  onChange={iconName => setPropertyTypeIcon(type, iconName)}
                  aria-label={`Icon for ${CUSTOM_PROPERTY_TYPE_LABELS[type]}`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetPropertyTypeIcons}
            >
              Reset to defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
