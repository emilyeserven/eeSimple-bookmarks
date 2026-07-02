import type { CreateKind } from "./commandPaletteModals";
import type { TaxonomyMode } from "./commandPaletteSubPalettes";
import type { EntityChoiceField } from "@/lib/entityPaletteRegistry";
import type { SettingsPage } from "@/lib/settingsPages";

import { useEffect, useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import {
  CheckIcon,
  Columns2Icon,
  FolderIcon,
  PencilIcon,
  PlusIcon,
  SettingsIcon,
  StarIcon,
} from "lucide-react";

import { AddChildModal } from "./AddChildModal";
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
import { EntityChoiceSubPalette, EntityCommandGroup } from "./EntityCommandGroup";
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
import { useSettingsFavorite } from "@/hooks/useSettingsFavorite";
import { SETTINGS_TAB_SECTIONS } from "@/lib/settingsNav";
import {
  ACTION_LISTING_PAGES,
  CUSTOMIZATION_LISTING_PAGES,
  SETTINGS_PAGES,
  TAXONOMY_LISTING_PAGES,
} from "@/lib/settingsPages";
import { navItems } from "@/lib/sidebarNavItems";
import { useUiStore } from "@/stores/uiStore";

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

// ─── State hook ──────────────────────────────────────────────────────────────

function useCommandPaletteTaxonomyState() {
  const [taxonomyMode, setTaxonomyMode] = useState<TaxonomyMode | "entity-choice" | null>(null);
  const [pendingTagIds, setPendingTagIds] = useState<string[]>([]);
  const [pendingLocationIds, setPendingLocationIds] = useState<string[]>([]);
  const [pendingAuthorIds, setPendingAuthorIds] = useState<string[]>([]);
  const [choicesPropertyId, setChoicesPropertyId] = useState<string | null>(null);
  const [pendingChoiceValues, setPendingChoiceValues] = useState<string[]>([]);
  const [ratingPropertyId, setRatingPropertyId] = useState<string | null>(null);
  const [entityChoiceField, setEntityChoiceField] = useState<EntityChoiceField | null>(null);

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

  function enterEntityChoiceMode(field: EntityChoiceField) {
    setTaxonomyMode("entity-choice");
    setEntityChoiceField(field);
  }

  function exitMode() {
    setTaxonomyMode(null);
    setChoicesPropertyId(null);
    setRatingPropertyId(null);
    setEntityChoiceField(null);
  }

  function reset() {
    setTaxonomyMode(null);
    setChoicesPropertyId(null);
    setRatingPropertyId(null);
    setEntityChoiceField(null);
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
    entityChoiceField,
    enterMode,
    enterChoicesMode,
    enterRatingMode,
    enterEntityChoiceMode,
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

/**
 * Favorite/unfavorite the current settings page — the palette twin of the header star button
 * (`settingsFavoriteAction`). Mounted only when a settings page matches, so `useSettingsFavorite`'s
 * non-null `page` requirement holds.
 */
function SettingsFavoriteCommandItem({
  page,
  onDone,
}: {
  page: SettingsPage;
  onDone: () => void;
}) {
  const {
    isFavorited, toggle,
  } = useSettingsFavorite(page);
  const label = isFavorited ? "Unfavorite This Page" : "Favorite This Page";
  return (
    <CommandItem
      value={label}
      onSelect={() => {
        toggle();
        onDone();
      }}
    >
      <StarIcon className={isFavorited ? "fill-current" : undefined} />
      {label}
    </CommandItem>
  );
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

  // The header add-child modal, opened from the matched entity's "New sub-tag/sub-type" item.
  const [addChild, setAddChild] = useState<{ kind: "tag" | "mediaType";
    parentId: string; } | null>(null);

  const {
    bookmarks,
    taxonomyContext,
    detailLayout,
    setDetailLayout,
    listingCtx,
    entityCtx,
    settingsPage,
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
            : taxonomy.taxonomyMode === "entity-choice"
              ? `Search ${taxonomy.entityChoiceField?.label.toLowerCase() ?? "options"}…`
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

              {taxonomy.taxonomyMode === "entity-choice" && entityCtx.matched && taxonomy.entityChoiceField && (
                <EntityChoiceSubPalette
                  matched={entityCtx.matched}
                  field={taxonomy.entityChoiceField}
                  choiceOptions={entityCtx.choiceOptions}
                  onBack={handleExitMode}
                  onSelect={(id) => {
                    const field = taxonomy.entityChoiceField;
                    if (field) {
                      entityCtx.matched?.saveField(field.label, {
                        [field.key]: id,
                      });
                    }
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
                        {listingCtx.listingPage.hasSort && (
                          <>
                            <CommandItem
                              value="Sort by Title A to Z"
                              onSelect={() => {
                                listingCtx.setSort({
                                  primary: {
                                    field: "title",
                                    direction: "asc",
                                  },
                                });
                                handleOpenChange(false);
                              }}
                            >
                              Sort by Title (A → Z)
                            </CommandItem>
                            <CommandItem
                              value="Sort by Title Z to A"
                              onSelect={() => {
                                listingCtx.setSort({
                                  primary: {
                                    field: "title",
                                    direction: "desc",
                                  },
                                });
                                handleOpenChange(false);
                              }}
                            >
                              Sort by Title (Z → A)
                            </CommandItem>
                            <CommandItem
                              value="Sort by Date Added Newest"
                              onSelect={() => {
                                listingCtx.setSort({
                                  primary: {
                                    field: "createdAt",
                                    direction: "desc",
                                  },
                                });
                                handleOpenChange(false);
                              }}
                            >
                              Sort by Date Added (Newest)
                            </CommandItem>
                            <CommandItem
                              value="Sort by Date Added Oldest"
                              onSelect={() => {
                                listingCtx.setSort({
                                  primary: {
                                    field: "createdAt",
                                    direction: "asc",
                                  },
                                });
                                handleOpenChange(false);
                              }}
                            >
                              Sort by Date Added (Oldest)
                            </CommandItem>
                            <CommandItem
                              value="Sort by Date Updated Newest"
                              onSelect={() => {
                                listingCtx.setSort({
                                  primary: {
                                    field: "updatedAt",
                                    direction: "desc",
                                  },
                                });
                                handleOpenChange(false);
                              }}
                            >
                              Sort by Date Updated (Newest)
                            </CommandItem>
                            <CommandItem
                              value="Sort by Date Updated Oldest"
                              onSelect={() => {
                                listingCtx.setSort({
                                  primary: {
                                    field: "updatedAt",
                                    direction: "asc",
                                  },
                                });
                                handleOpenChange(false);
                              }}
                            >
                              Sort by Date Updated (Oldest)
                            </CommandItem>
                            <CommandItem
                              value="Sort Randomly"
                              onSelect={() => {
                                listingCtx.setSort({
                                  random: true,
                                  seed: Math.random(),
                                });
                                handleOpenChange(false);
                              }}
                            >
                              Sort Randomly
                            </CommandItem>
                            {listingCtx.currentSort != null && (
                              <CommandItem
                                value="Clear Sort"
                                onSelect={() => {
                                  listingCtx.clearSort();
                                  handleOpenChange(false);
                                }}
                              >
                                Clear Sort
                              </CommandItem>
                            )}
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

                  {settingsPage && (
                    <>
                      <CommandGroup heading="Current Page">
                        <SettingsFavoriteCommandItem
                          page={settingsPage}
                          onDone={() => handleOpenChange(false)}
                        />
                      </CommandGroup>
                      <CommandSeparator />
                    </>
                  )}

                  {entityCtx.matched && (
                    <>
                      <EntityCommandGroup
                        matched={entityCtx.matched}
                        onNavigate={handleSelect}
                        onEnterChoiceField={(field) => {
                          taxonomy.enterEntityChoiceMode(field);
                          setInputValue("");
                        }}
                        onAddChild={(kind, parentId) => {
                          handleOpenChange(false);
                          setAddChild({
                            kind,
                            parentId,
                          });
                        }}
                        onClose={() => handleOpenChange(false)}
                      />
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
                    <CommandItem
                      value="New Custom Property"
                      onSelect={() => handleCreate("custom-property")}
                    >
                      <PlusIcon />
                      New Custom Property
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

                  <CommandGroup heading="Settings">
                    {SETTINGS.map(({
                      label, path, icon: Icon,
                    }) => (
                      <CommandItem
                        key={path}
                        value={`Settings ${label}`}
                        onSelect={() => handleSelect(path)}
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

      {addChild && (
        <AddChildModal
          kind={addChild.kind}
          parentId={addChild.parentId}
          open
          onOpenChange={openState => !openState && setAddChild(null)}
        />
      )}
    </>
  );
}
