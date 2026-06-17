import type { Theme } from "../stores/uiStore";

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

/** Display preferences — a theme switcher (light / dark / system) and sidebar section toggles. */
export function DisplaySettings() {
  const theme = useUiStore(state => state.theme);
  const setTheme = useUiStore(state => state.setTheme);
  const showCategoriesInSidebar = useUiStore(state => state.showCategoriesInSidebar);
  const setShowCategoriesInSidebar = useUiStore(state => state.setShowCategoriesInSidebar);
  const showTaxonomiesInSidebar = useUiStore(state => state.showTaxonomiesInSidebar);
  const setShowTaxonomiesInSidebar = useUiStore(state => state.setShowTaxonomiesInSidebar);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Choose a color theme. “System” follows your operating system setting.
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
          <CardTitle>Sidebar</CardTitle>
          <CardDescription>
            Choose which sections appear in the left sidebar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-categories"
              checked={showCategoriesInSidebar}
              onCheckedChange={checked => setShowCategoriesInSidebar(checked === true)}
            />
            <Label htmlFor="show-categories">Show Categories</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-taxonomies"
              checked={showTaxonomiesInSidebar}
              onCheckedChange={checked => setShowTaxonomiesInSidebar(checked === true)}
            />
            <Label htmlFor="show-taxonomies">Show Taxonomies</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
