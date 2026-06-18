import type { Theme } from "../stores/uiStore";

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
  {
    key: "media-types",
    label: "Media Types",
  },
  {
    key: "youtube-channels",
    label: "YouTube Channels",
  },
] as const;

const CUSTOMIZATION_ITEMS = [
  {
    key: "custom-properties",
    label: "Custom Properties",
  },
  {
    key: "property-groups",
    label: "Property Groups",
  },
  {
    key: "autofill",
    label: "Autofill Rules",
  },
] as const;

const MANAGEMENT_ITEMS = [
  {
    key: "categories",
    label: "Categories",
  },
  {
    key: "tags",
    label: "Tags",
  },
] as const;

const SIDEBAR_GROUPS = [
  {
    key: "categories",
    label: "Categories",
  },
  {
    key: "taxonomies",
    label: "Taxonomies",
  },
  {
    key: "customization",
    label: "Customization",
  },
  {
    key: "management",
    label: "Management",
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
  const hiddenCustomizationItems = useUiStore(state => state.hiddenCustomizationItems);
  const toggleCustomizationItem = useUiStore(state => state.toggleCustomizationItem);
  const hiddenManagementItems = useUiStore(state => state.hiddenManagementItems);
  const toggleManagementItem = useUiStore(state => state.toggleManagementItem);
  const hiddenSidebarGroups = useUiStore(state => state.hiddenSidebarGroups);
  const toggleSidebarGroup = useUiStore(state => state.toggleSidebarGroup);

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

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Sidebar</h3>
          <p className="text-sm text-muted-foreground">
            Choose which groups and items appear in the left sidebar.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {SIDEBAR_GROUPS.map(group => (
            <div
              key={group.key}
              className="flex items-center gap-2"
            >
              <Checkbox
                id={`group-${group.key}`}
                checked={!hiddenSidebarGroups.includes(group.key)}
                onCheckedChange={() => toggleSidebarGroup(group.key)}
              />
              <Label htmlFor={`group-${group.key}`}>{group.label}</Label>
            </div>
          ))}
        </div>

        <div
          className="
            grid grid-cols-1 gap-4
            sm:grid-cols-2
          "
        >
          {!hiddenSidebarGroups.includes("categories") && (
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>
                  Choose which categories appear as shortcuts in the left sidebar.
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}

          {!hiddenSidebarGroups.includes("taxonomies") && (
            <Card>
              <CardHeader>
                <CardTitle>Taxonomies</CardTitle>
                <CardDescription>
                  Choose which taxonomy browsers appear in the left sidebar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
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
          )}

          {!hiddenSidebarGroups.includes("customization") && (
            <Card>
              <CardHeader>
                <CardTitle>Customization</CardTitle>
                <CardDescription>
                  Choose which customization tools appear in the left sidebar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {CUSTOMIZATION_ITEMS.map(item => (
                    <div
                      key={item.key}
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        id={`show-customization-${item.key}`}
                        checked={!hiddenCustomizationItems.includes(item.key)}
                        onCheckedChange={() => toggleCustomizationItem(item.key)}
                      />
                      <Label htmlFor={`show-customization-${item.key}`}>{item.label}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!hiddenSidebarGroups.includes("management") && (
            <Card>
              <CardHeader>
                <CardTitle>Management</CardTitle>
                <CardDescription>
                  Choose which management pages appear in the left sidebar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {MANAGEMENT_ITEMS.map(item => (
                    <div
                      key={item.key}
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        id={`show-management-${item.key}`}
                        checked={!hiddenManagementItems.includes(item.key)}
                        onCheckedChange={() => toggleManagementItem(item.key)}
                      />
                      <Label htmlFor={`show-management-${item.key}`}>{item.label}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
