import type { DrawerContentType } from "@/lib/drawerSearch";

import { useState } from "react";

import { Check, ChevronsUpDown } from "lucide-react";

import { getContentType } from "./contentTypes";
import { usePanelControls } from "./usePanelControls";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAutofillRules } from "@/hooks/useAutofill";
import { useCategories } from "@/hooks/useCategories";
import { useCustomProperties } from "@/hooks/useCustomProperties";
import { useMediaTypeTree } from "@/hooks/useMediaTypes";
import { usePropertyGroups } from "@/hooks/usePropertyGroups";
import { useTagTree } from "@/hooks/useTags";
import { useWebsites } from "@/hooks/useWebsites";
import { useYouTubeChannels } from "@/hooks/useYouTubeChannels";
import { NEW_SENTINEL } from "@/lib/drawerSearch";
import { flattenTree } from "@/lib/tagTree";
import { cn } from "@/lib/utils";

function usePanelItemLabel(dCT: DrawerContentType | null, dCId: string | null): string | null {
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: categories,
  } = useCategories();
  const {
    data: websites,
  } = useWebsites();
  const {
    data: mediaTypeTree,
  } = useMediaTypeTree();
  const {
    data: channels,
  } = useYouTubeChannels();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: groups,
  } = usePropertyGroups();
  const {
    data: rules,
  } = useAutofillRules();

  if (!dCId || dCId === NEW_SENTINEL || !dCT) return null;

  if (dCT === "tag") {
    return flattenTree(tagTree ?? []).find(({
      node,
    }) => node.id === dCId)?.node.name ?? null;
  }
  if (dCT === "category") {
    return categories?.find(c => c.id === dCId)?.name ?? null;
  }
  if (dCT === "website") {
    return websites?.find(w => w.id === dCId)?.siteName ?? null;
  }
  if (dCT === "media-type") {
    return flattenTree(mediaTypeTree ?? []).find(({
      node,
    }) => node.id === dCId)?.node.name ?? null;
  }
  if (dCT === "youtube-channel") {
    return channels?.find(c => c.id === dCId)?.name ?? null;
  }
  if (dCT === "property") {
    return properties?.find(p => p.id === dCId)?.name ?? null;
  }
  if (dCT === "property-group") {
    return groups?.find(g => g.id === dCId)?.name ?? null;
  }
  if (dCT === "autofill") {
    return rules?.find(r => r.id === dCId)?.name ?? null;
  }
  return null;
}

interface SwitcherItem {
  id: string;
  label: string;
}

function usePanelSwitcherItems(dCT: DrawerContentType): { items: SwitcherItem[];
  isLoading: boolean; } {
  const categories = useCategories();
  const tagTree = useTagTree();
  const websites = useWebsites();
  const mediaTypeTree = useMediaTypeTree();
  const channels = useYouTubeChannels();
  const properties = useCustomProperties();
  const groups = usePropertyGroups();
  const rules = useAutofillRules();

  switch (dCT) {
    case "category":
      return {
        items: (categories.data ?? []).map(c => ({
          id: c.id,
          label: c.name,
        })),
        isLoading: categories.isLoading,
      };
    case "tag":
      return {
        items: flattenTree(tagTree.data ?? []).map(({
          node, depth,
        }) => ({
          id: node.id,
          label: `${"— ".repeat(depth)}${node.name}`,
        })),
        isLoading: tagTree.isLoading,
      };
    case "website":
      return {
        items: (websites.data ?? []).map(w => ({
          id: w.id,
          label: w.siteName,
        })),
        isLoading: websites.isLoading,
      };
    case "media-type":
      return {
        items: flattenTree(mediaTypeTree.data ?? []).map(({
          node,
        }) => ({
          id: node.id,
          label: node.name,
        })),
        isLoading: mediaTypeTree.isLoading,
      };
    case "youtube-channel":
      return {
        items: (channels.data ?? []).map(c => ({
          id: c.id,
          label: c.name,
        })),
        isLoading: channels.isLoading,
      };
    case "property":
      return {
        items: (properties.data ?? []).map(p => ({
          id: p.id,
          label: p.name,
        })),
        isLoading: properties.isLoading,
      };
    case "property-group":
      return {
        items: (groups.data ?? []).map(g => ({
          id: g.id,
          label: g.name,
        })),
        isLoading: groups.isLoading,
      };
    case "autofill":
      return {
        items: (rules.data ?? []).map(r => ({
          id: r.id,
          label: r.name,
        })),
        isLoading: rules.isLoading,
      };
    default:
      return {
        items: [],
        isLoading: false,
      };
  }
}

function PanelBreadcrumbSwitcher({
  dCT, dCId,
}: { dCT: DrawerContentType;
  dCId: string; }) {
  const [open, setOpen] = useState(false);
  const {
    openItem, dMode,
  } = usePanelControls();
  const {
    items, isLoading,
  } = usePanelSwitcherItems(dCT);

  if (!isLoading && items.length <= 1) return null;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Switch to a related item"
          className={cn(`
            ml-0.5 inline-flex items-center rounded-sm p-0.5
            text-muted-foreground opacity-0 transition-opacity
            group-hover/crumb:opacity-100
            hover:text-foreground
            focus-visible:opacity-100
            data-[state=open]:opacity-100
          `)}
        >
          <ChevronsUpDown className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search…" />
          <CommandList>
            <CommandEmpty>{isLoading ? "Loading…" : "No matches."}</CommandEmpty>
            <CommandGroup>
              {items.map(item => (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${item.id}`}
                  onSelect={() => {
                    setOpen(false);
                    openItem(dCT, item.id, dMode ?? "view");
                  }}
                >
                  <span className="truncate">{item.label}</span>
                  <Check
                    className={cn(
                      "ml-auto",
                      item.id === dCId ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Breadcrumb navigation bar shown below the chrome when a content type is selected. */
export function PanelBreadcrumbs() {
  const {
    dCT, dCId, open, openType,
  } = usePanelControls();

  const specificName = usePanelItemLabel(dCT ?? null, dCId ?? null);

  if (!dCT) return null;

  // Notifications and Filters have no registry entry; render a simple two-level trail.
  if (dCT === "notifications" || dCT === "filters") {
    const label = dCT === "notifications" ? "Notifications" : "Filters";
    return (
      <div className="flex items-center gap-1 px-4 pb-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer"
                onClick={open}
              >
                Browse
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{label}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    );
  }

  const def = getContentType(dCT);

  const itemLabel = dCId
    ? (dCId === NEW_SENTINEL ? `New ${def.singular}` : (specificName ?? def.singular))
    : null;

  const showSwitcher = Boolean(dCId && dCId !== NEW_SENTINEL);

  return (
    <div className="flex items-center gap-1 px-4 pb-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="cursor-pointer"
              onClick={open}
            >
              Browse
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {itemLabel
              ? (
                <BreadcrumbLink
                  className="cursor-pointer"
                  onClick={() => openType(dCT)}
                >
                  {def.label}
                </BreadcrumbLink>
              )
              : <BreadcrumbPage>{def.label}</BreadcrumbPage>}
          </BreadcrumbItem>
          {itemLabel
            ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem className={showSwitcher ? "group/crumb" : undefined}>
                  <BreadcrumbPage>{itemLabel}</BreadcrumbPage>
                  {showSwitcher && dCId && (
                    <PanelBreadcrumbSwitcher
                      dCT={dCT}
                      dCId={dCId}
                    />
                  )}
                </BreadcrumbItem>
              </>
            )
            : null}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
