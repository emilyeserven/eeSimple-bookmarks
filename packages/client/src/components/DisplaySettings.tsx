import type { Theme } from "../stores/uiStore";
import type {
  BookmarkDetailImageSize,
  BookmarkDetailVideoSize,
  DisplayPreferenceSettings,
  SidebarCustomizationSettings,
} from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { ImageAspectRatiosCard } from "./ImageAspectRatiosCard";
import { PinnedItemsCard } from "./PinnedItemsCard";
import { SidebarItemsCard } from "./SidebarItemsCard";
import {
  useDisplayPreferenceSettings,
  useSidebarVisibility,
  useUpdateDisplayPreferenceSettings,
  useUpdateSidebarCustomizationSettings,
} from "../hooks/useAppSettings";
import { useCategories } from "../hooks/useCategories";
import { notifyError, notifySuccess } from "../lib/notifications";
import { useUiStore } from "../stores/uiStore";

import { buttonVariants } from "@/components/ui/button";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CategoryIcon } from "@/lib/icons";

type CategoryDisplayMode = "visible" | "see-more" | "hidden";

const THEME_LABELS: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const IMAGE_SIZE_LABELS: Record<BookmarkDetailImageSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

const VIDEO_SIZE_LABELS: Record<BookmarkDetailVideoSize, string> = {
  standard: "Standard",
  half: "Half",
  twoThirds: "2/3",
  fullwidth: "Full width",
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
  {
    key: "authors",
    label: "Authors",
  },
  {
    key: "publishers",
    label: "Publishers",
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
    key: "relationship-types",
    label: "Relationship Types",
  },
  {
    key: "autofill",
    label: "Autofill Rules",
  },
  {
    key: "card-display-rules",
    label: "Card Display Rules",
  },
  {
    key: "import-rules",
    label: "Import Rules",
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
};

/** Display preferences — a theme switcher (light / dark / system) and sidebar section toggles. */
export function DisplaySettings() {
  // Theme stays a device-local pref (often dark-on-phone / light-on-desktop), so it remains in uiStore.
  const theme = useUiStore(state => state.theme);
  const setTheme = useUiStore(state => state.setTheme);

  const sidebar = useSidebarVisibility();
  const updateSidebar = useUpdateSidebarCustomizationSettings();
  const {
    data: displayData,
  } = useDisplayPreferenceSettings();
  const updateDisplay = useUpdateDisplayPreferenceSettings();
  const display = displayData ?? DISPLAY_DEFAULTS;

  const {
    hiddenCategoryIds,
    seeMoreCategoryIds,
    hiddenTaxonomyItems,
    seeMoreTaxonomyItems,
    hiddenCustomizationItems,
    seeMoreCustomizationItems,
    hiddenManagementItems,
    hiddenSidebarGroups,
  } = sidebar;
  const bookmarkDetailImageSize = display.bookmarkDetailImageSize;
  const bookmarkDetailVideoSize = display.bookmarkDetailVideoSize;

  /** Toggle a value in one of the sidebar hidden-lists, persist the whole group, and toast. */
  function toggleSidebarKey(key: keyof SidebarCustomizationSettings, value: string): void {
    const current = sidebar[key];
    const next = current.includes(value)
      ? current.filter(x => x !== value)
      : [...current, value];
    updateSidebar.mutate({
      ...sidebar,
      [key]: next,
    }, {
      onSuccess: () => notifySuccess("Sidebar updated"),
      onError: error => notifyError(error.message),
    });
  }

  function setCategoryMode(id: string, mode: CategoryDisplayMode): void {
    updateSidebar.mutate({
      ...sidebar,
      hiddenCategoryIds: mode === "hidden"
        ? [...hiddenCategoryIds.filter(x => x !== id), id]
        : hiddenCategoryIds.filter(x => x !== id),
      seeMoreCategoryIds: mode === "see-more"
        ? [...seeMoreCategoryIds.filter(x => x !== id), id]
        : seeMoreCategoryIds.filter(x => x !== id),
    }, {
      onSuccess: () => notifySuccess("Sidebar updated"),
      onError: error => notifyError(error.message),
    });
  }

  function setTaxonomyItemMode(key: string, mode: CategoryDisplayMode): void {
    updateSidebar.mutate({
      ...sidebar,
      hiddenTaxonomyItems: mode === "hidden"
        ? [...hiddenTaxonomyItems.filter(x => x !== key), key]
        : hiddenTaxonomyItems.filter(x => x !== key),
      seeMoreTaxonomyItems: mode === "see-more"
        ? [...seeMoreTaxonomyItems.filter(x => x !== key), key]
        : seeMoreTaxonomyItems.filter(x => x !== key),
    }, {
      onSuccess: () => notifySuccess("Sidebar updated"),
      onError: error => notifyError(error.message),
    });
  }

  function setCustomizationItemMode(key: string, mode: CategoryDisplayMode): void {
    updateSidebar.mutate({
      ...sidebar,
      hiddenCustomizationItems: mode === "hidden"
        ? [...hiddenCustomizationItems.filter(x => x !== key), key]
        : hiddenCustomizationItems.filter(x => x !== key),
      seeMoreCustomizationItems: mode === "see-more"
        ? [...seeMoreCustomizationItems.filter(x => x !== key), key]
        : seeMoreCustomizationItems.filter(x => x !== key),
    }, {
      onSuccess: () => notifySuccess("Sidebar updated"),
      onError: error => notifyError(error.message),
    });
  }

  function setManagementItemMode(key: string, mode: "visible" | "hidden"): void {
    updateSidebar.mutate({
      ...sidebar,
      hiddenManagementItems: mode === "hidden"
        ? [...hiddenManagementItems.filter(x => x !== key), key]
        : hiddenManagementItems.filter(x => x !== key),
    }, {
      onSuccess: () => notifySuccess("Sidebar updated"),
      onError: error => notifyError(error.message),
    });
  }

  const toggleSidebarGroup = (group: string) => toggleSidebarKey("hiddenSidebarGroups", group);

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

  const setBookmarkDetailImageSize = (size: BookmarkDetailImageSize) =>
    saveDisplay({
      bookmarkDetailImageSize: size,
    }, "Detail image size updated");
  const setBookmarkDetailVideoSize = (size: BookmarkDetailVideoSize) =>
    saveDisplay({
      bookmarkDetailVideoSize: size,
    }, "Detail video size updated");

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
          <CardTitle>Bookmark media</CardTitle>
          <CardDescription>
            Control the size of images and video embeds on the bookmark detail page.
          </CardDescription>
        </CardHeader>
        <CardContent
          className="
            grid grid-cols-1 gap-4
            sm:grid-cols-2
          "
        >
          <div className="space-y-1">
            <Label htmlFor="bookmark-image-size">Image size</Label>
            <Select
              value={bookmarkDetailImageSize}
              onValueChange={value => setBookmarkDetailImageSize(value as BookmarkDetailImageSize)}
            >
              <SelectTrigger
                id="bookmark-image-size"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(IMAGE_SIZE_LABELS) as BookmarkDetailImageSize[]).map(value => (
                  <SelectItem
                    key={value}
                    value={value}
                  >
                    {IMAGE_SIZE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="bookmark-video-size">Video size</Label>
            <Select
              value={bookmarkDetailVideoSize}
              onValueChange={value => setBookmarkDetailVideoSize(value as BookmarkDetailVideoSize)}
            >
              <SelectTrigger
                id="bookmark-video-size"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(VIDEO_SIZE_LABELS) as BookmarkDetailVideoSize[]).map(value => (
                  <SelectItem
                    key={value}
                    value={value}
                  >
                    {VIDEO_SIZE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <ImageAspectRatiosCard />

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
          <PinnedItemsCard />

          {!hiddenSidebarGroups.includes("categories") && (
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>
                  Choose how each category appears in the left sidebar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categories && categories.length > 0
                  ? (
                    <div className="space-y-2">
                      {categories.map((category) => {
                        const mode: CategoryDisplayMode = hiddenCategoryIds.includes(category.id)
                          ? "hidden"
                          : seeMoreCategoryIds.includes(category.id)
                            ? "see-more"
                            : "visible";
                        return (
                          <div
                            key={category.id}
                            className="flex items-center justify-between gap-2"
                          >
                            <span
                              className="
                                flex items-center gap-1.5 truncate text-sm
                              "
                            >
                              <CategoryIcon name={category.icon} />
                              {category.name}
                            </span>
                            <ToggleGroup
                              type="single"
                              size="sm"
                              value={mode}
                              onValueChange={value => value && setCategoryMode(category.id, value as CategoryDisplayMode)}
                            >
                              <ToggleGroupItem value="visible">Default</ToggleGroupItem>
                              <ToggleGroupItem value="see-more">See More</ToggleGroupItem>
                              <ToggleGroupItem value="hidden">Listing only</ToggleGroupItem>
                            </ToggleGroup>
                          </div>
                        );
                      })}
                    </div>
                  )
                  : (
                    <p className="text-sm text-muted-foreground">No categories yet.</p>
                  )}
              </CardContent>
            </Card>
          )}

          {!hiddenSidebarGroups.includes("taxonomies") && (
            <SidebarItemsCard
              title="Taxonomies"
              description="Choose how each taxonomy browser appears in the left sidebar."
              items={TAXONOMY_ITEMS}
              hiddenItems={hiddenTaxonomyItems}
              seeMoreItems={seeMoreTaxonomyItems}
              onSetMode={setTaxonomyItemMode}
            />
          )}

          {!hiddenSidebarGroups.includes("customization") && (
            <SidebarItemsCard
              title="Customization"
              description="Choose how each customization tool appears in the left sidebar."
              items={CUSTOMIZATION_ITEMS}
              hiddenItems={hiddenCustomizationItems}
              seeMoreItems={seeMoreCustomizationItems}
              onSetMode={setCustomizationItemMode}
            />
          )}

          {!hiddenSidebarGroups.includes("management") && (
            <SidebarItemsCard
              title="Management"
              description="Choose which management pages appear in the left sidebar."
              items={MANAGEMENT_ITEMS}
              hiddenItems={hiddenManagementItems}
              onSetMode={(key, mode) => setManagementItemMode(key, mode === "hidden" ? "hidden" : "visible")}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Advanced Sidebar Links</CardTitle>
              <CardDescription>
                Configure opt-in links to Coolify, the API docs, and Storybook shown in the
                sidebar&rsquo;s Advanced section.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                to="/settings/advanced"
                className={buttonVariants({
                  variant: "outline",
                })}
              >
                Go to Advanced Settings
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
