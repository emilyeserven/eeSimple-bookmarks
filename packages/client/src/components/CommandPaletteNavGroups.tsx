import type { CreateKind } from "./commandPaletteModals";
import type { Bookmark } from "@eesimple/types";

import { FolderIcon, PlusIcon, SettingsIcon } from "lucide-react";

import { CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";
import { SETTINGS_TAB_SECTIONS } from "@/lib/settingsNav";
import {
  ACTION_LISTING_PAGES,
  CUSTOMIZATION_LISTING_PAGES,
  SETTINGS_PAGES,
  TAXONOMY_LISTING_PAGES,
} from "@/lib/settingsPages";
import { navItems } from "@/lib/sidebarNavItems";

// The nav groups derive from the sidebar / settings nav data (via lib/settingsPages.ts), so a new
// sidebar entry or settings tab shows up here automatically — don't hand-list paths.
const PAGES = [
  ...navItems.map(item => ({
    label: item.title,
    path: item.to as string,
    icon: item.icon,
  })),
  ...ACTION_LISTING_PAGES.map(page => ({
    label: page.label,
    path: page.path,
    icon: page.icon,
  })),
];

const TAXONOMIES = [...TAXONOMY_LISTING_PAGES, ...CUSTOMIZATION_LISTING_PAGES];

const SETTINGS = [
  ...SETTINGS_TAB_SECTIONS.map(section => ({
    label: section.section,
    path: section.path as string,
    icon: SettingsIcon,
  })),
  ...SETTINGS_PAGES.filter(page => page.path.startsWith("/settings/")),
];

/** The entity kinds offered as "New X" quick-create actions, in display order. */
const CREATE_ITEMS: { kind: CreateKind;
  label: string; }[] = [
  {
    kind: "category",
    label: "New Category",
  },
  {
    kind: "tag",
    label: "New Tag",
  },
  {
    kind: "media-type",
    label: "New Media Type",
  },
  {
    kind: "person",
    label: "New Person",
  },
  {
    kind: "website",
    label: "New Website",
  },
  {
    kind: "property-group",
    label: "New Property Group",
  },
  {
    kind: "youtube-channel",
    label: "New YouTube Channel",
  },
  {
    kind: "newsletter",
    label: "New Newsletter",
  },
  {
    kind: "location",
    label: "New Location",
  },
  {
    kind: "custom-property",
    label: "New Custom Property",
  },
];

/**
 * The palette's always-available tail: the Actions (add/create), Pages, Taxonomies, and Settings
 * navigation groups, plus the bookmark search results once a query is typed.
 */
export function CommandPaletteNavGroups({
  inputValue,
  bookmarks,
  onSelect,
  onAddBookmark,
  onCreate,
}: {
  inputValue: string;
  bookmarks: Pick<Bookmark, "id" | "title" | "url">[];
  onSelect: (path: string) => void;
  onAddBookmark: () => void;
  onCreate: (kind: CreateKind) => void;
}) {
  return (
    <>
      <CommandGroup heading="Actions">
        <CommandItem
          value="Add Bookmark"
          onSelect={onAddBookmark}
        >
          <PlusIcon />
          Add Bookmark
        </CommandItem>
        {CREATE_ITEMS.map(item => (
          <CommandItem
            key={item.kind}
            value={item.label}
            onSelect={() => onCreate(item.kind)}
          >
            <PlusIcon />
            {item.label}
          </CommandItem>
        ))}
      </CommandGroup>

      <CommandSeparator />

      <CommandGroup heading="Pages">
        {PAGES.map(({
          label, path, icon: Icon,
        }) => (
          <CommandItem
            key={path}
            value={label}
            onSelect={() => onSelect(path)}
          >
            <Icon />
            {label}
          </CommandItem>
        ))}
      </CommandGroup>

      <CommandSeparator />

      <CommandGroup heading="Taxonomies">
        {TAXONOMIES.map(({
          label, path, icon: Icon,
        }) => (
          <CommandItem
            key={path}
            value={label}
            onSelect={() => onSelect(path)}
          >
            <Icon />
            {label}
          </CommandItem>
        ))}
      </CommandGroup>

      <CommandSeparator />

      <CommandGroup heading="Settings">
        {SETTINGS.map(({
          label, path, icon: Icon,
        }) => (
          <CommandItem
            key={path}
            value={`Settings ${label}`}
            onSelect={() => onSelect(path)}
          >
            <Icon />
            {label}
          </CommandItem>
        ))}
      </CommandGroup>

      {inputValue && (
        <>
          <CommandSeparator />
          <CommandGroup heading="Bookmarks">
            {bookmarks.map(b => (
              <CommandItem
                key={b.id}
                value={`${b.title} ${b.url}`}
                onSelect={() => onSelect(`/bookmarks/${b.id}`)}
              >
                <FolderIcon />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate">{b.title}</span>
                  <span
                    className="truncate text-xs text-muted-foreground"
                  >{b.url}
                  </span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </>
      )}
    </>
  );
}
