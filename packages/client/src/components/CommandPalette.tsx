import { useEffect, useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import {
  BookmarkIcon,
  FolderIcon,
  HomeIcon,
  InboxIcon,
  SettingsIcon,
  TagIcon,
} from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBookmarks } from "@/hooks/useBookmarks";

const PAGES = [
  {
    label: "Home",
    path: "/",
    icon: HomeIcon,
  },
  {
    label: "Bookmarks",
    path: "/bookmarks",
    icon: BookmarkIcon,
  },
  {
    label: "Inbox",
    path: "/inbox",
    icon: InboxIcon,
  },
] as const;

const TAXONOMIES = [
  {
    label: "Categories",
    path: "/categories",
  },
  {
    label: "Tags",
    path: "/tags",
  },
  {
    label: "Websites",
    path: "/taxonomies/websites",
  },
  {
    label: "Media Types",
    path: "/taxonomies/media-types",
  },
  {
    label: "YouTube Channels",
    path: "/taxonomies/youtube-channels",
  },
  {
    label: "Custom Properties",
    path: "/custom-properties",
  },
  {
    label: "Property Groups",
    path: "/taxonomies/property-groups",
  },
  {
    label: "Autofill Rules",
    path: "/autofill",
  },
  {
    label: "Import Rules",
    path: "/import-rules",
  },
  {
    label: "Newsletters",
    path: "/taxonomies/newsletters",
  },
  {
    label: "Authors",
    path: "/taxonomies/authors",
  },
  {
    label: "Relationship Types",
    path: "/taxonomies/relationship-types",
  },
  {
    label: "Card Display Rules",
    path: "/card-display-rules",
  },
] as const;

const SETTINGS = [
  {
    label: "Display",
    path: "/settings/display",
  },
  {
    label: "Homepage",
    path: "/settings/homepage",
  },
  {
    label: "Sidebar",
    path: "/settings/sidebar",
  },
  {
    label: "Media Types",
    path: "/settings/media-types",
  },
  {
    label: "Websites",
    path: "/settings/websites",
  },
  {
    label: "YouTube Channels",
    path: "/settings/youtube-channels",
  },
  {
    label: "Autofill",
    path: "/settings/autofill",
  },
  {
    label: "Automations",
    path: "/settings/automations",
  },
  {
    label: "Imports",
    path: "/settings/imports",
  },
  {
    label: "Relationships",
    path: "/settings/relationships",
  },
  {
    label: "Custom Properties",
    path: "/settings/custom-properties",
  },
  {
    label: "Card Display Rules",
    path: "/settings/card-display-rules",
  },
  {
    label: "Link Parsing",
    path: "/settings/link-parsing",
  },
  {
    label: "Media Management",
    path: "/settings/media-management",
  },
  {
    label: "Gallery",
    path: "/settings/gallery",
  },
  {
    label: "Advanced",
    path: "/settings/advanced",
  },
  {
    label: "Saved Filters",
    path: "/settings/saved-filters",
  },
  {
    label: "Extension",
    path: "/settings/extension",
  },
] as const;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const navigate = useNavigate();
  const {
    data: bookmarks = [],
  } = useBookmarks();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) setInputValue("");
  };

  const handleSelect = (path: string) => {
    handleOpenChange(false);
    void navigate({
      to: path,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command>
          <CommandInput
            placeholder="Search pages and bookmarks…"
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList className="max-h-[500px]">
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup heading="Pages">
              {PAGES.map(({
                label, path, icon: Icon,
              }) => (
                <CommandItem
                  key={path}
                  value={label}
                  onSelect={() => handleSelect(path)}
                >
                  <Icon />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Taxonomies">
              {TAXONOMIES.map(({
                label, path,
              }) => (
                <CommandItem
                  key={path}
                  value={label}
                  onSelect={() => handleSelect(path)}
                >
                  <TagIcon />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Settings">
              {SETTINGS.map(({
                label, path,
              }) => (
                <CommandItem
                  key={path}
                  value={`Settings ${label}`}
                  onSelect={() => handleSelect(path)}
                >
                  <SettingsIcon />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>

            {inputValue && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Bookmarks">
                  {bookmarks.map(bookmark => (
                    <CommandItem
                      key={bookmark.id}
                      value={`${bookmark.title} ${bookmark.url}`}
                      onSelect={() => handleSelect(`/bookmarks/${bookmark.id}`)}
                    >
                      <FolderIcon />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate">{bookmark.title}</span>
                        <span className="truncate text-xs text-muted-foreground">{bookmark.url}</span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
