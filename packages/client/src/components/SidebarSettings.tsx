import type { SidebarOpenModifier } from "../stores/uiStore";

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
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";

/** Sidebar preferences — choose which modifier opens an Edit click in the right-hand panel. */
export function SidebarSettings() {
  const sidebarOpenModifier = useUiStore(state => state.sidebarOpenModifier);
  const setSidebarOpenModifier = useUiStore(state => state.setSidebarOpenModifier);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Open in sidebar</CardTitle>
          <CardDescription>
            Edit buttons open the item&rsquo;s full page by default. Hold this key while clicking an
            Edit button to open the item in the right-hand sidebar instead.
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
