import type { Theme } from "../stores/uiStore";
import type {
  BookmarkSort,
  CustomPropertyType,
  DisplayPreferenceSettings,
  InterfaceLanguage,
} from "@eesimple/types";

import { BOOKMARKS_PER_PAGE_OPTIONS, DEFAULT_BOOKMARKS_PER_PAGE } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { BookmarkSortEditor } from "./BookmarkSortFields";
import { Combobox } from "./Combobox";
import { PropertyTypeIconsCard } from "./PropertyTypeIconsCard";
import { SegmentedToggleRow } from "./SegmentedToggleRow";
import {
  useDisplayPreferenceSettings,
  useUpdateDisplayPreferenceSettings,
} from "../hooks/useAppSettings";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useLanguages } from "../hooks/useLanguages";
import { useUiStore } from "../stores/uiStore";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  "customPropertyTypeIcons" | "bookmarksPerPage" | "defaultBookmarkSort" | "interfaceLanguage" | "hanScriptLanguage" | "secondaryLanguageId"
> = {
  customPropertyTypeIcons: null,
  bookmarksPerPage: DEFAULT_BOOKMARKS_PER_PAGE,
  defaultBookmarkSort: null,
  interfaceLanguage: "en",
  hanScriptLanguage: "ja",
  secondaryLanguageId: null,
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

/** General display preferences — theme, interface language, and per-type property icons. */
export function DisplayGeneralSettings() {
  const {
    t,
  } = useTranslation();
  // Theme stays a device-local pref (often dark-on-phone / light-on-desktop), so it remains in uiStore.
  const theme = useUiStore(state => state.theme);
  const setTheme = useUiStore(state => state.setTheme);

  const {
    data: displayData,
  } = useDisplayPreferenceSettings();
  const updateDisplay = useUpdateDisplayPreferenceSettings();
  const {
    data: languages = [],
  } = useLanguages();
  const {
    data: properties = [],
  } = useCustomProperties();
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

  const setHanScriptLanguage = (value: "ja" | "zh") =>
    saveDisplay({
      hanScriptLanguage: value,
    }, "Han-only name language updated");
  const setBookmarksPerPage = (value: number) =>
    saveDisplay({
      bookmarksPerPage: value,
    }, "Bookmarks per page updated");
  // allowRandom is omitted below, so the editor never actually offers a random sort here — narrow
  // defensively since BookmarkSortEditor's onChange is typed over the wider BookmarkSort union.
  const setDefaultBookmarkSort = (sort: BookmarkSort | undefined) =>
    saveDisplay({
      defaultBookmarkSort: sort && !("random" in sort) ? sort : null,
    }, "Default sort order updated");
  const setInterfaceLanguage = (value: InterfaceLanguage) =>
    saveDisplay({
      interfaceLanguage: value,
    }, "Interface language updated");
  const setSecondaryLanguageId = (value: string | undefined) =>
    saveDisplay({
      secondaryLanguageId: value ?? null,
    }, "Secondary display language updated");

  const languageOptions = languages.map(l => ({
    value: l.id,
    label: l.name,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("Interface language")}</CardTitle>
          <CardDescription>
            {t("Choose the language the interface is displayed in.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SegmentedToggleRow
            label={t("Interface language")}
            options={LANGUAGE_OPTIONS}
            value={display.interfaceLanguage}
            onChange={setInterfaceLanguage}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Theme")}</CardTitle>
          <CardDescription>
            {t("Choose a color theme. “System” follows your operating system setting.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <Label htmlFor="theme-select">{t("Theme")}</Label>
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
                  {t(THEME_LABELS[value])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Bookmarks per page")}</CardTitle>
          <CardDescription>
            {t("How many bookmarks each listing page shows before paginating. Applies to the Bookmarks page and every entity-scoped bookmark listing (categories, tags, websites, media types, YouTube channels, …).")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <Label htmlFor="bookmarks-per-page-select">{t("Bookmarks per page")}</Label>
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
          <CardTitle>{t("Default sort order")}</CardTitle>
          <CardDescription>
            {t("The order bookmark listings open in when no sort is chosen for that visit. Explicitly picking a sort on a listing page still overrides this.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookmarkSortEditor
            value={display.defaultBookmarkSort ?? undefined}
            onChange={setDefaultBookmarkSort}
            properties={properties}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Names")}</CardTitle>
          <CardDescription>
            {t("Control how names with ambiguous Han-only script are resolved.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="han-script-language-select">{t("Han-only name language")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("Names written only in Han characters (kanji/hanzi, no kana) are ambiguous between Japanese and Chinese. Choose which language to assume for them. Japanese by default.")}
            </p>
            <Select
              value={display.hanScriptLanguage}
              onValueChange={value => setHanScriptLanguage(value === "zh" ? "zh" : "ja")}
            >
              <SelectTrigger
                id="han-script-language-select"
                className="
                  w-full
                  sm:w-60
                "
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ja">{t("Japanese")}</SelectItem>
                <SelectItem value="zh">{t("Chinese")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="secondary-display-language-combobox">{t("Secondary display language")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("When an entity has names in multiple languages, this is the language shown as the secondary name (e.g. in breadcrumbs). Leave unset to auto-choose an English or other alternate name.")}
            </p>
            <Combobox
              id="secondary-display-language-combobox"
              className="
                w-full
                sm:w-60
              "
              placeholder={t("None (auto)")}
              searchPlaceholder={t("Search languages…")}
              emptyText={t("No languages found.")}
              options={languageOptions}
              value={display.secondaryLanguageId ?? undefined}
              onValueChange={setSecondaryLanguageId}
            />
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
