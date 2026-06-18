import type { SidebarOpenModifier } from "../stores/uiStore";

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
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";

const BREAKPOINT_OPTIONS = [
  {
    px: 640,
    label: "640 px — Small (sm)",
  },
  {
    px: 768,
    label: "768 px — Medium (md)",
  },
  {
    px: 1024,
    label: "1024 px — Large (lg)",
  },
  {
    px: 1280,
    label: "1280 px — Extra Large (xl)",
  },
  {
    px: 1536,
    label: "1536 px — 2× Large (2xl)",
  },
] as const;

/** Drawer preferences — pin behaviour, responsive breakpoints, and modifier key. */
export function SidebarSettings() {
  const sidebarOpenModifier = useUiStore(state => state.sidebarOpenModifier);
  const setSidebarOpenModifier = useUiStore(state => state.setSidebarOpenModifier);
  const panelPinned = useUiStore(state => state.panelPinned);
  const setPanelPinned = useUiStore(state => state.setPanelPinned);
  const drawerUnpinnedBreakpoints = useUiStore(state => state.drawerUnpinnedBreakpoints);
  const setDrawerUnpinnedBreakpoints = useUiStore(state => state.setDrawerUnpinnedBreakpoints);

  function toggleBreakpoint(px: number) {
    setDrawerUnpinnedBreakpoints(
      drawerUnpinnedBreakpoints.includes(px)
        ? drawerUnpinnedBreakpoints.filter(b => b !== px)
        : [...drawerUnpinnedBreakpoints, px],
    );
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
              checked={panelPinned}
              onCheckedChange={checked => setPanelPinned(checked === true)}
            />
            <Label htmlFor="panel-pinned">Pin the drawer by default</Label>
          </div>
        </CardContent>
      </Card>

      {panelPinned && (
        <Card>
          <CardHeader>
            <CardTitle>Unpin below viewport width</CardTitle>
            <CardDescription>
              At these viewport widths the drawer floats as an overlay, even when pinned by default.
              Check every size at which you want it to float.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {BREAKPOINT_OPTIONS.map(({
              px,
              label,
            }) => (
              <div
                key={px}
                className="flex items-center gap-2"
              >
                <Checkbox
                  id={`breakpoint-${px}`}
                  checked={drawerUnpinnedBreakpoints.includes(px)}
                  onCheckedChange={() => toggleBreakpoint(px)}
                />
                <Label htmlFor={`breakpoint-${px}`}>
                  Below {label}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
            value={sidebarOpenModifier}
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
