import type { BookmarkSort, SortDirection } from "../lib/bookmarkSort";

import { ArrowUpDown } from "lucide-react";

import { useCustomProperties } from "../hooks/useCustomProperties";
import { SORTABLE_PROPERTY_TYPES } from "../lib/bookmarkSort";
import { cn } from "../lib/utils";
import { useUiStore } from "../stores/uiStore";
import { Button } from "./ui/button";
import { ResponsivePopover } from "./ui/responsive-popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

interface BookmarkSortPopoverProps {
  pageKey: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BookmarkSortPopover({
  pageKey,
  open,
  onOpenChange,
}: BookmarkSortPopoverProps) {
  const isActive = useUiStore(s => s.bookmarkSort[pageKey] != null);
  return (
    <ResponsivePopover
      title="Sort"
      open={open}
      onOpenChange={onOpenChange}
      trigger={(
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Sort bookmarks"
        >
          <span className="relative">
            <ArrowUpDown className={cn("size-4", isActive && "text-primary")} />
            {isActive && (
              <span
                className="
                  absolute -top-1 -right-1 size-1.5 rounded-full bg-primary
                "
              />
            )}
          </span>
        </Button>
      )}
    >
      <BookmarkSortControls pageKey={pageKey} />
    </ResponsivePopover>
  );
}

interface BookmarkSortControlsProps {
  pageKey: string;
}

const RANDOM_FIELD = "random";

function BookmarkSortControls({
  pageKey,
}: BookmarkSortControlsProps) {
  const sort = useUiStore(s => s.bookmarkSort[pageKey]);
  const setBookmarkSort = useUiStore(s => s.setBookmarkSort);
  const clearBookmarkSort = useUiStore(s => s.clearBookmarkSort);
  const {
    data: allProperties = [],
  } = useCustomProperties();

  const sortableProperties = allProperties.filter(
    p => (SORTABLE_PROPERTY_TYPES as readonly string[]).includes(p.type),
  );

  const fieldOptions = [
    {
      value: RANDOM_FIELD,
      label: "Random",
    },
    {
      value: "title",
      label: "Title",
    },
    {
      value: "createdAt",
      label: "Date Added",
    },
    {
      value: "updatedAt",
      label: "Date Updated",
    },
    ...sortableProperties.map(p => ({
      value: p.id,
      label: p.name,
    })),
  ];

  const isRandom = sort != null && "random" in sort;
  const fieldsSort = sort && !isRandom ? sort : undefined;

  const primaryField = isRandom ? RANDOM_FIELD : fieldsSort?.primary.field ?? null;
  const primaryDir = fieldsSort?.primary.direction ?? "asc";
  const secondaryField = fieldsSort?.secondary?.field ?? null;
  const secondaryDir = fieldsSort?.secondary?.direction ?? "asc";

  function setPrimary(field: string | null, direction: SortDirection = primaryDir) {
    if (!field) {
      clearBookmarkSort(pageKey);
      return;
    }
    if (field === RANDOM_FIELD) {
      setBookmarkSort(pageKey, {
        random: true,
        seed: Math.random(),
      });
      return;
    }
    const next: BookmarkSort = {
      primary: {
        field,
        direction,
      },
      secondary: fieldsSort?.secondary,
    };
    setBookmarkSort(pageKey, next);
  }

  function setPrimaryDir(direction: SortDirection) {
    if (!fieldsSort) return;
    setBookmarkSort(pageKey, {
      primary: {
        field: fieldsSort.primary.field,
        direction,
      },
      secondary: fieldsSort.secondary,
    });
  }

  function setSecondary(field: string | null, direction: SortDirection = secondaryDir) {
    if (!fieldsSort) return;
    setBookmarkSort(pageKey, {
      primary: fieldsSort.primary,
      secondary: field
        ? {
          field,
          direction,
        }
        : undefined,
    });
  }

  function setSecondaryDir(direction: SortDirection) {
    if (!fieldsSort || !secondaryField) return;
    setBookmarkSort(pageKey, {
      primary: fieldsSort.primary,
      secondary: {
        field: secondaryField,
        direction,
      },
    });
  }

  function reshuffle() {
    setBookmarkSort(pageKey, {
      random: true,
      seed: Math.random(),
    });
  }

  const secondaryOptions = fieldOptions.filter(
    o => o.value !== primaryField && o.value !== RANDOM_FIELD,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Primary</span>
        <SortDimensionRow
          fieldOptions={fieldOptions}
          field={primaryField}
          direction={primaryDir}
          placeholder="Default order"
          showDirection={!isRandom}
          onFieldChange={field => setPrimary(field)}
          onDirectionChange={dir => setPrimaryDir(dir)}
        />
      </div>

      {primaryField != null && !isRandom && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Secondary</span>
          <SortDimensionRow
            fieldOptions={secondaryOptions}
            field={secondaryField}
            direction={secondaryDir}
            placeholder="None"
            onFieldChange={field => setSecondary(field)}
            onDirectionChange={dir => setSecondaryDir(dir)}
          />
        </div>
      )}

      {sort != null && (
        <div className="flex gap-2">
          {isRandom && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reshuffle}
            >
              Shuffle again
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => clearBookmarkSort(pageKey)}
          >
            Clear sort
          </Button>
        </div>
      )}
    </div>
  );
}

interface SortDimensionRowProps {
  fieldOptions: { value: string;
    label: string; }[];
  field: string | null;
  direction: SortDirection;
  placeholder: string;
  showDirection?: boolean;
  onFieldChange: (field: string | null) => void;
  onDirectionChange: (dir: SortDirection) => void;
}

function SortDimensionRow({
  fieldOptions,
  field,
  direction,
  placeholder,
  showDirection = true,
  onFieldChange,
  onDirectionChange,
}: SortDimensionRowProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={field ?? ""}
        onValueChange={v => onFieldChange(v === "" ? null : v)}
      >
        <SelectTrigger
          size="sm"
          className="min-w-36 flex-1"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">{placeholder}</SelectItem>
          {fieldOptions.map(opt => (
            <SelectItem
              key={opt.value}
              value={opt.value}
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {field != null && showDirection && (
        <ToggleGroup
          type="single"
          size="sm"
          value={direction}
          onValueChange={(v) => { if (v) onDirectionChange(v as SortDirection); }}
        >
          <ToggleGroupItem
            value="asc"
            aria-label="Ascending"
          >
            Asc
          </ToggleGroupItem>
          <ToggleGroupItem
            value="desc"
            aria-label="Descending"
          >
            Desc
          </ToggleGroupItem>
        </ToggleGroup>
      )}
    </div>
  );
}
