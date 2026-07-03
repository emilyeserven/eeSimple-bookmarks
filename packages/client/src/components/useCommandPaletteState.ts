import type { CreateKind } from "./commandPaletteModals";
import type { TaxonomyMode } from "./commandPaletteSubPalettes";
import type { EntityChoiceField } from "@/lib/entityPaletteRegistry";
import type { CustomProperty } from "@eesimple/types";

import { useEffect, useState } from "react";

/** The palette's sub-palette navigation state: which mode is active plus the pending multi-selects. */
export type CommandPaletteTaxonomyState = ReturnType<typeof useCommandPaletteTaxonomyState>;

export function useCommandPaletteTaxonomyState() {
  const [taxonomyMode, setTaxonomyMode] = useState<TaxonomyMode | "entity-choice" | null>(null);
  const [pendingTagIds, setPendingTagIds] = useState<string[]>([]);
  const [pendingLocationIds, setPendingLocationIds] = useState<string[]>([]);
  const [pendingPersonIds, setPendingPersonIds] = useState<string[]>([]);
  const [choicesPropertyId, setChoicesPropertyId] = useState<string | null>(null);
  const [pendingChoiceValues, setPendingChoiceValues] = useState<string[]>([]);
  const [ratingPropertyId, setRatingPropertyId] = useState<string | null>(null);
  const [entityChoiceField, setEntityChoiceField] = useState<EntityChoiceField | null>(null);

  function enterMode(
    mode: TaxonomyMode,
    bookmark?: { tags: { id: string }[];
      locations: { id: string }[];
      people: { id: string }[]; } | null,
  ) {
    setTaxonomyMode(mode);
    if (mode === "tags" && bookmark) setPendingTagIds(bookmark.tags.map(t => t.id));
    if (mode === "locations" && bookmark) setPendingLocationIds(bookmark.locations.map(l => l.id));
    if (mode === "people" && bookmark) setPendingPersonIds(bookmark.people.map(a => a.id));
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
    pendingPersonIds,
    setPendingPersonIds,
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
export function useCommandPaletteShell() {
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
export function useAddBookmarkDraft() {
  const [addBookmarkOpen, setAddBookmarkOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState("");
  return {
    addBookmarkOpen,
    setAddBookmarkOpen,
    pendingUrl,
    setPendingUrl,
  };
}

export function useCreateModalState() {
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

/** The search input's placeholder for the active sub-palette mode (default: the global prompt). */
export function paletteInputPlaceholder(
  taxonomy: CommandPaletteTaxonomyState,
  customProperties: CustomProperty[],
): string {
  switch (taxonomy.taxonomyMode) {
    case null:
      return "Search pages and bookmarks…";
    case "media-type":
      return "Search media types…";
    case "newsletter":
      return "Search newsletters…";
    case "choices-property": {
      const name = customProperties.find(p => p.id === taxonomy.choicesPropertyId)?.name;
      return `Search ${name ?? "options"}…`;
    }
    case "rating-property": {
      const name = customProperties.find(p => p.id === taxonomy.ratingPropertyId)?.name;
      return `Select ${name ?? "rating"}…`;
    }
    case "entity-choice":
      return `Search ${taxonomy.entityChoiceField?.label.toLowerCase() ?? "options"}…`;
    default:
      return `Search ${taxonomy.taxonomyMode}…`;
  }
}
