import type { SectionEntry, SectionEntryType } from "@eesimple/types";

import { useState } from "react";

import { SECTION_ENTRY_TYPE_LABELS } from "@eesimple/types";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

import { newSectionEntry } from "./sectionEntry";
import { SectionTagsPicker } from "./sectionTagsPicker";
import { SectionCollapseToggle } from "../SectionCollapseToggle";
import { SectionsSummary } from "../SectionsSummary";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** The shared Name / Type / Start / End input grid for a section entry or child. */
function SectionEntryInputs({
  entry, allowedTypes, onPatch,
}: {
  entry: SectionEntry;
  allowedTypes: SectionEntryType[];
  onPatch: (patch: Partial<SectionEntry>) => void;
}) {
  const {
    t,
  } = useTranslation();
  const numeric = entry.type === "page";
  // A `name`-only entry carries no positional value — hide the Start/End inputs (Name, Type, and the
  // optional Link URL stay).
  const nameOnly = entry.type === "name";
  const startPlaceholder = entry.type === "page" ? t("Start page") : entry.type === "timestamp" ? t("Start time") : t("URL");
  const endPlaceholder = entry.type === "page" ? t("End page") : entry.type === "timestamp" ? t("End time") : t("End URL (optional)");
  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        placeholder={t("Name")}
        value={entry.name}
        onChange={e => onPatch({
          name: e.target.value,
        })}
      />
      {allowedTypes.length > 1
        ? (
          <Select
            value={entry.type}
            onValueChange={type => onPatch({
              type: type as SectionEntryType,
              // Switching to a name-only entry drops any positional value so nothing stale persists.
              ...(type === "name"
                ? {
                  startValue: "",
                  endValue: undefined,
                }
                : {}),
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowedTypes.map(type => (
                <SelectItem
                  key={type}
                  value={type}
                >{t(SECTION_ENTRY_TYPE_LABELS[type])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
        : (
          <span
            className="flex items-center text-sm text-muted-foreground"
          >
            {t(SECTION_ENTRY_TYPE_LABELS[entry.type])}
          </span>
        )}
      {!nameOnly && (
        <>
          <Input
            placeholder={startPlaceholder}
            value={entry.startValue}
            type={numeric ? "number" : "text"}
            onChange={e => onPatch({
              startValue: e.target.value,
            })}
          />
          <Input
            placeholder={endPlaceholder}
            value={entry.endValue ?? ""}
            type={numeric ? "number" : "text"}
            onChange={e => onPatch({
              endValue: e.target.value || undefined,
            })}
          />
        </>
      )}
      <Input
        className="col-span-2"
        placeholder={t("Link URL (optional)")}
        type="url"
        value={entry.url ?? ""}
        onChange={e => onPatch({
          url: e.target.value || undefined,
        })}
      />
    </div>
  );
}

/** The "×" remove control shared by section rows and child rows. */
function RemoveEntryButton({
  label, onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="
        mt-1 text-lg leading-none text-muted-foreground
        hover:text-destructive
      "
      aria-label={label}
      onClick={onClick}
    >
      ×
    </button>
  );
}

/**
 * The per-entry "done" checkbox shown at the left edge of a section/sub-item row. Wrapped in a
 * hover tooltip since the row is too tight for a visible text label.
 */
function CompletedCheckbox({
  entry, onToggle,
}: {
  entry: SectionEntry;
  onToggle: (completed: boolean) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Checkbox
          className="mt-2.5"
          checked={entry.completed === true}
          aria-label={t("Completed")}
          onCheckedChange={checked => onToggle(checked === true)}
        />
      </TooltipTrigger>
      <TooltipContent>{t("Completed")}</TooltipContent>
    </Tooltip>
  );
}

/**
 * The per-entry "exclude from progress count" checkbox, rendered on its own labeled row below the
 * entry's Name/Type/Value inputs (see {@link SectionRow}) so it has room for a visible text label.
 */
function ExcludeFromProgressCheckbox({
  id, entry, onToggle,
}: {
  id: string;
  entry: SectionEntry;
  onToggle: (excludeFromProgress: boolean) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={entry.excludeFromProgress === true}
        onCheckedChange={checked => onToggle(checked === true)}
      />
      <Label
        htmlFor={id}
        className="text-xs font-normal text-muted-foreground"
      >
        {t("Exclude from progress count")}
      </Label>
    </div>
  );
}

/**
 * The per-entry "favorite" star toggle, rendered alongside the exclude checkbox and tag picker.
 * Starring is independent of the completed/exclude cascade — it flips only this entry's own flag.
 */
function FavoriteToggle({
  entry, onToggle,
}: {
  entry: SectionEntry;
  onToggle: (isFavorite: boolean) => void;
}) {
  const {
    t,
  } = useTranslation();
  const favorite = entry.isFavorite === true;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(`
            text-muted-foreground
            hover:text-amber-500
          `, favorite && "text-amber-500")}
          aria-label={favorite ? t("Unstar section") : t("Star section")}
          aria-pressed={favorite}
          onClick={() => onToggle(!favorite)}
        >
          <Star
            className="size-4"
            fill={favorite ? "currentColor" : "none"}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent>{favorite ? t("Starred") : t("Star this section")}</TooltipContent>
    </Tooltip>
  );
}

/** A same-size stand-in for {@link CompletedCheckbox}, shown when an entry is excluded from progress. */
function CompletedCheckboxSpacer() {
  return (
    <div
      className="mt-2.5 size-4"
      aria-hidden="true"
    />
  );
}

/** One tier-1 section entry, with an indented child editor for its second-tier items. */
export function SectionRow({
  entry, allowedTypes, defaultType, onChange, onRemove,
}: {
  entry: SectionEntry;
  allowedTypes: SectionEntryType[];
  defaultType: SectionEntryType;
  onChange: (entry: SectionEntry) => void;
  onRemove: () => void;
}) {
  const {
    t,
  } = useTranslation();
  const children = entry.children ?? [];
  const hasChildren = children.length > 0;
  const [collapsed, setCollapsed] = useState(false);
  const name = entry.name || t("section");
  return (
    <div className="space-y-2">
      <div
        className="grid items-start gap-2"
        style={{
          gridTemplateColumns: "auto auto 1fr auto",
        }}
      >
        <div className="mt-2.5 flex size-4 items-center justify-center">
          {hasChildren
            ? (
              <SectionCollapseToggle
                collapsed={collapsed}
                onToggle={() => setCollapsed(prev => !prev)}
                label={collapsed
                  ? t("Expand {{name}}", {
                    name,
                  })
                  : t("Collapse {{name}}", {
                    name,
                  })}
              />
            )
            : null}
        </div>
        {entry.excludeFromProgress === true
          ? <CompletedCheckboxSpacer />
          : (
            <CompletedCheckbox
              entry={entry}
              // Checking a section also checks all its sub-items (write-time cascade; unchecking too).
              onToggle={completed => onChange({
                ...entry,
                completed,
                ...(entry.children && {
                  children: entry.children.map(c => ({
                    ...c,
                    completed,
                  })),
                }),
              })}
            />
          )}
        <SectionEntryInputs
          entry={entry}
          allowedTypes={allowedTypes}
          onPatch={patch => onChange({
            ...entry,
            ...patch,
          })}
        />
        <RemoveEntryButton
          label={t("Remove section")}
          onClick={onRemove}
        />
      </div>
      <div
        className="grid items-start gap-2"
        style={{
          gridTemplateColumns: "auto auto 1fr auto",
        }}
      >
        <div />
        <div />
        <div className="flex flex-wrap items-center gap-3">
          <ExcludeFromProgressCheckbox
            id={`sections-exclude-${entry.id}`}
            entry={entry}
            // Excluding a section also excludes all its sub-items — only leaves are counted.
            onToggle={excludeFromProgress => onChange({
              ...entry,
              excludeFromProgress,
              ...(entry.children && {
                children: entry.children.map(c => ({
                  ...c,
                  excludeFromProgress,
                })),
              }),
            })}
          />
          <FavoriteToggle
            entry={entry}
            onToggle={isFavorite => onChange({
              ...entry,
              isFavorite,
            })}
          />
          <SectionTagsPicker
            tagIds={entry.tagIds}
            onChange={tagIds => onChange({
              ...entry,
              tagIds,
            })}
          />
        </div>
        <div />
      </div>
      {hasChildren && collapsed
        ? (
          <div className="ml-4 border-l pl-3">
            <SectionsSummary sections={[entry]} />
          </div>
        )
        : null}
      <div
        className={cn("ml-4 space-y-2 border-l pl-3", hasChildren && collapsed && `
          hidden
        `)}
      >
        {children.map(child => (
          <div
            key={child.id}
            className="space-y-2"
          >
            <div
              className="grid items-start gap-2"
              style={{
                gridTemplateColumns: "auto 1fr auto",
              }}
            >
              {child.excludeFromProgress === true
                ? <CompletedCheckboxSpacer />
                : (
                  <CompletedCheckbox
                    entry={child}
                    onToggle={completed => onChange({
                      ...entry,
                      children: children.map(c => c.id === child.id
                        ? {
                          ...c,
                          completed,
                        }
                        : c),
                    })}
                  />
                )}
              <SectionEntryInputs
                entry={child}
                allowedTypes={allowedTypes}
                onPatch={patch => onChange({
                  ...entry,
                  children: children.map(c => c.id === child.id
                    ? {
                      ...c,
                      ...patch,
                    }
                    : c),
                })}
              />
              <RemoveEntryButton
                label={t("Remove item")}
                onClick={() => onChange({
                  ...entry,
                  children: children.filter(c => c.id !== child.id),
                })}
              />
            </div>
            <div
              className="grid items-start gap-2"
              style={{
                gridTemplateColumns: "auto 1fr auto",
              }}
            >
              <div />
              <div className="flex flex-wrap items-center gap-3">
                <ExcludeFromProgressCheckbox
                  id={`sections-exclude-${child.id}`}
                  entry={child}
                  onToggle={excludeFromProgress => onChange({
                    ...entry,
                    children: children.map(c => c.id === child.id
                      ? {
                        ...c,
                        excludeFromProgress,
                      }
                      : c),
                  })}
                />
                <FavoriteToggle
                  entry={child}
                  onToggle={isFavorite => onChange({
                    ...entry,
                    children: children.map(c => c.id === child.id
                      ? {
                        ...c,
                        isFavorite,
                      }
                      : c),
                  })}
                />
                <SectionTagsPicker
                  tagIds={child.tagIds}
                  onChange={tagIds => onChange({
                    ...entry,
                    children: children.map(c => c.id === child.id
                      ? {
                        ...c,
                        tagIds,
                      }
                      : c),
                  })}
                />
              </div>
              <div />
            </div>
          </div>
        ))}
        <button
          type="button"
          className="
            text-xs text-primary
            hover:underline
          "
          onClick={() => onChange({
            ...entry,
            children: [...children, newSectionEntry(defaultType)],
          })}
        >
          {t("+ Add sub-item")}
        </button>
      </div>
    </div>
  );
}
