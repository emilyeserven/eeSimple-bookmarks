import { useEffect, useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  BookmarkIcon,
  CheckIcon,
  FolderIcon,
  HomeIcon,
  InboxIcon,
  PlusIcon,
  SettingsIcon,
  TagIcon,
} from "lucide-react";

import { AddBookmarkModal } from "./AddBookmarkModal";
import { useBookmarkTaxonomyContext } from "./useBookmarkTaxonomyContext";

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

type TaxonomyMode = "category" | "media-type" | "tags" | "authors";

/** Open/input state for the palette plus the global ⌘K / Ctrl+K toggle. */
function useCommandPaletteShell() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

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

  return {
    open,
    setOpen,
    inputValue,
    setInputValue,
  };
}

/** The "add a bookmark" modal draft (open flag + the URL prefilled from the query). */
function useAddBookmarkDraft() {
  const [addBookmarkOpen, setAddBookmarkOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState("");
  return {
    addBookmarkOpen,
    setAddBookmarkOpen,
    pendingUrl,
    setPendingUrl,
  };
}

export function CommandPalette() {
  const {
    open, setOpen, inputValue, setInputValue,
  } = useCommandPaletteShell();
  const {
    addBookmarkOpen, setAddBookmarkOpen, pendingUrl, setPendingUrl,
  } = useAddBookmarkDraft();
  const [taxonomyMode, setTaxonomyMode] = useState<TaxonomyMode | null>(null);
  const [pendingTagIds, setPendingTagIds] = useState<string[]>([]);
  const [pendingAuthorIds, setPendingAuthorIds] = useState<string[]>([]);
  const navigate = useNavigate();
  const {
    data: bookmarks = [],
  } = useBookmarks();

  const {
    bookmarkId,
    bookmark,
    categories,
    flatMediaTypes,
    flatTags,
    authors,
    updateBookmark,
  } = useBookmarkTaxonomyContext();

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setInputValue("");
      setTaxonomyMode(null);
    }
  };

  const handleSelect = (path: string) => {
    handleOpenChange(false);
    void navigate({
      to: path,
    });
  };

  const handleAddBookmark = (url = "") => {
    handleOpenChange(false);
    setPendingUrl(url);
    setAddBookmarkOpen(true);
  };

  function enterTaxonomyMode(mode: TaxonomyMode) {
    setTaxonomyMode(mode);
    if (mode === "tags" && bookmark) setPendingTagIds(bookmark.tags.map(t => t.id));
    if (mode === "authors" && bookmark) setPendingAuthorIds(bookmark.authors.map(a => a.id));
    setInputValue("");
  }

  function exitTaxonomyMode() {
    setTaxonomyMode(null);
    setInputValue("");
  }

  const looksLikeUrl
    = inputValue.startsWith("http://")
      || inputValue.startsWith("https://")
      || inputValue.startsWith("www.");

  const currentCategoryName = bookmark
    ? (categories.find(c => c.id === bookmark.categoryId)?.name ?? "Default")
    : null;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
      >
        <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">Command palette</DialogTitle>
          <Command>
            <CommandInput
              placeholder={taxonomyMode
                ? `Search ${taxonomyMode === "media-type" ? "media types" : taxonomyMode}…`
                : "Search pages and bookmarks…"}
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList className="max-h-[500px]">
              <CommandEmpty>No results found.</CommandEmpty>

              {/* Sub-palette: category selection */}
              {taxonomyMode === "category" && bookmarkId && (
                <>
                  <CommandGroup heading="Category">
                    <CommandItem
                      value="back"
                      onSelect={exitTaxonomyMode}
                    >
                      <ArrowLeftIcon />
                      Back
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Select category">
                    {categories.map(category => (
                      <CommandItem
                        key={category.id}
                        value={category.name}
                        onSelect={() => {
                          updateBookmark.mutate({
                            id: bookmarkId,
                            input: {
                              categoryId: category.id,
                            },
                          });
                          handleOpenChange(false);
                        }}
                      >
                        {bookmark?.categoryId === category.id && (
                          <CheckIcon className="text-primary" />
                        )}
                        {category.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Sub-palette: media type selection */}
              {taxonomyMode === "media-type" && bookmarkId && (
                <>
                  <CommandGroup heading="Media Type">
                    <CommandItem
                      value="back"
                      onSelect={exitTaxonomyMode}
                    >
                      <ArrowLeftIcon />
                      Back
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Select media type">
                    <CommandItem
                      value="None"
                      onSelect={() => {
                        updateBookmark.mutate({
                          id: bookmarkId,
                          input: {
                            mediaTypeId: null,
                          },
                        });
                        handleOpenChange(false);
                      }}
                    >
                      {bookmark?.mediaType === null && (
                        <CheckIcon className="text-primary" />
                      )}
                      None
                    </CommandItem>
                    {flatMediaTypes.map(mt => (
                      <CommandItem
                        key={mt.id}
                        value={mt.name}
                        onSelect={() => {
                          updateBookmark.mutate({
                            id: bookmarkId,
                            input: {
                              mediaTypeId: mt.id,
                            },
                          });
                          handleOpenChange(false);
                        }}
                      >
                        {bookmark?.mediaType?.id === mt.id && (
                          <CheckIcon className="text-primary" />
                        )}
                        {mt.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Sub-palette: tag multi-select */}
              {taxonomyMode === "tags" && bookmarkId && (
                <>
                  <CommandGroup heading="Tags">
                    <CommandItem
                      value="back"
                      onSelect={exitTaxonomyMode}
                    >
                      <ArrowLeftIcon />
                      Back
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Toggle tags">
                    {flatTags.map((tag) => {
                      const selected = pendingTagIds.includes(tag.id);
                      return (
                        <CommandItem
                          key={tag.id}
                          value={tag.name}
                          onSelect={() => {
                            setPendingTagIds(prev =>
                              selected
                                ? prev.filter(id => id !== tag.id)
                                : [...prev, tag.id]);
                          }}
                        >
                          {selected && <CheckIcon className="text-primary" />}
                          {tag.name}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      value="done save tags"
                      onSelect={() => {
                        updateBookmark.mutate({
                          id: bookmarkId,
                          input: {
                            tagIds: pendingTagIds,
                          },
                        });
                        handleOpenChange(false);
                      }}
                    >
                      <CheckIcon />
                      {`Done (${pendingTagIds.length.toString()} selected)`}
                    </CommandItem>
                  </CommandGroup>
                </>
              )}

              {/* Sub-palette: author multi-select */}
              {taxonomyMode === "authors" && bookmarkId && (
                <>
                  <CommandGroup heading="Authors">
                    <CommandItem
                      value="back"
                      onSelect={exitTaxonomyMode}
                    >
                      <ArrowLeftIcon />
                      Back
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Toggle authors">
                    {authors.map((author) => {
                      const selected = pendingAuthorIds.includes(author.id);
                      return (
                        <CommandItem
                          key={author.id}
                          value={author.name}
                          onSelect={() => {
                            setPendingAuthorIds(prev =>
                              selected
                                ? prev.filter(id => id !== author.id)
                                : [...prev, author.id]);
                          }}
                        >
                          {selected && <CheckIcon className="text-primary" />}
                          {author.name}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      value="done save authors"
                      onSelect={() => {
                        updateBookmark.mutate({
                          id: bookmarkId,
                          input: {
                            authorIds: pendingAuthorIds,
                          },
                        });
                        handleOpenChange(false);
                      }}
                    >
                      <CheckIcon />
                      {`Done (${pendingAuthorIds.length.toString()} selected)`}
                    </CommandItem>
                  </CommandGroup>
                </>
              )}

              {/* Default palette view */}
              {taxonomyMode === null && (
                <>
                  {looksLikeUrl && (
                    <>
                      <CommandGroup heading="Quick Add">
                        <CommandItem
                          value={inputValue}
                          onSelect={() => handleAddBookmark(inputValue)}
                        >
                          <PlusIcon />
                          <span>
                            Add bookmark:
                            {" "}
                            <span className="text-muted-foreground">{inputValue}</span>
                          </span>
                        </CommandItem>
                      </CommandGroup>
                      <CommandSeparator />
                    </>
                  )}

                  {bookmarkId && bookmark && (
                    <>
                      <CommandGroup heading="Bookmark Taxonomies">
                        <CommandItem
                          value="Change Category"
                          onSelect={() => enterTaxonomyMode("category")}
                        >
                          <TagIcon />
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <span>Change Category</span>
                            <span className="text-xs text-muted-foreground">
                              {currentCategoryName}
                            </span>
                          </span>
                        </CommandItem>
                        <CommandItem
                          value="Change Tags"
                          onSelect={() => enterTaxonomyMode("tags")}
                        >
                          <TagIcon />
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <span>Change Tags</span>
                            <span className="text-xs text-muted-foreground">
                              {`${bookmark.tags.length.toString()} selected`}
                            </span>
                          </span>
                        </CommandItem>
                        <CommandItem
                          value="Change Media Type"
                          onSelect={() => enterTaxonomyMode("media-type")}
                        >
                          <TagIcon />
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <span>Change Media Type</span>
                            <span className="text-xs text-muted-foreground">
                              {bookmark.mediaType?.name ?? "None"}
                            </span>
                          </span>
                        </CommandItem>
                        {authors.length > 0 && (
                          <CommandItem
                            value="Change Authors"
                            onSelect={() => enterTaxonomyMode("authors")}
                          >
                            <TagIcon />
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span>Change Authors</span>
                              <span className="text-xs text-muted-foreground">
                                {`${bookmark.authors.length.toString()} selected`}
                              </span>
                            </span>
                          </CommandItem>
                        )}
                      </CommandGroup>
                      <CommandSeparator />
                    </>
                  )}

                  <CommandGroup heading="Actions">
                    <CommandItem
                      value="Add Bookmark"
                      onSelect={() => handleAddBookmark()}
                    >
                      <PlusIcon />
                      Add Bookmark
                    </CommandItem>
                  </CommandGroup>

                  <CommandSeparator />

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
                        {bookmarks.map(b => (
                          <CommandItem
                            key={b.id}
                            value={`${b.title} ${b.url}`}
                            onSelect={() => handleSelect(`/bookmarks/${b.id}`)}
                          >
                            <FolderIcon />
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span className="truncate">{b.title}</span>
                              <span
                                className="
                                  truncate text-xs text-muted-foreground
                                "
                              >{b.url}
                              </span>
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      <AddBookmarkModal
        open={addBookmarkOpen}
        onOpenChange={setAddBookmarkOpen}
        initialUrl={pendingUrl}
        autoScan={Boolean(pendingUrl)}
      />
    </>
  );
}
