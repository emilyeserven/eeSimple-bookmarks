import type { FlatNode } from "@/lib/tagTree";
import type { Author, Category, CustomProperty, MediaTypeNode, TagNode } from "@eesimple/types";

import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
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

import { AddAuthorModal } from "./AddAuthorModal";
import { AddBookmarkModal } from "./AddBookmarkModal";
import { AddCategoryModal } from "./AddCategoryModal";
import { AddMediaTypeModal } from "./AddMediaTypeModal";
import { AddNewsletterModal } from "./AddNewsletterModal";
import { AddPropertyGroupModal } from "./AddPropertyGroupModal";
import { AddTagModal } from "./AddTagModal";
import { AddWebsiteModal } from "./AddWebsiteModal";
import { AddYouTubeChannelModal } from "./AddYouTubeChannelModal";
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
import {
  useBookmarkDetailLayout,
  useDisplayPreferenceSettings,
  useUpdateDisplayPreferenceSettings,
} from "@/hooks/useAppSettings";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useCategoryRootTags } from "@/hooks/useCategories";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { subtreeIds } from "@/lib/tagTree";
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

type TaxonomyMode = "category" | "media-type" | "tags" | "authors" | "choices-property" | "rating-property";

// ─── State hook ──────────────────────────────────────────────────────────────

function useCommandPaletteTaxonomyState() {
  const [taxonomyMode, setTaxonomyMode] = useState<TaxonomyMode | null>(null);
  const [pendingTagIds, setPendingTagIds] = useState<string[]>([]);
  const [pendingAuthorIds, setPendingAuthorIds] = useState<string[]>([]);
  const [choicesPropertyId, setChoicesPropertyId] = useState<string | null>(null);
  const [pendingChoiceValues, setPendingChoiceValues] = useState<string[]>([]);
  const [ratingPropertyId, setRatingPropertyId] = useState<string | null>(null);

  function enterMode(
    mode: TaxonomyMode,
    bookmark?: { tags: { id: string }[];
      authors: { id: string }[]; } | null,
  ) {
    setTaxonomyMode(mode);
    if (mode === "tags" && bookmark) setPendingTagIds(bookmark.tags.map(t => t.id));
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

type CreateKind
  = | "category"
    | "tag"
    | "media-type"
    | "author"
    | "website"
    | "property-group"
    | "youtube-channel"
    | "newsletter";

function useCreateModalState() {
  const [createKind, setCreateKind] = useState<CreateKind | null>(null);
  return {
    createKind,
    openCreate: (kind: CreateKind) => setCreateKind(kind),
    closeCreate: () => setCreateKind(null),
  };
}

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

// ─── Sub-palette components ───────────────────────────────────────────────────

function CategorySubPalette({
  categories,
  currentCategoryId,
  onBack,
  onSelect,
}: {
  categories: Category[];
  currentCategoryId: string | null | undefined;
  onBack: () => void;
  onSelect: (categoryId: string) => void;
}) {
  return (
    <>
      <CommandGroup heading="Category">
        <CommandItem
          value="back"
          onSelect={onBack}
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
            onSelect={() => onSelect(category.id)}
          >
            {currentCategoryId === category.id && (
              <CheckIcon className="text-primary" />
            )}
            {category.name}
          </CommandItem>
        ))}
      </CommandGroup>
    </>
  );
}

function MediaTypeSubPalette({
  flatMediaTypes,
  currentMediaTypeId,
  onBack,
  onSelect,
}: {
  flatMediaTypes: FlatNode<MediaTypeNode>[];
  currentMediaTypeId: string | null | undefined;
  onBack: () => void;
  onSelect: (mediaTypeId: string | null) => void;
}) {
  return (
    <>
      <CommandGroup heading="Media Type">
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          Back
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Select media type">
        <CommandItem
          value="None"
          onSelect={() => onSelect(null)}
        >
          {currentMediaTypeId == null && (
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
            onSelect={() => onSelect(mt.id)}
          >
            {currentMediaTypeId === mt.id && (
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
  );
}

function TagsSubPalette({
  flatTags,
  categoryId,
  pendingTagIds,
  onToggleTag,
  onBack,
  onDone,
}: {
  flatTags: FlatNode<TagNode>[];
  categoryId: string | undefined;
  pendingTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onBack: () => void;
  onDone: (tagIds: string[]) => void;
}) {
  const {
    priorityTags, otherTags,
  } = useTagsPalette(flatTags, pendingTagIds, categoryId);

  const renderTagItem = ({
    node: tag, depth,
  }: FlatNode<TagNode>) => {
    const selected = pendingTagIds.includes(tag.id);
    return (
      <CommandItem
        key={tag.id}
        value={tag.name}
        onSelect={() => onToggleTag(tag.id)}
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

  return (
    <>
      <CommandGroup heading="Tags">
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          Back
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      {priorityTags.length > 0
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
        )}
      <CommandSeparator />
      <CommandGroup>
        <CommandItem
          value="done save tags"
          onSelect={() => onDone(pendingTagIds)}
        >
          <CheckIcon />
          {`Done (${pendingTagIds.length.toString()} selected)`}
        </CommandItem>
      </CommandGroup>
    </>
  );
}

function AuthorsSubPalette({
  authors,
  pendingAuthorIds,
  onToggleAuthor,
  onBack,
  onDone,
}: {
  authors: Author[];
  pendingAuthorIds: string[];
  onToggleAuthor: (authorId: string) => void;
  onBack: () => void;
  onDone: (authorIds: string[]) => void;
}) {
  return (
    <>
      <CommandGroup heading="Authors">
        <CommandItem
          value="back"
          onSelect={onBack}
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
              onSelect={() => onToggleAuthor(author.id)}
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
          onSelect={() => onDone(pendingAuthorIds)}
        >
          <CheckIcon />
          {`Done (${pendingAuthorIds.length.toString()} selected)`}
        </CommandItem>
      </CommandGroup>
    </>
  );
}

function ChoicesSubPalette({
  prop,
  pendingValues,
  onToggleValue,
  onBack,
  onSelectSingle,
  onDoneMultiple,
}: {
  prop: CustomProperty | undefined;
  pendingValues: string[];
  onToggleValue: (value: string) => void;
  onBack: () => void;
  onSelectSingle: (value: string) => void;
  onDoneMultiple: (values: string[]) => void;
}) {
  if (!prop) return null;
  return (
    <>
      <CommandGroup heading={prop.name}>
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          Back
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading={`Select ${prop.name}`}>
        {prop.choicesItems.map((item) => {
          const selected = pendingValues.includes(item.value);
          return (
            <CommandItem
              key={item.value}
              value={item.label}
              onSelect={() => {
                if (prop.choicesMultiple) {
                  onToggleValue(item.value);
                }
                else {
                  onSelectSingle(item.value);
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
              onSelect={() => onDoneMultiple(pendingValues)}
            >
              <CheckIcon />
              {`Done (${pendingValues.length.toString()} selected)`}
            </CommandItem>
          </CommandGroup>
        </>
      )}
    </>
  );
}

function RatingSubPalette({
  prop,
  currentValue,
  onBack,
  onSelect,
}: {
  prop: CustomProperty | undefined;
  currentValue: number | null;
  onBack: () => void;
  onSelect: (value: number | null) => void;
}) {
  if (!prop) return null;
  const max = prop.ratingMax ?? 5;
  const allowZero = prop.ratingAllowZero ?? false;
  const options = Array.from({
    length: max,
  }, (_, i) => i + 1);
  return (
    <>
      <CommandGroup heading={prop.name}>
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          Back
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading={`Select ${prop.name}`}>
        {allowZero && (
          <CommandItem
            value="No rating"
            onSelect={() => onSelect(null)}
          >
            {currentValue === null && (
              <CheckIcon className="text-primary" />
            )}
            No rating
          </CommandItem>
        )}
        {options.map(n => (
          <CommandItem
            key={n}
            value={`${n.toString()} ${n === 1 ? "star" : "stars"}`}
            onSelect={() => onSelect(n)}
          >
            {currentValue === n && <CheckIcon className="text-primary" />}
            {"★".repeat(n)}
            {"☆".repeat(max - n)}
          </CommandItem>
        ))}
      </CommandGroup>
    </>
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
    createKind, openCreate, closeCreate,
  } = useCreateModalState();
  const taxonomy = useCommandPaletteTaxonomyState();
  const navigate = useNavigate();
  const {
    data: bookmarks = [],
  } = useBookmarks();

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
    bookmarkId,
    isBookmarkViewPage,
    bookmark,
    categories,
    flatMediaTypes,
    flatTags,
    authors,
    customProperties,
    updateBookmark,
  } = useBookmarkTaxonomyContext(open ? targetBookmarkId : null);

  const detailLayout = useBookmarkDetailLayout();
  const {
    data: displayPrefs,
  } = useDisplayPreferenceSettings();
  const updateDisplayPrefs = useUpdateDisplayPreferenceSettings();

  const listingCtx = useListingPageContext();
  const {
    filterId, savedFilter, updateFilter,
  } = useSavedFilterContext();

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

  const inputPlaceholder = taxonomy.taxonomyMode
    ? taxonomy.taxonomyMode === "media-type"
      ? "Search media types…"
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
                            if (displayPrefs) {
                              updateDisplayPrefs.mutate({
                                ...displayPrefs,
                                bookmarkDetailLayout: "single",
                              }, {
                                onSuccess: () => notifySuccess("Detail layout: single"),
                                onError: error => notifyError(error.message),
                              });
                            }
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
                            if (displayPrefs) {
                              updateDisplayPrefs.mutate({
                                ...displayPrefs,
                                bookmarkDetailLayout: "tabbed",
                              }, {
                                onSuccess: () => notifySuccess("Detail layout: tabbed"),
                                onError: error => notifyError(error.message),
                              });
                            }
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

                  {bookmarkId && bookmark && (
                    <>
                      <CommandGroup
                        heading={isBookmarkViewPage
                          ? "Bookmark Taxonomies"
                          : `Bookmark Taxonomies — ${bookmark.title}`}
                      >
                        <CommandItem
                          value="Change Category"
                          onSelect={() => handleEnterMode("category")}
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
                          onSelect={() => handleEnterMode("tags")}
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
                          onSelect={() => handleEnterMode("media-type")}
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
                            onSelect={() => handleEnterMode("authors")}
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
                              onSelect={() => handleEnterChoicesMode(p.id)}
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
                        {ratingProperties.map((p) => {
                          const current
                            = bookmark.numberValues.find(v => v.propertyId === p.id)?.value
                              ?? null;
                          const max = p.ratingMax ?? 5;
                          return (
                            <CommandItem
                              key={p.id}
                              value={`Set ${p.name}`}
                              onSelect={() => handleEnterRatingMode(p.id)}
                            >
                              <span className="flex min-w-0 flex-col gap-0.5">
                                <span>
                                  Set
                                  {" "}
                                  {p.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {current !== null
                                    ? `${"★".repeat(current)}${"☆".repeat(max - current)}`
                                    : "Not rated"}
                                </span>
                              </span>
                            </CommandItem>
                          );
                        })}
                        {editableProperties.map(p => (
                          <CommandItem
                            key={p.id}
                            value={`Edit ${p.name}`}
                            onSelect={() => {
                              void navigate({
                                to: "/bookmarks/$bookmarkId/edit/properties",
                                params: {
                                  bookmarkId: bookmarkId ?? "",
                                },
                              });
                              handleOpenChange(false);
                            }}
                          >
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span>
                                Edit
                                {" "}
                                {p.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Opens properties tab
                              </span>
                            </span>
                          </CommandItem>
                        ))}
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

      <AddCategoryModal
        open={createKind === "category"}
        onOpenChange={open => !open && closeCreate()}
      />
      <AddTagModal
        open={createKind === "tag"}
        onOpenChange={open => !open && closeCreate()}
      />
      <AddMediaTypeModal
        open={createKind === "media-type"}
        onOpenChange={open => !open && closeCreate()}
      />
      <AddAuthorModal
        open={createKind === "author"}
        onOpenChange={open => !open && closeCreate()}
      />
      <AddWebsiteModal
        open={createKind === "website"}
        onOpenChange={open => !open && closeCreate()}
      />
      <AddPropertyGroupModal
        open={createKind === "property-group"}
        onOpenChange={open => !open && closeCreate()}
      />
      <AddYouTubeChannelModal
        open={createKind === "youtube-channel"}
        onOpenChange={open => !open && closeCreate()}
      />
      <AddNewsletterModal
        open={createKind === "newsletter"}
        onOpenChange={open => !open && closeCreate()}
      />
    </>
  );
}
