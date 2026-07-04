import type { Theme } from "../stores/uiStore";
import type {
  CustomPropertyType,
  DisplayPreferenceSettings,
  InterfaceLanguage,
} from "@eesimple/types";

import { BOOKMARKS_PER_PAGE_OPTIONS, DEFAULT_BOOKMARKS_PER_PAGE } from "@eesimple/types";

import { PropertyTypeIconsCard } from "./PropertyTypeIconsCard";
import { SegmentedToggleRow } from "./SegmentedToggleRow";
import {
  useDisplayPreferenceSettings,
  useUpdateDisplayPreferenceSettings,
} from "../hooks/useAppSettings";
import { useUiStore } from "../stores/uiStore";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const THEME_LABELS: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const DISPLAY_DEFAULTS: Pick<
  DisplayPreferenceSettings,
  "customPropertyTypeIcons" | "showRomanizedByDefault" | "sortByRomanized" | "bookmarksPerPage" | "interfaceLanguage"
> = {
  customPropertyTypeIcons: null,
  showRomanizedByDefault: false,
  sortByRomanized: true,
  bookmarksPerPage: DEFAULT_BOOKMARKS_PER_PAGE,
  interfaceLanguage: "en",
};

const LANGUAGE_OPTIONS = [
  {
    value: "en",
    label: "English",
  },
  {
    value: "ja",
    label: "日本語",
  },
] as const satisfies readonly { value: InterfaceLanguage;
  label: string; }[];

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

  /** Persist a single display-preference field; the hook fires the named toast. */
  function saveDisplay(patch: Partial<DisplayPreferenceSettings>, message: string): void {
    if (!displayData) return;
    updateDisplay.mutate({
      input: {
        ...displayData,
        ...patch,
      },
      successMessage: message,
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
  const setBookmarksPerPage = (value: number) =>
    saveDisplay({
      bookmarksPerPage: value,
    }, "Bookmarks per page updated");
  const setInterfaceLanguage = (value: InterfaceLanguage) =>
    saveDisplay({
      interfaceLanguage: value,
    }, "Interface language updated");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Interface language</CardTitle>
          <CardDescription>
            Choose the language the interface is displayed in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SegmentedToggleRow
            label="Interface language"
            options={LANGUAGE_OPTIONS}
            value={display.interfaceLanguage}
            onChange={setInterfaceLanguage}
          />
        </CardContent>
      </Card>

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
          <CardTitle>Bookmarks per page</CardTitle>
          <CardDescription>
            How many bookmarks each listing page shows before paginating. Applies to the Bookmarks
            page and every entity-scoped bookmark listing (categories, tags, websites, media types,
            YouTube channels, …).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <Label htmlFor="bookmarks-per-page-select">Bookmarks per page</Label>
          <Select
            value={String(display.bookmarksPerPage)}
            onValueChange={value => setBookmarksPerPage(Number(value))}
          >
            <SelectTrigger
              id="bookmarks-per-page-select"
              className="
                w-full
                sm:w-60
              "
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BOOKMARKS_PER_PAGE_OPTIONS.map(value => (
                <SelectItem
                  key={value}
                  value={String(value)}
                >
                  {value}
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

      <PropertyTypeIconsCard
        customPropertyTypeIcons={display.customPropertyTypeIcons}
        onSetIcon={setPropertyTypeIcon}
        onReset={resetPropertyTypeIcons}
      />
    </div>
  );
}
