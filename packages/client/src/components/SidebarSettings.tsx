import type {
  AutomationSettings,
  DisplayPreferenceSettings,
  SidebarOpenModifier,
} from "@eesimple/types";

import { useTranslation } from "react-i18next";

import {
  useAutomationSettings,
  useDisplayPreferenceSettings,
  useUpdateAutomationSettings,
  useUpdateDisplayPreferenceSettings,
} from "../hooks/useAppSettings";
import { usePanelControls } from "./panel/usePanelControls";

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
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";

const DISPLAY_DEFAULTS: DisplayPreferenceSettings = {
  bookmarkDetailImageSize: "medium",
  bookmarkDetailVideoSize: "standard",
  bookmarkDetailLayout: "single",
  interfaceLanguage: "en",
  secondaryLanguageId: null,
  filtersInDrawer: false,
  filtersHidden: false,
  panelPinned: false,
  drawerUnpinnedBreakpoints: [768],
  croppedWidth: 16,
  croppedHeight: 9,
  customPropertyTypeIcons: null,
  onDemandFilters: [],
  hanScriptLanguage: "ja",
  minAreaPinThresholdKm2: 0,
  bookmarksPerPage: 25,
  mapPinScale: 1,
  screenshotDefaultDelayMs: 0,
  screenshotDefaultWidth: 1280,
  screenshotDefaultHeight: 720,
  screenshotDefaultScrollDistance: 0,
};

const AUTOMATION_DEFAULTS: AutomationSettings = {
  autoFetchTitle: true,
  autoFetchImage: true,
  autoApplyTitleTags: false,
  autoApplyTitleLocations: false,
  sidebarOpenModifier: "alt",
};

/** Drawer preferences — pin behaviour, responsive breakpoints, and modifier key. */
export function SidebarSettings() {
  const {
    t,
  } = useTranslation();
  const {
    data: displayData,
  } = useDisplayPreferenceSettings();
  const {
    data: automationData,
  } = useAutomationSettings();
  const updateDisplay = useUpdateDisplayPreferenceSettings();
  const updateAutomation = useUpdateAutomationSettings();
  const display = displayData ?? DISPLAY_DEFAULTS;
  const automation = automationData ?? AUTOMATION_DEFAULTS;
  const {
    open, isOpen,
  } = usePanelControls();

  /** Persist a single display-preference field; the hook fires the named toast. */
  function saveDisplay(patch: Partial<DisplayPreferenceSettings>, message: string): void {
    updateDisplay.mutate({
      input: {
        ...display,
        ...patch,
      },
      successMessage: message,
    });
  }

  function setPanelPinned(isPinned: boolean) {
    saveDisplay(
      {
        panelPinned: isPinned,
      },
      isPinned ? t("Drawer pinned by default") : t("Drawer unpinned by default"),
    );
    if (isPinned && !isOpen) open();
  }

  function setSidebarOpenModifier(value: SidebarOpenModifier) {
    updateAutomation.mutate({
      input: {
        ...automation,
        sidebarOpenModifier: value,
      },
      successMessage: t("Open-in-drawer key updated"),
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("Pin drawer by default")}</CardTitle>
          <CardDescription>
            {t(
              "When on, the drawer docks as a persistent column on the right side. The pin button inside the drawer lets you toggle this on the fly.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Checkbox
              id="panel-pinned"
              checked={display.panelPinned}
              onCheckedChange={checked => setPanelPinned(checked === true)}
            />
            <Label htmlFor="panel-pinned">{t("Pin the drawer by default")}</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Open in drawer")}</CardTitle>
          <CardDescription>
            {t(
              "Edit buttons open the item’s full page by default. Hold this key while clicking an Edit button to open the item in the right-hand drawer instead.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <Label htmlFor="sidebar-modifier-select">{t("Modifier key")}</Label>
          <Select
            value={automation.sidebarOpenModifier}
            onValueChange={value => setSidebarOpenModifier(value as SidebarOpenModifier)}
          >
            <SelectTrigger
              id="sidebar-modifier-select"
              className="
                w-full
                sm:w-60
              "
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SIDEBAR_MODIFIER_LABELS) as SidebarOpenModifier[]).map(value => (
                <SelectItem
                  key={value}
                  value={value}
                >
                  {SIDEBAR_MODIFIER_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}
