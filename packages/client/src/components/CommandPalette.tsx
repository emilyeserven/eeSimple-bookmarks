import type { FlatNode } from "@/lib/tagTree";
import type { TagNode } from "@eesimple/types";

import { useEffect, useMemo, useState } from "react";

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
import { useListingPageContext } from "./useListingPageContext";
import { useSavedFilterContext } from "./useSavedFilterContext";

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
import { useCategoryRootTags } from "@/hooks/useCategories";
import { subtreeIds } from "@/lib/tagTree";

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

type TaxonomyMode = "category" | "media-type" | "tags" | "authors" | "choices-property";

function useTagsPalette(
  flatTags: FlatNode<TagNode>[],
  pendingTagIds: string[],
  categoryId: string | undefined,
) {
  const {
    data: allowedRootIds,
  } = useCategoryRootTags(categoryId ?? "");

  const allTagsById = useMemo(
    () => new Map(flatTags.map(({
      node,
    }) => [node.id, node])),
    [flatTags],
  );

  const filteredFlatTags = useMemo(() => {
    if (allowedRootIds === undefined) return flatTags;
    if (allowedRootIds.length === 0) return [];
    const allowedSet = new Set(allowedRootIds);
    return flatTags.filter(({
      node,
    }) => {
      let current: TagNode | undefined = node;
      while (current?.parentId) current = allTagsById.get(current.parentId);
      return current !== undefined && allowedSet.has(current.id);
    });
  }, [flatTags, allowedRootIds, allTagsById]);

  const {
    priorityTags, otherTags,
  } = useMemo(() => {
    if (pendingTagIds.length === 0) return {
      priorityTags: [],
      otherTags: filteredFlatTags,
    };
    const priorityIds = new Set<string>();
    for (const tagId of pendingTagIds) {
      priorityIds.add(tagId);
      let current = allTagsById.get(tagId);
      while (current?.parentId) {
        priorityIds.add(current.parentId);
        current = allTagsById.get(current.parentId);
      }
      const node = allTagsById.get(tagId);
      if (node) subtreeIds(node).forEach(id => priorityIds.add(id));
    }
    return {
      priorityTags: filteredFlatTags.filter(({
        node,
      }) => priorityIds.has(node.id)),
      otherTags: filteredFlatTags.filter(({
        node,
      }) => !priorityIds.has(node.id)),
    };
  }, [filteredFlatTags, pendingTagIds, allTagsById]);

  return {
    priorityTags,
    otherTags,
  };
}

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
  const [choicesPropertyId, setChoicesPropertyId] = useState<string | null>(null);
  const [pendingChoiceValues, setPendingChoiceValues] = useState<string[]>([]);
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
    customProperties,
    updateBookmark,
  } = useBookmarkTaxonomyContext();

  const {
    priorityTags, otherTags,
  } = useTagsPalette(flatTags, pendingTagIds, bookmark?.categoryId);

  const listingCtx = useListingPageContext();
  const {
    filterId, savedFilter, updateFilter,
  } = useSavedFilterContext();

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setInputValue("");
      setTaxonomyMode(null);
      setChoicesPropertyId(null);
      setPendingChoiceValues([]);
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

  function enterChoicesMode(propId: string) {
    setTaxonomyMode("choices-property");
    setChoicesPropertyId(propId);
    const current = bookmark?.choicesValues.find(v => v.propertyId === propId)?.values ?? [];
    setPendingChoiceValues(current);
    setInputValue("");
  }

  function exitTaxonomyMode() {
    setTaxonomyMode(null);
    setChoicesPropertyId(null);
    setInputValue("");
  }

  const looksLikeUrl
    = inputValue.startsWith("http://")
      || inputValue.startsWith("https://")
      || inputValue.startsWith("www.");

  const currentCategoryName = bookmark
    ? (categories.find(c => c.id === bookmark.categoryId)?.name ?? "Default")
    : null;

  const booleanProperties = customProperties.filter(p => p.type === "boolean");
  const choicesProperties = customProperties.filter(
    p => p.type === "choices" && p.choicesItems.length > 0,
  );

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
                ? taxonomyMode === "media-type"
                  ? "Search media types…"
                  : taxonomyMode === "choices-property" && choicesPropertyId
                    ? `Search ${(customProperties.find(p => p.id === choicesPropertyId)?.name ?? "options")}…`
                    : `Search ${taxonomyMode}…`
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
                    {flatMediaTypes.map(({
                      node: mt, depth,
                    }) => (
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
                        <span
                          style={{
                            paddingLeft: depth > 0 ? `${depth}rem` : undefined,
                          }}
                        >
                          {mt.name}
                        </span>
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
                  {(() => {
                    const renderTagItem = ({
                      node: tag, depth,
                    }: FlatNode<TagNode>) => {
                      const selected = pendingTagIds.includes(tag.id);
                      return (
                        <CommandItem
                          key={tag.id}
                          value={tag.name}
                          onSelect={() =>
                            setPendingTagIds(prev =>
                              selected
                                ? prev.filter(id => id !== tag.id)
                                : [...prev, tag.id])}
                        >
                          <span
                            style={{
                              paddingLeft: depth > 0 ? `${depth}rem` : undefined,
                            }}
                          >
                            {tag.name}
                          </span>
                          {selected && (
                            <CheckIcon
                              className="ml-auto text-primary"
                            />
                          )}
                        </CommandItem>
                      );
                    };
                    return priorityTags.length > 0
                      ? (
                        <>
                          <CommandGroup heading="Selected & related">
                            {priorityTags.map(renderTagItem)}
                          </CommandGroup>
                          {otherTags.length > 0 && (
                            <>
                              <CommandSeparator />
                              <CommandGroup heading="Other tags">
                                {otherTags.map(renderTagItem)}
                              </CommandGroup>
                            </>
                          )}
                        </>
                      )
                      : (
                        <CommandGroup heading="Toggle tags">
                          {otherTags.map(renderTagItem)}
                        </CommandGroup>
                      );
                  })()}
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

              {/* Sub-palette: choices property */}
              {taxonomyMode === "choices-property" && bookmarkId && choicesPropertyId && (() => {
                const prop = customProperties.find(p => p.id === choicesPropertyId);
                if (!prop) return null;
                return (
                  <>
                    <CommandGroup heading={prop.name}>
                      <CommandItem
                        value="back"
                        onSelect={exitTaxonomyMode}
                      >
                        <ArrowLeftIcon />
                        Back
                      </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading={`Select ${prop.name}`}>
                      {prop.choicesItems.map((item) => {
                        const selected = pendingChoiceValues.includes(item.value);
                        return (
                          <CommandItem
                            key={item.value}
                            value={item.label}
                            onSelect={() => {
                              if (prop.choicesMultiple) {
                                setPendingChoiceValues(prev =>
                                  selected
                                    ? prev.filter(v => v !== item.value)
                                    : [...prev, item.value]);
                              }
                              else {
                                updateBookmark.mutate({
                                  id: bookmarkId,
                                  input: {
                                    choicesValues: [
                                      ...(bookmark?.choicesValues.filter(
                                        v => v.propertyId !== choicesPropertyId,
                                      ) ?? []),
                                      {
                                        propertyId: choicesPropertyId,
                                        values: [item.value],
                                      },
                                    ],
                                  },
                                });
                                handleOpenChange(false);
                              }
                            }}
                          >
                            {selected && <CheckIcon className="text-primary" />}
                            {item.label}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                    {prop.choicesMultiple && (
                      <>
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem
                            value="done save choices"
                            onSelect={() => {
                              updateBookmark.mutate({
                                id: bookmarkId,
                                input: {
                                  choicesValues: [
                                    ...(bookmark?.choicesValues.filter(
                                      v => v.propertyId !== choicesPropertyId,
                                    ) ?? []),
                                    {
                                      propertyId: choicesPropertyId,
                                      values: pendingChoiceValues,
                                    },
                                  ],
                                },
                              });
                              handleOpenChange(false);
                            }}
                          >
                            <CheckIcon />
                            {`Done (${pendingChoiceValues.length.toString()} selected)`}
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}
                  </>
                );
              })()}

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

                  {/* Current listing page display controls */}
                  {listingCtx.listingPage && (
                    <>
                      <CommandGroup heading="Current Page">
                        <CommandItem
                          value="Cards View"
                          onSelect={() => {
                            listingCtx.setViewMode("cards");
                            handleOpenChange(false);
                          }}
                        >
                          {listingCtx.currentViewMode === "cards" && (
                            <CheckIcon className="text-primary" />
                          )}
                          Cards View
                        </CommandItem>
                        <CommandItem
                          value="Table View"
                          onSelect={() => {
                            listingCtx.setViewMode("table");
                            handleOpenChange(false);
                          }}
                        >
                          {listingCtx.currentViewMode === "table" && (
                            <CheckIcon className="text-primary" />
                          )}
                          Table View
                        </CommandItem>
                        {listingCtx.currentViewMode === "cards" && ([1, 2, 3, 4] as const).map(n => (
                          <CommandItem
                            key={n}
                            value={`${n.toString()} ${n === 1 ? "Column" : "Columns"}`}
                            onSelect={() => {
                              listingCtx.setColumns(n);
                              handleOpenChange(false);
                            }}
                          >
                            {listingCtx.currentColumns === n && (
                              <CheckIcon className="text-primary" />
                            )}
                            {`${n.toString()} ${n === 1 ? "Column" : "Columns"}`}
                          </CommandItem>
                        ))}
                        {listingCtx.listingPage.hasFilters && (
                          <>
                            <CommandItem
                              value="Filters in Sidebar"
                              onSelect={() => {
                                listingCtx.setFilterLocation("sidebar");
                                handleOpenChange(false);
                              }}
                            >
                              {listingCtx.filterLocation === "sidebar" && (
                                <CheckIcon className="text-primary" />
                              )}
                              Filters in Sidebar
                            </CommandItem>
                            <CommandItem
                              value="Filters in Drawer"
                              onSelect={() => {
                                listingCtx.setFilterLocation("drawer");
                                handleOpenChange(false);
                              }}
                            >
                              {listingCtx.filterLocation === "drawer" && (
                                <CheckIcon className="text-primary" />
                              )}
                              Filters in Drawer
                            </CommandItem>
                            <CommandItem
                              value="Hide Filters"
                              onSelect={() => {
                                listingCtx.setFilterLocation("hide");
                                handleOpenChange(false);
                              }}
                            >
                              {listingCtx.filterLocation === "hide" && (
                                <CheckIcon className="text-primary" />
                              )}
                              Hide Filters
                            </CommandItem>
                          </>
                        )}
                        {listingCtx.bulkSelectPageKey && (
                          <CommandItem
                            value={listingCtx.selectionMode
                              ? "Disable Select Mode"
                              : "Enable Select Mode"}
                            onSelect={() => {
                              listingCtx.setSelectionMode(!listingCtx.selectionMode);
                              handleOpenChange(false);
                            }}
                          >
                            {listingCtx.selectionMode ? "Disable Select Mode" : "Enable Select Mode"}
                          </CommandItem>
                        )}
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
                        {booleanProperties.map((p) => {
                          const current
                            = bookmark.booleanValues.find(v => v.propertyId === p.id)?.value
                              ?? false;
                          return (
                            <CommandItem
                              key={p.id}
                              value={`Toggle ${p.name}`}
                              onSelect={() => {
                                updateBookmark.mutate({
                                  id: bookmarkId,
                                  input: {
                                    booleanValues: [
                                      ...bookmark.booleanValues.filter(
                                        v => v.propertyId !== p.id,
                                      ),
                                      {
                                        propertyId: p.id,
                                        value: !current,
                                      },
                                    ],
                                  },
                                });
                                handleOpenChange(false);
                              }}
                            >
                              {current && <CheckIcon className="text-primary" />}
                              <span className="flex min-w-0 flex-col gap-0.5">
                                <span>{p.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {current ? "On" : "Off"}
                                </span>
                              </span>
                            </CommandItem>
                          );
                        })}
                        {choicesProperties.map((p) => {
                          const current
                            = bookmark.choicesValues.find(v => v.propertyId === p.id)?.values
                              ?? [];
                          return (
                            <CommandItem
                              key={p.id}
                              value={`Set ${p.name}`}
                              onSelect={() => enterChoicesMode(p.id)}
                            >
                              <span className="flex min-w-0 flex-col gap-0.5">
                                <span>
                                  Set
                                  {" "}
                                  {p.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {current.length > 0 ? current.join(", ") : "None"}
                                </span>
                              </span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                      <CommandSeparator />
                    </>
                  )}

                  {filterId && savedFilter && (
                    <>
                      <CommandGroup heading="Saved Filter">
                        <CommandItem
                          value="Toggle Sidebar Shortcut"
                          onSelect={() => {
                            updateFilter.mutate({
                              id: filterId,
                              input: {
                                viewableOnline: !savedFilter.viewableOnline,
                              },
                            });
                            handleOpenChange(false);
                          }}
                        >
                          {savedFilter.viewableOnline && (
                            <CheckIcon className="text-primary" />
                          )}
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <span>Sidebar Shortcut</span>
                            <span className="text-xs text-muted-foreground">
                              {savedFilter.viewableOnline ? "Shown" : "Hidden"}
                            </span>
                          </span>
                        </CommandItem>
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
