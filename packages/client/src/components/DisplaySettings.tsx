import type { BookmarkDetailImageSize, BookmarkDetailVideoSize, Theme } from "../stores/uiStore";

import { ImageAspectRatiosCard } from "./ImageAspectRatiosCard";
import { ListingDisplayControls } from "./ListingDisplayControls";
import { PinnedItemsCard } from "./PinnedItemsCard";
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
import { Separator } from "@/components/ui/separator";
import { CategoryIcon } from "@/lib/icons";

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

const LISTING_DEFAULTS = [
  {
    label: "Bookmarks",
    pageKey: "bookmarks",
    showsImages: true,
  },
  {
    label: "Categories",
    pageKey: "categories-listing",
    showsImages: false,
  },
  {
    label: "Websites",
    pageKey: "websites-listing",
    showsImages: false,
  },
  {
    label: "Media Types",
    pageKey: "media-types-listing",
    showsImages: false,
  },
  {
    label: "YouTube Channels",
    pageKey: "youtube-channels-listing",
    showsImages: false,
  },
  {
    label: "Custom Properties",
    pageKey: "custom-properties-listing",
    showsImages: false,
  },
  {
    label: "Property Groups",
    pageKey: "property-groups-listing",
    showsImages: false,
  },
  {
    label: "Autofill Rules",
    pageKey: "autofill-rules-listing",
    showsImages: false,
  },
] as const;

/** Display preferences — a theme switcher (light / dark / system) and sidebar section toggles. */
export function DisplaySettings() {
  const theme = useUiStore(state => state.theme);
  const setTheme = useUiStore(state => state.setTheme);
  const filtersInDrawer = useUiStore(state => state.filtersInDrawer);
  const setFiltersInDrawer = useUiStore(state => state.setFiltersInDrawer);
  const bookmarkDetailImageSize = useUiStore(state => state.bookmarkDetailImageSize);
  const setBookmarkDetailImageSize = useUiStore(state => state.setBookmarkDetailImageSize);
  const bookmarkDetailVideoSize = useUiStore(state => state.bookmarkDetailVideoSize);
  const setBookmarkDetailVideoSize = useUiStore(state => state.setBookmarkDetailVideoSize);
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
          <CardTitle>Listing Defaults</CardTitle>
          <CardDescription>
            Default view and column count for each type of listing page. How individual bookmark
            cards display (fields, images) is set in Card Display Rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {LISTING_DEFAULTS.map((listing, index) => (
            <div key={listing.pageKey}>
              {index > 0 && <Separator className="my-4" />}
              <div
                className="
                  grid grid-cols-1 gap-4
                  sm:grid-cols-[1fr_auto] sm:items-start
                "
              >
                <div>
                  <p className="font-medium">{listing.label}</p>
                </div>
                <div className="sm:min-w-52">
                  <ListingDisplayControls pageKey={listing.pageKey} />
                </div>
              </div>
            </div>
          ))}
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
          <CardTitle>Filters location</CardTitle>
          <CardDescription>
            When on, listing pages open filters in the right-hand drawer by default instead of
            showing them in the left column.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Checkbox
              id="filters-in-drawer"
              checked={filtersInDrawer}
              onCheckedChange={checked => setFiltersInDrawer(checked === true)}
            />
            <Label htmlFor="filters-in-drawer">Show filters in drawer by default</Label>
          </div>
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
