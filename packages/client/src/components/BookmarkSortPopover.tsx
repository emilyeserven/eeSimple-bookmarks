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

  const primaryField = sort?.primary.field ?? null;
  const primaryDir = sort?.primary.direction ?? "asc";
  const secondaryField = sort?.secondary?.field ?? null;
  const secondaryDir = sort?.secondary?.direction ?? "asc";

  function setPrimary(field: string | null, direction: SortDirection = primaryDir) {
    if (!field) {
      clearBookmarkSort(pageKey);
      return;
    }
    const next: BookmarkSort = {
      primary: {
        field,
        direction,
      },
      secondary: sort?.secondary,
    };
    setBookmarkSort(pageKey, next);
  }

  function setPrimaryDir(direction: SortDirection) {
    if (!primaryField) return;
    setBookmarkSort(pageKey, {
      primary: {
        field: primaryField,
        direction,
      },
      secondary: sort?.secondary,
    });
  }

  function setSecondary(field: string | null, direction: SortDirection = secondaryDir) {
    if (!primaryField || !sort) return;
    setBookmarkSort(pageKey, {
      primary: sort.primary,
      secondary: field
        ? {
          field,
          direction,
        }
        : undefined,
    });
  }

  function setSecondaryDir(direction: SortDirection) {
    if (!primaryField || !secondaryField || !sort) return;
    setBookmarkSort(pageKey, {
      primary: sort.primary,
      secondary: {
        field: secondaryField,
        direction,
      },
    });
  }

  const secondaryOptions = fieldOptions.filter(o => o.value !== primaryField);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Primary</span>
        <SortDimensionRow
          fieldOptions={fieldOptions}
          field={primaryField}
          direction={primaryDir}
          placeholder="Default order"
          onFieldChange={field => setPrimary(field)}
          onDirectionChange={dir => setPrimaryDir(dir)}
        />
      </div>

      {primaryField != null && (
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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => clearBookmarkSort(pageKey)}
        >
          Clear sort
        </Button>
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
  onFieldChange: (field: string | null) => void;
  onDirectionChange: (dir: SortDirection) => void;
}

function SortDimensionRow({
  fieldOptions,
  field,
  direction,
  placeholder,
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

      {field != null && (
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
