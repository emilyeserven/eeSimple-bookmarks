import type { BookmarkDetailImageSize, BookmarkDetailVideoSize, Theme } from "../stores/uiStore";
import type { PinnedSidebarEntityType, PinnedSidebarItem } from "@eesimple/types";

import { useState } from "react";

import { Filter, Globe, MonitorPlay, Tags, Trash2, X } from "lucide-react";

import { Combobox } from "./Combobox";
import { ListingDisplayControls } from "./ListingDisplayControls";
import { useCategories } from "../hooks/useCategories";
import { useCreateCustomAspectRatio, useCustomAspectRatios, useDeleteCustomAspectRatio } from "../hooks/useCustomAspectRatios";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { useAddPinnedSidebarItem, usePinnedSidebarItems, useRemovePinnedSidebarItem } from "../hooks/usePinnedSidebarItems";
import { useSavedFilters } from "../hooks/useSavedFilters";
import { useTags } from "../hooks/useTags";
import { useWebsites } from "../hooks/useWebsites";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";
import { useUiStore } from "../stores/uiStore";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  RowCard,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

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

function PinnedItemsCard() {
  const {
    data: pins = [],
  } = usePinnedSidebarItems();
  const addPin = useAddPinnedSidebarItem();
  const removePin = useRemovePinnedSidebarItem();
  const [comboValue, setComboValue] = useState<string | undefined>();

  const {
    data: categories = [],
  } = useCategories();
  const {
    data: allTags = [],
  } = useTags();
  const {
    data: allWebsites = [],
  } = useWebsites();
  const {
    data: allMediaTypes = [],
  } = useMediaTypes();
  const {
    data: allChannels = [],
  } = useYouTubeChannels();
  const {
    data: savedFilters = [],
  } = useSavedFilters();

  const pinnedKeys = new Set(pins.map((p: PinnedSidebarItem) => `${p.entityType}:${p.entityId}`));

  const options = [
    ...categories
      .filter(c => !pinnedKeys.has(`category:${c.id}`))
      .map(c => ({
        value: `category:${c.id}`,
        label: c.name,
        icon: (
          <CategoryIcon
            name={c.icon}
            className="size-4 shrink-0"
          />
        ),
      })),
    ...allTags
      .filter(t => !pinnedKeys.has(`tag:${t.id}`))
      .map(t => ({
        value: `tag:${t.id}`,
        label: t.name,
        icon: <Tags className="size-4 shrink-0" />,
      })),
    ...allWebsites
      .filter(w => !pinnedKeys.has(`website:${w.id}`))
      .map(w => ({
        value: `website:${w.id}`,
        label: w.siteName,
        icon: <Globe className="size-4 shrink-0" />,
      })),
    ...allMediaTypes
      .filter(m => !pinnedKeys.has(`media-type:${m.id}`))
      .map(m => ({
        value: `media-type:${m.id}`,
        label: m.name,
        icon: (
          <CategoryIcon
            name={m.icon}
            className="size-4 shrink-0"
          />
        ),
      })),
    ...allChannels
      .filter(c => !pinnedKeys.has(`youtube-channel:${c.id}`))
      .map(c => ({
        value: `youtube-channel:${c.id}`,
        label: c.name,
        icon: <MonitorPlay className="size-4 shrink-0" />,
      })),
    ...savedFilters
      .filter(f => !pinnedKeys.has(`saved-filter:${f.id}`))
      .map(f => ({
        value: `saved-filter:${f.id}`,
        label: f.name,
        icon: <Filter className="size-4 shrink-0" />,
      })),
  ];

  function handleSelect(value: string | undefined) {
    if (!value) return;
    const colonIdx = value.indexOf(":");
    const entityType = value.slice(0, colonIdx) as PinnedSidebarEntityType;
    const entityId = value.slice(colonIdx + 1);
    addPin.mutate({ entityType, entityId });
    setComboValue(undefined);
  }

  function resolvePinLabel(pin: PinnedSidebarItem): string | null {
    if (pin.entityType === "category") return categories.find(c => c.id === pin.entityId)?.name ?? null;
    if (pin.entityType === "tag") return allTags.find(t => t.id === pin.entityId)?.name ?? null;
    if (pin.entityType === "website") return allWebsites.find(w => w.id === pin.entityId)?.siteName ?? null;
    if (pin.entityType === "media-type") return allMediaTypes.find(m => m.id === pin.entityId)?.name ?? null;
    if (pin.entityType === "youtube-channel") return allChannels.find(c => c.id === pin.entityId)?.name ?? null;
    if (pin.entityType === "saved-filter") return savedFilters.find(f => f.id === pin.entityId)?.name ?? null;
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pinned Items</CardTitle>
        <CardDescription>
          Quick-access links pinned below the Bookmarks link in the sidebar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Combobox
          options={options}
          value={comboValue}
          onValueChange={handleSelect}
          placeholder="Pin a category, tag, website…"
          searchPlaceholder="Search…"
          emptyText="Nothing left to pin."
        />
        {pins.length > 0
          ? (
            <div className="space-y-1">
              {pins.map((pin: PinnedSidebarItem) => {
                const label = resolvePinLabel(pin);
                return (
                  <div
                    key={pin.id}
                    className="flex items-center gap-2 py-0.5"
                  >
                    <span className={cn("flex-1 truncate text-sm", !label && "text-muted-foreground italic")}>
                      {label ?? "(deleted)"}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0"
                      onClick={() => removePin.mutate(pin.id)}
                    >
                      <X className="size-3.5" />
                      <span className="sr-only">Unpin {label ?? "item"}</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          )
          : <p className="text-sm text-muted-foreground">No pinned items yet.</p>}
      </CardContent>
    </Card>
  );
}



function ImageAspectRatiosCard() {
  const croppedWidth = useUiStore(state => state.croppedWidth);
  const croppedHeight = useUiStore(state => state.croppedHeight);
  const setCroppedWidth = useUiStore(state => state.setCroppedWidth);
  const setCroppedHeight = useUiStore(state => state.setCroppedHeight);
  const {
    data: customRatios = [], isLoading, error,
  } = useCustomAspectRatios();
  const deleteMutation = useDeleteCustomAspectRatio();
  const createMutation = useCreateCustomAspectRatio();

  const [newName, setNewName] = useState("");
  const [newWidth, setNewWidth] = useState("");
  const [newHeight, setNewHeight] = useState("");

  function handleAdd() {
    const w = parseInt(newWidth, 10);
    const h = parseInt(newHeight, 10);
    if (!newName.trim() || !w || !h) return;
    createMutation.mutate(
      {
        name: newName.trim(),
        width: w,
        height: h,
      },
      {
        onSuccess: () => {
          setNewName("");
          setNewWidth("");
          setNewHeight("");
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Image aspect ratios</CardTitle>
        <CardDescription>
          Configure the built-in &ldquo;Cropped&rdquo; ratio and add custom named ratios to the
          aspect picker.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium">Cropped ratio</p>
          <p className="text-xs text-muted-foreground">
            The ratio used when the &ldquo;Cropped&rdquo; mode is selected.
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              value={croppedWidth}
              onChange={e => setCroppedWidth(Number(e.target.value) || 1)}
              className="w-20"
              aria-label="Cropped width"
            />
            <span className="text-muted-foreground">:</span>
            <Input
              type="number"
              min={1}
              value={croppedHeight}
              onChange={e => setCroppedHeight(Number(e.target.value) || 1)}
              className="w-20"
              aria-label="Cropped height"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium">Custom ratios</p>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
          {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
          {!isLoading && customRatios.length > 0
            ? (
              <div className="space-y-2">
                {customRatios.map(ratio => (
                  <RowCard
                    key={ratio.id}
                    className="flex items-center justify-between gap-4 p-3"
                  >
                    <span className="text-sm">
                      {ratio.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({ratio.width}:{ratio.height})
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="
                        size-7 shrink-0 text-muted-foreground
                        hover:text-destructive
                      "
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(ratio.id)}
                    >
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">Delete {ratio.name}</span>
                    </Button>
                  </RowCard>
                ))}
              </div>
            )
            : null}
          {!isLoading && customRatios.length === 0
            ? <p className="text-sm text-muted-foreground">No custom ratios yet.</p>
            : null}

          <div className="flex flex-wrap items-end gap-2 pt-1">
            <div className="space-y-1">
              <Label
                htmlFor="new-ratio-name"
                className="text-xs"
              >
                Name
              </Label>
              <Input
                id="new-ratio-name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Widescreen"
                className="w-36"
              />
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="new-ratio-width"
                className="text-xs"
              >
                Width
              </Label>
              <Input
                id="new-ratio-width"
                type="number"
                min={1}
                value={newWidth}
                onChange={e => setNewWidth(e.target.value)}
                className="w-20"
              />
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="new-ratio-height"
                className="text-xs"
              >
                Height
              </Label>
              <Input
                id="new-ratio-height"
                type="number"
                min={1}
                value={newHeight}
                onChange={e => setNewHeight(e.target.value)}
                className="w-20"
              />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!newName.trim() || !newWidth || !newHeight || createMutation.isPending}
              onClick={handleAdd}
            >
              {createMutation.isPending ? "Adding…" : "Add ratio"}
            </Button>
          </div>
          {createMutation.isError
            ? <p className="text-sm text-destructive">{createMutation.error?.message}</p>
            : null}
        </div>
      </CardContent>
    </Card>
  );
}

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
