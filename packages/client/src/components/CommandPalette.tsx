import type { CreateKind } from "./commandPaletteModals";
import type { TaxonomyMode } from "./commandPaletteSubPalettes";

import { useEffect, useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import {
  BookmarkIcon,
  CheckIcon,
  Columns2Icon,
  FolderIcon,
  HomeIcon,
  InboxIcon,
  PencilIcon,
  PlusIcon,
  SettingsIcon,
  TagIcon,
} from "lucide-react";

import { CommandPaletteModals } from "./commandPaletteModals";
import {
  AuthorsSubPalette,
  BookmarkTaxonomiesGroup,
  CardDisplayRulesGroup,
  CategorySubPalette,
  ChoicesSubPalette,
  LocationsSubPalette,
  MediaTypeSubPalette,
  NewsletterSubPalette,
  RatingSubPalette,
  TagsSubPalette,
} from "./commandPaletteSubPalettes";
import { useCommandPaletteData } from "./useCommandPaletteData";

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
import { useUiStore } from "@/stores/uiStore";

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
    path: "/settings/display/homepage",
  },
  {
    label: "Drawer",
    path: "/settings/display/drawer",
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
    path: "/settings/automations/imports",
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
    path: "/settings/automations/link-parsing",
  },
  {
    label: "Manage Media",
    path: "/settings/advanced/manage-media",
  },
  {
    label: "Advanced",
    path: "/settings/advanced",
  },
  {
    label: "Saved Filters",
    path: "/saved-filters",
  },
  {
    label: "Extension",
    path: "/settings/extension",
  },
] as const;

// ─── State hook ──────────────────────────────────────────────────────────────

function useCommandPaletteTaxonomyState() {
  const [taxonomyMode, setTaxonomyMode] = useState<TaxonomyMode | null>(null);
  const [pendingTagIds, setPendingTagIds] = useState<string[]>([]);
  const [pendingLocationIds, setPendingLocationIds] = useState<string[]>([]);
  const [pendingAuthorIds, setPendingAuthorIds] = useState<string[]>([]);
  const [choicesPropertyId, setChoicesPropertyId] = useState<string | null>(null);
  const [pendingChoiceValues, setPendingChoiceValues] = useState<string[]>([]);
  const [ratingPropertyId, setRatingPropertyId] = useState<string | null>(null);

  function enterMode(
    mode: TaxonomyMode,
    bookmark?: { tags: { id: string }[];
      locations: { id: string }[];
      authors: { id: string }[]; } | null,
  ) {
    setTaxonomyMode(mode);
    if (mode === "tags" && bookmark) setPendingTagIds(bookmark.tags.map(t => t.id));
    if (mode === "locations" && bookmark) setPendingLocationIds(bookmark.locations.map(l => l.id));
    if (mode === "authors" && bookmark) setPendingAuthorIds(bookmark.authors.map(a => a.id));
  }

  function enterChoicesMode(propId: string, current: string[]) {
    setTaxonomyMode("choices-property");
    setChoicesPropertyId(propId);
    setPendingChoiceValues(current);
  }

  function enterRatingMode(propId: string) {
    setTaxonomyMode("rating-property");
    setRatingPropertyId(propId);
  }

  function exitMode() {
    setTaxonomyMode(null);
    setChoicesPropertyId(null);
    setRatingPropertyId(null);
  }

  function reset() {
    setTaxonomyMode(null);
    setChoicesPropertyId(null);
    setRatingPropertyId(null);
    setPendingChoiceValues([]);
  }

  return {
    taxonomyMode,
    pendingTagIds,
    setPendingTagIds,
    pendingLocationIds,
    setPendingLocationIds,
    pendingAuthorIds,
    setPendingAuthorIds,
    choicesPropertyId,
    pendingChoiceValues,
    setPendingChoiceValues,
    ratingPropertyId,
    enterMode,
    enterChoicesMode,
    enterRatingMode,
    exitMode,
    reset,
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

function useCreateModalState() {
  const [createKind, setCreateKind] = useState<CreateKind | null>(null);
  const [assignOnCreate, setAssignOnCreate] = useState(false);

  function openCreate(kind: CreateKind) {
    setCreateKind(kind);
    setAssignOnCreate(false);
  }

  function openCreateAndAssign(kind: CreateKind) {
    setCreateKind(kind);
    setAssignOnCreate(true);
  }

  function closeCreate() {
    setCreateKind(null);
    setAssignOnCreate(false);
  }

  return {
    createKind,
    assignOnCreate,
    openCreate,
    openCreateAndAssign,
    closeCreate,
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CommandPalette() {
  const {
    open, setOpen, inputValue, setInputValue,
  } = useCommandPaletteShell();
  const {
    addBookmarkOpen, setAddBookmarkOpen, pendingUrl, setPendingUrl,
  } = useAddBookmarkDraft();
  const {
    createKind, assignOnCreate, openCreate, openCreateAndAssign, closeCreate,
  } = useCreateModalState();
  const taxonomy = useCommandPaletteTaxonomyState();
  const navigate = useNavigate();

  // Snapshot the hovered card at open time: opening the dialog covers the page and can fire the
  // card's mouseleave, so reading the live value would null it out just as the palette appears.
  const hoveredBookmarkId = useUiStore(state => state.hoveredBookmarkId);
  const [targetBookmarkId, setTargetBookmarkId] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setTargetBookmarkId(hoveredBookmarkId);
    }
    // Only re-snapshot on the open transition, not on every hover change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const {
    bookmarks,
    taxonomyContext,
    detailLayout,
    setDetailLayout,
    listingCtx,
    savedFilterCtx,
    matchingCardRules,
  } = useCommandPaletteData(open, targetBookmarkId);

  const {
    bookmarkId,
    isBookmarkViewPage,
    bookmarkFromHover,
    bookmark,
    categories,
    flatMediaTypes,
    flatTags,
    flatLocations,
    authors,
    newsletters,
    customProperties,
    updateBookmark,
  } = taxonomyContext;

  const {
    filterId, savedFilter, updateFilter,
  } = savedFilterCtx;

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setInputValue("");
      taxonomy.reset();
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

  const handleCreate = (kind: CreateKind) => {
    handleOpenChange(false);
    openCreate(kind);
  };

  const handleCreateAndAssign = (kind: CreateKind) => {
    handleOpenChange(false);
    openCreateAndAssign(kind);
  };

  const handleEnterMode = (mode: TaxonomyMode) => {
    taxonomy.enterMode(mode, bookmark);
    setInputValue("");
  };

  const handleEnterChoicesMode = (propId: string) => {
    taxonomy.enterChoicesMode(
      propId,
      bookmark?.choicesValues.find(v => v.propertyId === propId)?.values ?? [],
    );
    setInputValue("");
  };

  const handleEnterRatingMode = (propId: string) => {
    taxonomy.enterRatingMode(propId);
    setInputValue("");
  };

  const handleExitMode = () => {
    taxonomy.exitMode();
    setInputValue("");
  };

  const looksLikeUrl
    = inputValue.startsWith("http://")
      || inputValue.startsWith("https://")
      || inputValue.startsWith("www.");

  const currentCategoryName = bookmark
    ? (categories.find(c => c.id === bookmark.categoryId)?.name ?? "Default")
    : null;

  const booleanProperties = customProperties.filter(
    p => p.type === "boolean" && p.editableViaCmdk,
  );
  const choicesProperties = customProperties.filter(
    p => p.type === "choices" && p.choicesItems.length > 0 && p.editableViaCmdk,
  );
  const ratingProperties = customProperties.filter(
    p => p.type === "ratingScale" && !p.ratingAllowHalf && p.editableViaCmdk,
  );
  const editableProperties = customProperties.filter(
    p => p.editableViaCmdk
      && p.type !== "calculate"
      && p.type !== "boolean"
      && !(p.type === "choices" && p.choicesItems.length > 0)
      && !(p.type === "ratingScale" && !p.ratingAllowHalf),
  );

  const bookmarkTaxonomiesGroup = bookmarkId && bookmark && (
    <BookmarkTaxonomiesGroup
      bookmark={bookmark}
      bookmarkId={bookmarkId}
      isBookmarkViewPage={isBookmarkViewPage}
      currentCategoryName={currentCategoryName}
      authors={authors}
      booleanProperties={booleanProperties}
      choicesProperties={choicesProperties}
      ratingProperties={ratingProperties}
      editableProperties={editableProperties}
      updateBookmark={updateBookmark}
      onEnterMode={handleEnterMode}
      onEnterChoicesMode={handleEnterChoicesMode}
      onEnterRatingMode={handleEnterRatingMode}
      onNavigateProperties={() => {
        void navigate({
          to: "/bookmarks/$bookmarkId/edit/properties",
          params: {
            bookmarkId,
          },
        });
        handleOpenChange(false);
      }}
      onClose={() => handleOpenChange(false)}
    />
  );

  // Empty (no bookmark / no matches) renders nothing — CardDisplayRulesGroup returns null — so no
  // extra guard is needed at the call sites beyond the hover/detail position check.
  const cardDisplayRulesGroup = (
    <CardDisplayRulesGroup
      rules={matchingCardRules}
      onSelect={(slug) => {
        void navigate({
          to: "/card-display-rules/$ruleSlug",
          params: {
            ruleSlug: slug,
          },
        });
        handleOpenChange(false);
      }}
    />
  );

  const inputPlaceholder = taxonomy.taxonomyMode
    ? taxonomy.taxonomyMode === "media-type"
      ? "Search media types…"
      : taxonomy.taxonomyMode === "newsletter"
        ? "Search newsletters…"
        : taxonomy.taxonomyMode === "choices-property" && taxonomy.choicesPropertyId
          ? `Search ${(customProperties.find(p => p.id === taxonomy.choicesPropertyId)?.name ?? "options")}…`
          : taxonomy.taxonomyMode === "rating-property" && taxonomy.ratingPropertyId
            ? `Select ${(customProperties.find(p => p.id === taxonomy.ratingPropertyId)?.name ?? "rating")}…`
            : `Search ${taxonomy.taxonomyMode}…`
    : "Search pages and bookmarks…";

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
              placeholder={inputPlaceholder}
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList className="max-h-[500px]">
              <CommandEmpty>No results found.</CommandEmpty>

              {taxonomy.taxonomyMode === "category" && bookmarkId && (
                <CategorySubPalette
                  categories={categories}
                  currentCategoryId={bookmark?.categoryId}
                  onBack={handleExitMode}
                  onSelect={(categoryId) => {
                    updateBookmark.mutate({
                      id: bookmarkId,
                      input: {
                        categoryId,
                      },
                    });
                    handleOpenChange(false);
                  }}
                  onCreateNew={() => handleCreateAndAssign("category")}
                />
              )}

              {taxonomy.taxonomyMode === "media-type" && bookmarkId && (
                <MediaTypeSubPalette
                  flatMediaTypes={flatMediaTypes}
                  currentMediaTypeId={bookmark?.mediaType?.id}
                  onBack={handleExitMode}
                  onSelect={(mediaTypeId) => {
                    updateBookmark.mutate({
                      id: bookmarkId,
                      input: {
                        mediaTypeId,
                      },
                    });
                    handleOpenChange(false);
                  }}
                  onCreateNew={() => handleCreateAndAssign("media-type")}
                />
              )}

              {taxonomy.taxonomyMode === "tags" && bookmarkId && (
                <TagsSubPalette
                  flatTags={flatTags}
                  categoryId={bookmark?.categoryId ?? undefined}
                  pendingTagIds={taxonomy.pendingTagIds}
                  onToggleTag={tagId =>
                    taxonomy.setPendingTagIds(prev =>
                      prev.includes(tagId)
                        ? prev.filter(id => id !== tagId)
                        : [...prev, tagId])}
                  onBack={handleExitMode}
                  onDone={() => {
                    updateBookmark.mutate({
                      id: bookmarkId,
                      input: {
                        tagIds: taxonomy.pendingTagIds,
                      },
                    });
                    handleOpenChange(false);
                  }}
                  onCreateNew={() => handleCreateAndAssign("tag")}
                />
              )}

              {taxonomy.taxonomyMode === "locations" && bookmarkId && (
                <LocationsSubPalette
                  flatLocations={flatLocations}
                  pendingLocationIds={taxonomy.pendingLocationIds}
                  onToggleLocation={locationId =>
                    taxonomy.setPendingLocationIds(prev =>
                      prev.includes(locationId)
                        ? prev.filter(id => id !== locationId)
                        : [...prev, locationId])}
                  onBack={handleExitMode}
                  onDone={() => {
                    updateBookmark.mutate({
                      id: bookmarkId,
                      input: {
                        locationIds: taxonomy.pendingLocationIds,
                      },
                    });
                    handleOpenChange(false);
                  }}
                  onCreateNew={() => handleCreateAndAssign("location")}
                />
              )}

              {taxonomy.taxonomyMode === "authors" && bookmarkId && (
                <AuthorsSubPalette
                  authors={authors}
                  pendingAuthorIds={taxonomy.pendingAuthorIds}
                  onToggleAuthor={authorId =>
                    taxonomy.setPendingAuthorIds(prev =>
                      prev.includes(authorId)
                        ? prev.filter(id => id !== authorId)
                        : [...prev, authorId])}
                  onBack={handleExitMode}
                  onDone={() => {
                    updateBookmark.mutate({
                      id: bookmarkId,
                      input: {
                        authorIds: taxonomy.pendingAuthorIds,
                      },
                    });
                    handleOpenChange(false);
                  }}
                  onCreateNew={() => handleCreateAndAssign("author")}
                />
              )}

              {taxonomy.taxonomyMode === "newsletter" && bookmarkId && (
                <NewsletterSubPalette
                  newsletters={newsletters}
                  currentNewsletterId={bookmark?.newsletter?.id}
                  onBack={handleExitMode}
                  onSelect={(newsletterId) => {
                    updateBookmark.mutate({
                      id: bookmarkId,
                      input: {
                        newsletterId,
                      },
                    });
                    handleOpenChange(false);
                  }}
                  onCreateNew={() => handleCreateAndAssign("newsletter")}
                />
              )}

              {taxonomy.taxonomyMode === "choices-property" && bookmarkId && taxonomy.choicesPropertyId && (
                <ChoicesSubPalette
                  prop={customProperties.find(p => p.id === taxonomy.choicesPropertyId)}
                  pendingValues={taxonomy.pendingChoiceValues}
                  onToggleValue={value =>
                    taxonomy.setPendingChoiceValues(prev =>
                      prev.includes(value)
                        ? prev.filter(v => v !== value)
                        : [...prev, value])}
                  onBack={handleExitMode}
                  onSelectSingle={(value) => {
                    const propId = taxonomy.choicesPropertyId ?? "";
                    updateBookmark.mutate({
                      id: bookmarkId,
                      input: {
                        choicesValues: [
                          ...(bookmark?.choicesValues.filter(
                            v => v.propertyId !== propId,
                          ) ?? []),
                          {
                            propertyId: propId,
                            values: [value],
                          },
                        ],
                      },
                    });
                    handleOpenChange(false);
                  }}
                  onDoneMultiple={() => {
                    const propId = taxonomy.choicesPropertyId ?? "";
                    updateBookmark.mutate({
                      id: bookmarkId,
                      input: {
                        choicesValues: [
                          ...(bookmark?.choicesValues.filter(
                            v => v.propertyId !== propId,
                          ) ?? []),
                          {
                            propertyId: propId,
                            values: taxonomy.pendingChoiceValues,
                          },
                        ],
                      },
                    });
                    handleOpenChange(false);
                  }}
                />
              )}

              {taxonomy.taxonomyMode === "rating-property" && bookmarkId && taxonomy.ratingPropertyId && (
                <RatingSubPalette
                  prop={customProperties.find(p => p.id === taxonomy.ratingPropertyId)}
                  currentValue={
                    bookmark?.numberValues.find(v => v.propertyId === taxonomy.ratingPropertyId)
                      ?.value ?? null
                  }
                  onBack={handleExitMode}
                  onSelect={(n) => {
                    const propId = taxonomy.ratingPropertyId ?? "";
                    updateBookmark.mutate({
                      id: bookmarkId,
                      input: {
                        numberValues: [
                          ...(bookmark?.numberValues.filter(
                            v => v.propertyId !== propId,
                          ) ?? []),
                          ...(n !== null
                            ? [{
                              propertyId: propId,
                              value: n,
                            }]
                            : []),
                        ],
                      },
                    });
                    handleOpenChange(false);
                  }}
                />
              )}

              {/* Default palette view */}
              {taxonomy.taxonomyMode === null && (
                <>
                  {/* Hovered card's quick-edit commands float to the top of the palette. */}
                  {bookmarkFromHover && bookmarkTaxonomiesGroup}
                  {bookmarkFromHover && cardDisplayRulesGroup}

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

                  {isBookmarkViewPage && bookmarkId && bookmark && (
                    <>
                      <CommandGroup heading="Current Page">
                        <CommandItem
                          value="Go to Edit"
                          onSelect={() => {
                            void navigate({
                              to: "/bookmarks/$bookmarkId/edit/general",
                              params: {
                                bookmarkId,
                              },
                            });
                            handleOpenChange(false);
                          }}
                        >
                          <PencilIcon />
                          Go to Edit
                        </CommandItem>
                        <CommandItem
                          value="Single Layout"
                          onSelect={() => {
                            setDetailLayout("single");
                            handleOpenChange(false);
                          }}
                        >
                          {detailLayout === "single" && (
                            <CheckIcon
                              className="text-primary"
                            />
                          )}
                          <Columns2Icon />
                          Single Layout
                        </CommandItem>
                        <CommandItem
                          value="Tabbed Layout"
                          onSelect={() => {
                            setDetailLayout("tabbed");
                            handleOpenChange(false);
                          }}
                        >
                          {detailLayout === "tabbed" && (
                            <CheckIcon
                              className="text-primary"
                            />
                          )}
                          <Columns2Icon />
                          Tabbed Layout
                        </CommandItem>
                      </CommandGroup>
                      <CommandSeparator />
                    </>
                  )}

                  {/* On a bookmark detail page the same group keeps its in-page position. */}
                  {!bookmarkFromHover && bookmarkTaxonomiesGroup}
                  {!bookmarkFromHover && cardDisplayRulesGroup}

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
                    <CommandItem
                      value="New Category"
                      onSelect={() => handleCreate("category")}
                    >
                      <PlusIcon />
                      New Category
                    </CommandItem>
                    <CommandItem
                      value="New Tag"
                      onSelect={() => handleCreate("tag")}
                    >
                      <PlusIcon />
                      New Tag
                    </CommandItem>
                    <CommandItem
                      value="New Media Type"
                      onSelect={() => handleCreate("media-type")}
                    >
                      <PlusIcon />
                      New Media Type
                    </CommandItem>
                    <CommandItem
                      value="New Author"
                      onSelect={() => handleCreate("author")}
                    >
                      <PlusIcon />
                      New Author
                    </CommandItem>
                    <CommandItem
                      value="New Website"
                      onSelect={() => handleCreate("website")}
                    >
                      <PlusIcon />
                      New Website
                    </CommandItem>
                    <CommandItem
                      value="New Property Group"
                      onSelect={() => handleCreate("property-group")}
                    >
                      <PlusIcon />
                      New Property Group
                    </CommandItem>
                    <CommandItem
                      value="New YouTube Channel"
                      onSelect={() => handleCreate("youtube-channel")}
                    >
                      <PlusIcon />
                      New YouTube Channel
                    </CommandItem>
                    <CommandItem
                      value="New Newsletter"
                      onSelect={() => handleCreate("newsletter")}
                    >
                      <PlusIcon />
                      New Newsletter
                    </CommandItem>
                    <CommandItem
                      value="New Location"
                      onSelect={() => handleCreate("location")}
                    >
                      <PlusIcon />
                      New Location
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

      <CommandPaletteModals
        addBookmarkOpen={addBookmarkOpen}
        setAddBookmarkOpen={setAddBookmarkOpen}
        pendingUrl={pendingUrl}
        createKind={createKind}
        assignOnCreate={assignOnCreate}
        closeCreate={closeCreate}
        bookmarkId={bookmarkId}
        bookmark={bookmark}
        updateBookmark={updateBookmark}
      />
    </>
  );
}
