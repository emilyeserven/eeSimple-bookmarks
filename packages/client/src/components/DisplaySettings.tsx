import type { Theme } from "../stores/uiStore";

import { HomepageSettings } from "./HomepageSettings";
import { useCategories } from "../hooks/useCategories";
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
import { CategoryIcon } from "@/lib/icons";

const THEME_LABELS: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const TAXONOMY_ITEMS = [
  {
    key: "tags",
    label: "Tags",
  },
  {
    key: "websites",
    label: "Websites",
  },
] as const;

/** Display preferences — a theme switcher (light / dark / system) and sidebar section toggles. */
export function DisplaySettings() {
  const theme = useUiStore(state => state.theme);
  const setTheme = useUiStore(state => state.setTheme);
  const hiddenCategoryIds = useUiStore(state => state.hiddenCategoryIds);
  const toggleCategoryVisibility = useUiStore(state => state.toggleCategoryVisibility);
  const hiddenTaxonomyItems = useUiStore(state => state.hiddenTaxonomyItems);
  const toggleTaxonomyItem = useUiStore(state => state.toggleTaxonomyItem);

  const {
    data: categories,
  } = useCategories();

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
          <CardTitle>Sidebar</CardTitle>
          <CardDescription>
            Choose which items appear in the left sidebar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Categories</p>
            {categories && categories.length > 0
              ? (
                <div className="space-y-2">
                  {categories.map(category => (
                    <div
                      key={category.id}
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        id={`show-category-${category.id}`}
                        checked={!hiddenCategoryIds.includes(category.id)}
                        onCheckedChange={() => toggleCategoryVisibility(category.id)}
                      />
                      <Label
                        htmlFor={`show-category-${category.id}`}
                        className="flex items-center gap-1.5"
                      >
                        <CategoryIcon name={category.icon} />
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )
              : (
                <p className="text-sm text-muted-foreground">No categories yet.</p>
              )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Taxonomies</p>
            {TAXONOMY_ITEMS.map(item => (
              <div
                key={item.key}
                className="flex items-center gap-2"
              >
                <Checkbox
                  id={`show-taxonomy-${item.key}`}
                  checked={!hiddenTaxonomyItems.includes(item.key)}
                  onCheckedChange={() => toggleTaxonomyItem(item.key)}
                />
                <Label htmlFor={`show-taxonomy-${item.key}`}>{item.label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <HomepageSettings />
    </div>
  );
}
