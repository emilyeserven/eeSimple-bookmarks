import type {
  AutomationSettings,
  DisplayPreferenceSettings,
  SidebarOpenModifier,
} from "@eesimple/types";

import {
  useAutomationSettings,
  useDisplayPreferenceSettings,
  useUpdateAutomationSettings,
  useUpdateDisplayPreferenceSettings,
} from "../hooks/useAppSettings";
import { notifyError, notifySuccess } from "../lib/notifications";
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
  filtersInDrawer: false,
  filtersHidden: false,
  panelPinned: false,
  drawerUnpinnedBreakpoints: [768],
  croppedWidth: 16,
  croppedHeight: 9,
  customPropertyTypeIcons: null,
  onDemandFilters: [],
  showRomanizedByDefault: false,
  sortByRomanized: true,
  showLocationAncestorsOnMap: false,
  minAreaPinThresholdKm2: 0,
  bookmarksPerPage: 25,
  mapPinScale: 1,
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

  /** Persist a single display-preference field and fire the named toast. */
  function saveDisplay(patch: Partial<DisplayPreferenceSettings>, message: string): void {
    updateDisplay.mutate({
      ...display,
      ...patch,
    }, {
      onSuccess: () => notifySuccess(message),
      onError: error => notifyError(error.message),
    });
  }

  function setPanelPinned(isPinned: boolean) {
    saveDisplay(
      {
        panelPinned: isPinned,
      },
      isPinned ? "Drawer pinned by default" : "Drawer unpinned by default",
    );
    if (isPinned && !isOpen) open();
  }

  function setSidebarOpenModifier(value: SidebarOpenModifier) {
    updateAutomation.mutate({
      ...automation,
      sidebarOpenModifier: value,
    }, {
      onSuccess: () => notifySuccess("Open-in-drawer key updated"),
      onError: error => notifyError(error.message),
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pin drawer by default</CardTitle>
          <CardDescription>
            When on, the drawer docks as a persistent column on the right side. The pin button
            inside the drawer lets you toggle this on the fly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Checkbox
              id="panel-pinned"
              checked={display.panelPinned}
              onCheckedChange={checked => setPanelPinned(checked === true)}
            />
            <Label htmlFor="panel-pinned">Pin the drawer by default</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Open in drawer</CardTitle>
          <CardDescription>
            Edit buttons open the item&rsquo;s full page by default. Hold this key while clicking an
            Edit button to open the item in the right-hand drawer instead.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <Label htmlFor="sidebar-modifier-select">Modifier key</Label>
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
